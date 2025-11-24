const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbzrW2AzCvDwaWJFAy0X4XabdtZ_C2R7UlcizROgs-CRhRTDHrS4WmFKtHzKCRm-PES6vw/exec";
const form = document.getElementById("demoForm");
const status = document.getElementById("status");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  status.textContent = "Sending...";

  const payload = {
    name: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim(),
  };

  try {
    const res = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      // Try to parse JSON response if available (may be blocked by CORS)
      try {
        const json = await res.json();
        statusbar.textContent = `Success: ${json.status}`;
      } catch (e) {
        // opaque/empty response (CORS) — still likely delivered
        status.textContent =
          "Submitted (response not readable due to CORS). Check sheet.";
      }
    } else {
      statusbar.textContent = `Server error: ${res.status}`;
    }
  } catch (err) {
    // If fetch fails because of CORS or network, try the no-cors fallback
    try {
      await fetch(WEB_APP_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      status.textContent = "Submitted (no-cors fallback). Check Google Sheet.";
    } catch (e2) {
      statusbar.textContent = "Network error: " + e2.message;
    }
  }
});
