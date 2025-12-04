// script.js (validation + UX + animations)
const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbzrW2AzCvDwaWJFAy0X4XabdtZ_C2R7UlcizROgs-CRhRTDHrS4WmFKtHzKCRm-PES6vw/exec";

const form = document.getElementById("demoForm");
const status = document.getElementById("status");
const submitBtn = document.getElementById("submitBtn");

const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const nameError = document.getElementById("nameError");
const emailError = document.getElementById("emailError");

// Animation helpers (place after element queries)
const spinner = document.getElementById("spinner");
const check = document.getElementById("check");
const animWrap = document.getElementById("animWrap");

function showSpinner() {
  if (spinner) spinner.classList.remove("hidden");
  if (check) check.classList.add("hidden");
  if (animWrap) animWrap.style.display = "inline-block";
}

function hideSpinner() {
  if (spinner) spinner.classList.add("hidden");
}

/**
 * Show animated check for success.
 * Plays animations and hides after `duration` ms.
 */
function showSuccess(duration = 900) {
  if (spinner) spinner.classList.add("hidden");
  if (!check) return;

  check.classList.remove("hidden");
  check.offsetWidth; // force reflow to retrigger animation

  setTimeout(() => {
    check.classList.add("hidden");
    if (animWrap) animWrap.style.display = "none";
  }, duration);
}

/**
 * Trigger error shake on form
 */
function showErrorShake() {
  form.classList.add("form-shake");
  setTimeout(() => form.classList.remove("form-shake"), 400);
}

// Basic email regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate() {
  let valid = true;

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

// =========================
//    SUBMIT HANDLER
// =========================

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  status.textContent = "";

  const isValid = validate();
  if (!isValid) {
    status.textContent = "Please fix the errors above.";
    showErrorShake();
    return;
  }

  const payload = {
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
  };

  setLoading(true);
  showSpinner(); // show spinner before network request

  try {
    const res = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      try {
        const json = await res.json();

        if (json.status === "success") {
          status.textContent = json.message || "Saved!";
          showSuccess(900);
          form.reset();
        } else if (json.status === "error") {
          status.textContent = json.message || "Server validation error";

          if (json.code === "missing_name") {
            nameError.textContent = json.message;
          } else if (
            json.code === "missing_email" ||
            json.code === "invalid_email"
          ) {
            emailError.textContent = json.message;
          }

          showErrorShake();
        }
      } catch (err) {
        // CORS fallback success
        status.textContent =
          "Submitted (response unreadable due to CORS). Check Google Sheet.";
        showSuccess(900);
        form.reset();
      }
    } else {
      status.textContent = `Server returned HTTP ${res.status}`;
      showErrorShake();
    }
  } catch (err) {
    // try no-cors fallback
    try {
      await fetch(WEB_APP_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      status.textContent = "Submitted (no-cors fallback). Check Google Sheet.";
      showSuccess(900);
      form.reset();
    } catch (e2) {
      status.textContent = "Network error: " + e2.message;
      showErrorShake();
    }
  } finally {
    hideSpinner();
    setLoading(false);
  }
});
