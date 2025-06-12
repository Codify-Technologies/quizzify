"use strict";

// ========== IndexedDB Wrapper for Quizzify ==========
const DB_NAME = "QuizzifyDB";
const DB_VERSION = 2;
const USER_STORE = "users";

let dbInstance;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("Database open error:", event.target.error);
      reject("Could not connect to the database.");
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(USER_STORE)) {
        const userStore = db.createObjectStore(USER_STORE, {
          keyPath: "email",
        });
        userStore.createIndex("nickname", "nickname", { unique: true });
        userStore.createIndex("phone", "phone", { unique: true });
      }
    };
  });
}

function addUser(user) {
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(USER_STORE, "readwrite");
    const store = tx.objectStore(USER_STORE);
    const request = store.add(user);

    request.onsuccess = () => resolve();
    request.onerror = (e) => reject(e.target.error);
  });
}

function checkUserDuplicates(email, phone, nickname) {
  return new Promise((resolve) => {
    const issues = [];
    const tx = dbInstance.transaction(USER_STORE, "readonly");
    const store = tx.objectStore(USER_STORE);
    let checks = 0;

    const checkDone = () => {
      checks++;
      if (checks === 3) resolve(issues);
    };

    // Email (primary key)
    const emailCheck = store.get(email);
    emailCheck.onsuccess = () => {
      if (emailCheck.result) issues.push("Email already in use.");
      checkDone();
    };
    emailCheck.onerror = checkDone;

    // Phone (index)
    const phoneCheck = store.index("phone").get(phone);
    phoneCheck.onsuccess = () => {
      if (phoneCheck.result) issues.push("Phone number already in use.");
      checkDone();
    };
    phoneCheck.onerror = checkDone;

    // Nickname (index)
    const nicknameCheck = store.index("nickname").get(nickname);
    nicknameCheck.onsuccess = () => {
      if (nicknameCheck.result) issues.push("Nickname already in use.");
      checkDone();
    };
    nicknameCheck.onerror = checkDone;
  });
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function sanitizeInput(input) {
  return input.replace(/[<>"'/]/g, "");
}

// ========== DOM & Registration Logic ==========

document.addEventListener("DOMContentLoaded", async () => {
  await openDB();

  // Loader
  setTimeout(() => {
    const loader = document.getElementById("loading-screen");
    if (loader) loader.style.display = "none";
  }, 5000);

  // Toggle password
  const togglePassword = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");
  if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", () => {
      const isPassword = passwordInput.type === "password";
      passwordInput.type = isPassword ? "text" : "password";
      togglePassword.textContent = isPassword ? "🙈" : "👁️";
    });
  }

  const registerForm = document.getElementById("registerForm");
  const errorContainer = document.getElementById("form-error");
  const previewContainer = document.getElementById("profilePreview");

  let sanitized = {};

  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorContainer.textContent = "";
      const formData = new FormData(registerForm);
      const fields = [
        "fullname",
        "email",
        "phone",
        "dob",
        "nickname",
        "password",
      ];
      sanitized = {};
      const errors = [];

      for (let field of fields) {
        const raw = formData.get(field);
        const value = typeof raw === "string" ? raw.trim() : "";
        if (!value) {
          errors.push(
            `${field.charAt(0).toUpperCase() + field.slice(1)} is required.`
          );
        } else {
          sanitized[field] = sanitizeInput(value);
        }
      }

      const file = formData.get("profile_picture");
      if (file && file.size > 0) {
        const allowed = ["image/png", "image/jpeg"];
        if (!allowed.includes(file.type)) {
          errors.push("Only PNG and JPG files are allowed.");
        } else {
          sanitized.profilePicture = await toBase64(file);
        }
      }

      // Only proceed to duplicate check if required fields are filled
      if (errors.length === 0) {
        const dupErrors = await checkUserDuplicates(
          sanitized.email,
          sanitized.phone,
          sanitized.nickname
        );
        if (dupErrors.length) errors.push(...dupErrors);
      }

      if (errors.length > 0) {
        errorContainer.innerHTML = errors
          .map((err) => `<div class="alert error">${err}</div>`)
          .join("");
        return;
      }

      // Show profile preview
      previewContainer.innerHTML = `
        <h3>Confirm Your Details</h3>
        ${
          sanitized.profilePicture
            ? `<img src="${sanitized.profilePicture}" alt="Profile Picture" />`
            : `<div style="margin-bottom: 1rem; font-size: 0.9rem; color: gray;">No profile picture uploaded.</div>`
        }
        <p><strong>Full Name:</strong> ${sanitized.fullname}</p>
        <p><strong>Nickname:</strong> ${sanitized.nickname}</p>
        <p><strong>Email:</strong> ${sanitized.email}</p>
        <p><strong>Phone:</strong> ${sanitized.phone}</p>
        <p><strong>Date of Birth:</strong> ${sanitized.dob}</p>
        <div class="actions">
          <button id="continueBtn" type="button">Continue</button>
          <button id="goBackBtn" type="button">Go Back</button>
        </div>
      `;

      registerForm.style.display = "none";
      previewContainer.style.display = "block";

      setTimeout(() => {
        document.getElementById("goBackBtn").addEventListener("click", () => {
          previewContainer.style.display = "none";
          registerForm.style.display = "block";
        });

        document
          .getElementById("continueBtn")
          .addEventListener("click", async () => {
            try {
              await addUser(sanitized);
              alert("Registration successful!");
              window.location.href = "login.html";
            } catch (err) {
              alert("Registration failed: " + err);
            }
          });
      }, 0);
    });
  }
});
