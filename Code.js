// GET 요청을 처리하는 함수
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify(getRecentRows()))
      .setMimeType(ContentService.MimeType.JSON);
}


// POST 요청을 처리하는 함수
function doPost(e) {
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  var body = JSON.parse(e.postData.contents);
  var timestamp = new Date(); // 현재 시간을 타임스탬프로 추가

  // 닉네임과 내용 글자 수 제한
  if (body.Nickname.length > 10) {
    return ContentService.createTextOutput(JSON.stringify({message: 'Nickname exceeds 10 characters'}))
        .setMimeType(ContentService.MimeType.JSON);
  }
  if (body.Content.length > 50) {
    return ContentService.createTextOutput(JSON.stringify({message: 'Content exceeds 50 characters'}))
        .setMimeType(ContentService.MimeType.JSON);
  }

  // 마지막 행의 시간 가져오기
  var lastRow = sheet.getLastRow();
  var lastTimestamp = sheet.getRange(lastRow, 1).getValue();
  
  if (lastTimestamp) {
    var timeDifference = (timestamp - new Date(lastTimestamp)) / 1000; // 시간 차이 (초 단위)
    if (timeDifference < 5) {
      return ContentService.createTextOutput(JSON.stringify(getRecentRows()))
      .setMimeType(ContentService.MimeType.JSON);
    }
  }

  // 새로운 행 추가
  sheet.appendRow([timestamp, body.Nickname, body.Content]);

  // 최근 20개의 행 가져오기
  var recentRows = getRecentRows().json;

  // 오픈 API 요청 보내기
  var responseText = sendOpenAiRequest(recentRows);
  
  // GPT-3의 응답을 구글 시트에 추가
  sheet.appendRow([new Date(), 'GPTs_Answer_Assistant', responseText]);

  // 업데이트된 최근 20개의 행 가져오기
  var updatedRows = getRecentRows().json;

  return ContentService.createTextOutput(JSON.stringify(updatedRows))
      .setMimeType(ContentService.MimeType.JSON);
}

// 최근 20개의 행을 가져오는 함수
function getRecentRows() {
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  var lastRow = sheet.getLastRow();
  var dataRange = sheet.getRange(Math.max(1, lastRow - 19), 1, Math.min(20, lastRow), 3);
  var data = dataRange.getValues();
  var json = [];

  // 시트 데이터를 JSON 형식으로 변환
  for (var i = 0; i < data.length; i++) {
    var row = {
      'Time': data[i][0],
      'Nickname': data[i][1],
      'Content': data[i][2]
    };
    json.push(row);
  }

  return {
    json: json
  };
}


function sendOpenAiRequest(recentRows) {
  var json = [];

  var promptText = 'The Nickname GPT_you is you. You are CATCEO. CATCEO is a service for sharing charming and adorable cats. You can get random cat photos through an API. The following sentences are what people are saying to you. Respond in a fun way.';
  var systemText = {
    "role": "system",
    "content": promptText
  };
  json.push(systemText);

  recentRows.forEach(function(row) {
    var nickname_index = (row.Nickname === "GPTs_Answer_Assistant") ? "assistant" : "user";
    
    var rowContent = {
      "role": nickname_index,
      "content": String(row.Content),  // Ensure content is a string
      "time": row.Time
    };
    json.push(rowContent);
  });

  var url = 'https://api.openai.com/v1/chat/completions';
  var headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + OPENAI_API_KEY
  };
  var data = {
    'model': 'gpt-3.5-turbo',
    'temperature': 0.5,
    'messages': json,
  };
  var options = {
    'method': 'post',
    'headers': headers,
    'payload': JSON.stringify(data)
  };
  var response = UrlFetchApp.fetch(url, options);
  var result = JSON.parse(response.getContentText());
  
  // Fetch a cat image URL
  var catImageUrl = fetchCatImageUrl();
  
  // Return the response with the cat image URL
  return result.choices[0].message.content + '\n' + catImageUrl;
}


function fetchCatImageUrl() {
  var url = 'https://api.thecatapi.com/v1/images/search';
  var response = UrlFetchApp.fetch(url);
  var result = JSON.parse(response.getContentText());
  return result[0].url; // Get the URL of the cat image
}
