document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".card-img-top").forEach(function (img) {
    img.style.cursor = "pointer";
    img.addEventListener("click", function () {
      var modalImg = document.getElementById("modalImg");
      modalImg.src = img.src;
      modalImg.alt = img.alt;
      var modal = new bootstrap.Modal(document.getElementById("imageModal"));
      modal.show();
    });
  });
});

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".btn-contact").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const phone = btn.getAttribute("data-phone");
      const name = btn.getAttribute("data-name");
      let modal = document.createElement("div");
      modal.className = "modal fade show";
      modal.style.display = "block";
      modal.innerHTML = `
              <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                  <div class="modal-header">
                    <h5 class="modal-title">${name}</h5>
                    <button type="button" class="btn-close" aria-label="Close"></button>
                  </div>
                  <div class="modal-body text-center">
                    <p>Телефон: <b>${phone}</b></p>
                  </div>
                </div>
              </div>
            `;
      document.body.appendChild(modal);
      modal.querySelector(".btn-close").onclick = function () {
        modal.classList.remove("show");
        modal.style.display = "none";
        setTimeout(() => modal.remove(), 300);
      };
      modal.onclick = function (e) {
        if (e.target === modal) {
          modal.classList.remove("show");
          modal.style.display = "none";
          setTimeout(() => modal.remove(), 300);
        }
      };
    });
  });
});

// Sign-in/sign-out logic
function updateAddApartButton() {
  const addApartBtn = document.getElementById("add-apart-btn");
  if (!addApartBtn) return;
  if (
    typeof ApartState !== "undefined" &&
    ApartState.email &&
    ApartState.email.trim().length > 0
  ) {
    addApartBtn.style.display = "inline-block";
  } else {
    addApartBtn.style.display = "none";
  }
}
let ApartState = { email: "" };
const signInBtn = document.getElementById("sign-in-btn");
const signInOverlay = document.getElementById("SignInModalOverlay");
function updateSignInButton() {
  if (!signInBtn) return;
  if (
    typeof ApartState !== "undefined" &&
    ApartState.email &&
    ApartState.email.trim().length > 0
  ) {
    signInBtn.textContent = "Sign out";
  } else {
    signInBtn.textContent = "Sign in";
  }
}
function openSignInModal() {
  if (signInOverlay) signInOverlay.style.display = "flex";
}
function closeSignInModal() {
  if (signInOverlay) signInOverlay.style.display = "none";
}
window.closeSignInModal = closeSignInModal;
if (signInBtn) {
  signInBtn.addEventListener("click", function () {
    if (
      typeof ApartState === "undefined" ||
      !ApartState.email ||
      ApartState.email.trim().length === 0
    ) {
      openSignInModal();
    } else {
      ApartState.email = "";
      updateSignInButton();
      if (typeof updateAddApartButton === "function") updateAddApartButton();
    }
  });
}
updateSignInButton();

// Sign-in form submit
const signInForm = document.getElementById("SignInForm");
if (signInForm) {
  signInForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const email = document.getElementById("SignInEmail").value.trim();
    const password = document.getElementById("SignInPassword").value;
    const err = document.getElementById("SignInError");
    err.style.display = "none";
    try {
      const res = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        err.textContent = data.error || "Login failed";
        err.style.display = "block";
        return;
      }
      closeSignInModal();
      ApartState.email = email;
      console.log("Logged in as:", ApartState.email);
      updateSignInButton();
      updateAddApartButton();
      alert("Welcome, " + email + "!");
    } catch (e) {
      err.textContent = "Server error";
      err.style.display = "block";
    }
  });
}

// Add apart modal logic
const addApartBtn = document.getElementById("add-apart-btn");
const addApartOverlay = document.getElementById("AddApartOverlay");
function openAddModal() {
  if (addApartOverlay) addApartOverlay.style.display = "flex";
}
function closeAddModal() {
  if (addApartOverlay) addApartOverlay.style.display = "none";
}
window.closeAddModal = closeAddModal;
if (addApartBtn) {
  addApartBtn.addEventListener("click", openAddModal);
}
// Показываем кнопку при загрузке страницы
updateAddApartButton();

// Add apart form submit
const addForm = document.getElementById("AddForm");
if (addForm) {
  addForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const AddApart = document.getElementById("AddApart").value.trim();
    const AddFileInput = document.getElementById("AddFile");
    const errorDiv = document.getElementById("AddError");
    errorDiv.style.display = "none";
    if (!AddFileInput.files.length || !AddApart) {
      errorDiv.textContent = "Fill in all fields";
      errorDiv.style.display = "block";
      return;
    }
    const formData = new FormData();
    formData.append("AddApart", AddApart);
    formData.append("AddFile", AddFileInput.files[0]);
    try {
      const res = await fetch("/add-apart-full", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        errorDiv.textContent = data.error || "Error saving apartment";
        errorDiv.style.display = "block";
        return;
      }
      errorDiv.style.display = "none";
      addForm.reset();
      alert("Apartment added!");
      closeAddModal();
    } catch (e) {
      errorDiv.textContent = "Server error";
      errorDiv.style.display = "block";
    }
  });
}
