// GET 요청을 처리하는 함수
function doGet(e) {
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  var data = sheet.getDataRange().getValues();
  var json = [];

  // 시트 데이터를 JSON 형식으로 변환
  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < data[0].length; j++) {
      row[data[0][j]] = data[i][j];
    }
    json.push(row);
  }

  return ContentService.createTextOutput(JSON.stringify(json))
      .setMimeType(ContentService.MimeType.JSON);
}

// POST 요청을 처리하는 함수
function doPost(e) {
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  var body = JSON.parse(e.postData.contents);

  // 새로운 행 추가
  sheet.appendRow([body.ID, body.Name, body.Age]);

  return ContentService.createTextOutput(JSON.stringify({result: 'success'}))
      .setMimeType(ContentService.MimeType.JSON);
}
