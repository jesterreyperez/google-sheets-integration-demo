// script.js (with validation + UX)
const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbzrW2AzCvDwaWJFAy0X4XabdtZ_C2R7UlcizROgs-CRhRTDHrS4WmFKtHzKCRm-PES6vw/exec";
const form = document.getElementById("demoForm");
const status = document.getElementById("status");
const submitBtn = document.getElementById("submitBtn");

const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const nameError = document.getElementById("nameError");
const emailError = document.getElementById("emailError");

// Simple email regex — good enough for most demos (not RFC perfect)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate() {
  let valid = true;

  // Clear previous errors
  nameError.textContent = "";
  emailError.textContent = "";

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();

  if (!name) {
    nameError.textContent = "Please enter your name.";
    valid = false;
  }

  if (!email) {
    emailError.textContent = "Please enter your email.";
    valid = false;
  } else if (!emailRegex.test(email)) {
    emailError.textContent = "Please enter a valid email address.";
    valid = false;
  }

  return valid;
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.textContent = isLoading ? "Sending..." : "Submit";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Clear global status
  status.textContent = "";

  // Validate — if fails, bail out
  const isValid = validate();
  if (!isValid) {
    status.textContent = "Please fix the errors above.";
    return;
  }

  // Build payload
  const payload = {
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
  };

  // UX: disable button while sending
  setLoading(true);

  try {
    const res = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      // Try to parse server JSON. If CORS blocks this, the catch below handles it.
      try {
        const json = await res.json();
        if (json.status === "success") {
          status.textContent = json.message || "Saved!";
          form.reset();
        } else if (json.status === "error") {
          // Use server error codes/messages to show inline feedback
          status.textContent = json.message || "Server validation error";

          // Example: show field-specific errors
          if (json.code === "missing_name") {
            nameError.textContent = json.message;
          } else if (
            json.code === "missing_email" ||
            json.code === "invalid_email"
          ) {
            emailError.textContent = json.message;
          } else {
            // generic server error, show in global status
            status.textContent = json.message || "Server error";
          }
        } else {
          status.textContent = "Unexpected server response.";
        }
      } catch (err) {
        // Likely CORS made response unreadable — fallback behavior
        status.textContent =
          "Submitted (response unreadable due to CORS). Check Google Sheet.";
        form.reset();
      }
    } else {
      status.textContent = `Server returned HTTP ${res.status}`;
    }
  } catch (err) {
    // fallback to no-cors attempt (may still deliver)
    try {
      await fetch(WEB_APP_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      status.textContent = "Submitted (no-cors fallback). Check Google Sheet.";
      form.reset();
    } catch (e2) {
      status.textContent = "Network error: " + e2.message;
    }
  } finally {
    setLoading(false);
  }
});
