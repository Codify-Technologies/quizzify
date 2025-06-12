"use strict";

const DB_NAME = "QuizzifyDB";
const DB_VERSION = 2;
const USER_STORE = "users";
const ITEMS_PER_PAGE = 5;

let db;
let users = [];
let currentPage = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject("Failed to open DB");
    request.onsuccess = () => {
      db = request.result;
      resolve();
    };
  });
}

function getAllUsers() {
  return new Promise((resolve) => {
    const tx = db.transaction(USER_STORE, "readonly");
    const store = tx.objectStore(USER_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
  });
}

function deleteUser(email) {
  return new Promise((resolve) => {
    const tx = db.transaction(USER_STORE, "readwrite");
    tx.objectStore(USER_STORE).delete(email).onsuccess = resolve;
  });
}

function updateUser(updatedUser) {
  return new Promise((resolve) => {
    const tx = db.transaction(USER_STORE, "readwrite");
    tx.objectStore(USER_STORE).put(updatedUser).onsuccess = resolve;
  });
}

function renderUsers(userData) {
  const list = document.getElementById("userList");
  list.innerHTML = "";

  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageUsers = userData.slice(start, start + ITEMS_PER_PAGE);

  pageUsers.forEach((user) => {
    const card = document.createElement("div");
    card.className = "user-card";

    card.innerHTML = `
      <img src="${user.profilePicture || "https://via.placeholder.com/60"}" />
      <div class="user-info">
        <input value="${user.fullname}" data-field="fullname" data-email="${
      user.email
    }" />
        <input value="${user.nickname}" data-field="nickname" data-email="${
      user.email
    }" />
        <input value="${user.phone}" data-field="phone" data-email="${
      user.email
    }" />
        <input type="date" value="${user.dob}" data-field="dob" data-email="${
      user.email
    }" />
        <p><strong>Email:</strong> ${user.email}</p>
      </div>
      <div class="actions">
        <button class="save" data-email="${user.email}">💾 Save</button>
        <button class="delete" data-email="${user.email}">🗑️ Delete</button>
      </div>
    `;
    list.appendChild(card);
  });

  document.getElementById("pageInfo").textContent = `Page ${currentPage}`;
}

function attachEventListeners() {
  const searchInput = document.getElementById("searchInput");
  const sortSelect = document.getElementById("sortSelect");
  const prevPage = document.getElementById("prevPage");
  const nextPage = document.getElementById("nextPage");

  searchInput.addEventListener("input", filterAndRender);
  sortSelect.addEventListener("change", filterAndRender);

  prevPage.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      filterAndRender();
    }
  });

  nextPage.addEventListener("click", () => {
    if (currentPage * ITEMS_PER_PAGE < filteredUsers().length) {
      currentPage++;
      filterAndRender();
    }
  });

  document.getElementById("userList").addEventListener("click", async (e) => {
    const email = e.target.dataset.email;
    if (!email) return;

    if (e.target.classList.contains("delete")) {
      await deleteUser(email);
      users = await getAllUsers();
      filterAndRender();
    }

    if (e.target.classList.contains("save")) {
      const inputs = document.querySelectorAll(`input[data-email="${email}"]`);
      const updated = users.find((u) => u.email === email);
      inputs.forEach((input) => {
        updated[input.dataset.field] = input.value.trim();
      });
      await updateUser(updated);
      users = await getAllUsers();
      filterAndRender();
    }
  });
}

function filteredUsers() {
  const query = document.getElementById("searchInput").value.toLowerCase();
  const sortBy = document.getElementById("sortSelect").value;

  let filtered = users.filter(
    (user) =>
      user.fullname.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
  );

  if (sortBy === "fullname") {
    filtered.sort((a, b) => a.fullname.localeCompare(b.fullname));
  } else if (sortBy === "dob") {
    filtered.sort((a, b) => new Date(a.dob) - new Date(b.dob));
  }

  return filtered;
}

function filterAndRender() {
  renderUsers(filteredUsers());
}

document.addEventListener("DOMContentLoaded", async () => {
  await openDB();
  users = await getAllUsers();
  attachEventListeners();
  filterAndRender();
});
