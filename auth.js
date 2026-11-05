document.addEventListener("DOMContentLoaded", () => {
  const tabLoginBtn = document.getElementById("tabLoginBtn");
  const tabRegisterBtn = document.getElementById("tabRegisterBtn");
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const authAlert = document.getElementById("authAlert");

  tabLoginBtn.addEventListener("click", () => {
    tabLoginBtn.classList.add("active");
    tabRegisterBtn.classList.remove("active");
    loginForm.style.display = "block";
    registerForm.style.display = "none";
    hideAlert();
  });

  tabRegisterBtn.addEventListener("click", () => {
    tabRegisterBtn.classList.add("active");
    tabLoginBtn.classList.remove("active");
    registerForm.style.display = "block";
    loginForm.style.display = "none";
    hideAlert();
  });

  // Handle Login
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    hideAlert();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Login failed");
        window.location.href = "/manager.html";
      })
      .catch((err) => {
        showAlert(err.message, "error");
      });
  });

  // Handle Register
  registerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    hideAlert();

    const name = document.getElementById("regName").value.trim();
    const rollNo = document.getElementById("regRoll").value.trim();
    const course = document.getElementById("regCourse").value.trim();
    const institution = document.getElementById("regInstitution").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value;
    const confirmPassword = document.getElementById("regConfirmPassword").value;

    if (password.length < 8) {
      showAlert("Password must be at least 8 characters long", "error");
      return;
    }
    if (password !== confirmPassword) {
      showAlert("Passwords do not match", "error");
      return;
    }

    fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, rollNo, course, institution, email, password })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Registration failed");
        window.location.href = "/manager.html";
      })
      .catch((err) => {
        showAlert(err.message, "error");
      });
  });

  function showAlert(msg, type) {
    authAlert.className = `alert alert-${type}`;
    authAlert.textContent = msg;
    authAlert.style.display = "block";
  }

  function hideAlert() {
    authAlert.style.display = "none";
  }
});
