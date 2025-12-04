// apps-script-code.gs
// doPost with server-side validation + duplicate-prevention (recent window)

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Build JSON response via ContentService
 */
function buildJsonOutput(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/**
 * Configuration
 */
const DUPLICATE_WINDOW_HOURS = 24; // look back this many hours for duplicate emails
const SHEET_NAME = "Sheet1"; // adjust if your sheet uses a different name
const TIMESTAMP_COL_INDEX = 1; // 1-based column index in the sheet where timestamp is stored
const EMAIL_COL_INDEX = 3; // 1-based column index where Email is stored (Timestamp | Name | Email)

/**
 * Parse ISO timestamp string or Date object to ms
 */
function toMillis(d) {
  if (!d) return 0;
  return d instanceof Date ? d.getTime() : new Date(d).getTime();
}

/**
 * Main entry
 */
function doPost(e) {
  try {
    // Parse body safely
    const body = e.postData && e.postData.contents ? e.postData.contents : "{}";
    const data = JSON.parse(body);

    const name = (data.name || "").toString().trim();
    const emailRaw = (data.email || "").toString().trim();
    const email = emailRaw.toLowerCase(); // normalize for case-insensitive comparison

    // Basic server-side validation
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

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      return buildJsonOutput({
        status: "error",
        code: "sheet_missing",
        message: `Sheet "${SHEET_NAME}" not found.`,
      });
    }

    // Determine how many rows to read. We will read all used rows (except header)
    const lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      // at least one data row exists (assuming row 1 is header)
      const range = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()); // all data rows
      const values = range.getValues(); // array of rows: [ [timestamp, name, email], ... ]

      const nowMs = new Date().getTime();
      const windowMs = DUPLICATE_WINDOW_HOURS * 60 * 60 * 1000;

      // Scan rows bottom-to-top (recent entries likely near the bottom)
      for (let i = values.length - 1; i >= 0; i--) {
        const row = values[i];
        // Note: TIMESTAMP_COL_INDEX and EMAIL_COL_INDEX are 1-based, convert to 0-based:
        const tsVal = row[TIMESTAMP_COL_INDEX - 1];
        const emailVal = (row[EMAIL_COL_INDEX - 1] || "")
          .toString()
          .trim()
          .toLowerCase();

        // If email matches, check timestamp window
        if (emailVal && emailVal === email) {
          const rowTimeMs = toMillis(tsVal);
          // If we can't parse timestamp, be conservative and treat it as a duplicate
          if (!rowTimeMs || nowMs - rowTimeMs <= windowMs) {
            return buildJsonOutput({
              status: "error",
              code: "duplicate_recent",
              message: `A submission for this email was received within the last ${DUPLICATE_WINDOW_HOURS} hour(s).`,
            });
          } else {
            // found same email but older than window — allow insert
            break;
          }
        }
      }
    }

    // Passed duplicate check — append the row
    sheet.appendRow([new Date(), name, emailRaw]); // store original-case email for readability

    return buildJsonOutput({ status: "success", message: "Saved" });
  } catch (err) {
    return buildJsonOutput({
      status: "error",
      code: "server_error",
      message: err.message,
    });
  }
}
