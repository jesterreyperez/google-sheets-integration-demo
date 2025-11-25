// apps-script-code.gs
// Receives POSTed JSON and appends to the active spreadsheet (Sheet1)

function doPost(e) {
  try {
    // e.postData.contents contains the raw POST body as a string
    var body = e.postData && e.postData.contents ? e.postData.contents : "{}";
    var data = JSON.parse(body);

    // Get the active spreadsheet and sheet
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Sheet1");

    // Append a new row: Timestamp, Name, Email
    sheet.appendRow([new Date(), data.name || "", data.email || ""]);

    // Return a JSON success response
    var output = ContentService.createTextOutput(
      JSON.stringify({ status: "success" })
    ).setMimeType(ContentService.MimeType.JSON);

    return output;
  } catch (err) {
    // Return a JSON error response
    var output = ContentService.createTextOutput(
      JSON.stringify({ status: "error", message: err.message })
    ).setMimeType(ContentService.MimeType.JSON);
    return output;
  }
}
