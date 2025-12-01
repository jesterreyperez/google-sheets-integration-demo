// apps-script-code.gs
// doPost with server-side validation for name + email

// Simple email regex (practical, not RFC-perfect)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function buildJsonOutput(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function doPost(e) {
  try {
    // Read body safely
    var body = e.postData && e.postData.contents ? e.postData.contents : "{}";
    var data = JSON.parse(body);

    var name = (data.name || "").toString().trim();
    var email = (data.email || "").toString().trim();

    // Server-side validation
    if (!name) {
      return buildJsonOutput({
        status: "error",
        code: "missing_name",
        message: "Name is required.",
      });
    }
    if (!email) {
      return buildJsonOutput({
        status: "error",
        code: "missing_email",
        message: "Email is required.",
      });
    }
    if (!EMAIL_REGEX.test(email)) {
      return buildJsonOutput({
        status: "error",
        code: "invalid_email",
        message: "Email format is invalid.",
      });
    }

    // At this point valid — append to sheet
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Sheet1");

    sheet.appendRow([new Date(), name, email]);

    return buildJsonOutput({ status: "success", message: "Saved" });
  } catch (err) {
    // Unexpected server error
    return buildJsonOutput({
      status: "error",
      code: "server_error",
      message: err.message,
    });
  }
}
