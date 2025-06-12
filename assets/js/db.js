// ========== IndexedDB Wrapper for Quizzify ==========
const DB_NAME = "QuizzifyDB";
const DB_VERSION = 2; // Increased due to user store addition
const QUESTION_STORE = "questions";
const SCORE_STORE = "scores";
const USER_STORE = "users";

let dbInstance;

// Open or initialize the IndexedDB
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

      // Create questions store
      if (!db.objectStoreNames.contains(QUESTION_STORE)) {
        const questionStore = db.createObjectStore(QUESTION_STORE, {
          keyPath: "id",
          autoIncrement: true,
        });
        questionStore.createIndex("difficulty", "difficulty", {
          unique: false,
        });
      }

      // Create scores store
      if (!db.objectStoreNames.contains(SCORE_STORE)) {
        const scoreStore = db.createObjectStore(SCORE_STORE, {
          keyPath: "id",
          autoIncrement: true,
        });
        scoreStore.createIndex("value", "value", { unique: false });
      }

      // Create users store
      if (!db.objectStoreNames.contains(USER_STORE)) {
        const userStore = db.createObjectStore(USER_STORE, {
          keyPath: "email",
        }); // email is unique key
        userStore.createIndex("nickname", "nickname", { unique: true });
      }
    };
  });
}

// ========== USER FUNCTIONS ==========

// Add a new user
function addUser(user) {
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(USER_STORE, "readwrite");
    const store = tx.objectStore(USER_STORE);
    const request = store.add(user);

    request.onsuccess = () => resolve();
    request.onerror = (e) => reject(e.target.error);
  });
}

// Get user by email
function getUserByEmail(email) {
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(USER_STORE, "readonly");
    const store = tx.objectStore(USER_STORE);
    const request = store.get(email);

    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

// Get all users
function getAllUsers() {
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(USER_STORE, "readonly");
    const store = tx.objectStore(USER_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

// ========== QUESTION FUNCTIONS ==========

function addQuestion(questionObj) {
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(QUESTION_STORE, "readwrite");
    const store = tx.objectStore(QUESTION_STORE);
    const request = store.add(questionObj);

    request.onsuccess = () => resolve();
    request.onerror = (e) => reject(e.target.error);
  });
}

function getAllQuestions() {
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(QUESTION_STORE, "readonly");
    const store = tx.objectStore(QUESTION_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

function getQuestionsByDifficulty(level) {
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(QUESTION_STORE, "readonly");
    const store = tx.objectStore(QUESTION_STORE);
    const index = store.index("difficulty");
    const request = index.getAll(level);

    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

// ========== SCORE FUNCTIONS ==========

function saveUserScore(scoreValue) {
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(SCORE_STORE, "readwrite");
    const store = tx.objectStore(SCORE_STORE);
    const score = {
      value: scoreValue,
      date: new Date().toISOString(),
    };
    const request = store.add(score);

    request.onsuccess = () => resolve();
    request.onerror = (e) => reject(e.target.error);
  });
}

function getAllScores() {
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(SCORE_STORE, "readonly");
    const store = tx.objectStore(SCORE_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

// ========== EXPORTS ==========
export {
  openDB,
  addUser,
  getUserByEmail,
  getAllUsers,
  addQuestion,
  getAllQuestions,
  getQuestionsByDifficulty,
  saveUserScore,
  getAllScores,
};
