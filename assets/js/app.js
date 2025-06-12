// ========== Theme Toggle Logic ==========
const toggleButton = document.querySelector(".theme-toggle");

toggleButton.addEventListener("click", () => {
  document.body.classList.toggle("light-mode");
  localStorage.setItem(
    "theme",
    document.body.classList.contains("light-mode") ? "light" : "dark"
  );
});

// Apply saved theme on load
window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") {
    document.body.classList.add("light-mode");
  }
});

// ========== Quiz App Initialization ==========
document.addEventListener("DOMContentLoaded", () => {
  initDB(); // Initialize IndexedDB
});

// ========== IndexedDB Setup ==========
let db;

function initDB() {
  const request = indexedDB.open("QuizzifyDB", 1);

  request.onerror = (event) => {
    console.error("Database error:", event.target.errorCode);
    showDatabaseErrorPopup();
  };

  request.onsuccess = (event) => {
    db = event.target.result;
    console.log("Database initialized");
    loadQuestions();
  };

  request.onupgradeneeded = (event) => {
    db = event.target.result;
    const questionStore = db.createObjectStore("questions", {
      keyPath: "id",
      autoIncrement: true,
    });
    questionStore.createIndex("difficulty", "difficulty", { unique: false });

    const scoreStore = db.createObjectStore("scores", {
      keyPath: "id",
      autoIncrement: true,
    });
    scoreStore.createIndex("value", "value", { unique: false });

    seedQuestions(questionStore);
  };
}

function seedQuestions(store) {
  const sampleQuestions = [
    {
      question: "What does HTML stand for?",
      options: [
        "Hyper Text Markup Language",
        "Home Tool Markup Language",
        "Hyperlinks and Text Markup Language",
        "None of the above",
      ],
      answer: 0,
      difficulty: "easy",
    },
    {
      question: "Which language runs in a web browser?",
      options: ["Java", "C", "Python", "JavaScript"],
      answer: 3,
      difficulty: "easy",
    },
    // Add more questions as needed
  ];

  sampleQuestions.forEach((q) => store.add(q));
}

// ========== Load Questions ==========
function loadQuestions() {
  const transaction = db.transaction("questions", "readonly");
  const store = transaction.objectStore("questions");

  const request = store.getAll();

  request.onsuccess = (event) => {
    const questions = event.target.result;
    console.log("Loaded Questions:", questions);
    // You can now render the questions or store them in a variable
  };
}

// ========== Save Score ==========
function saveScore(scoreValue) {
  const transaction = db.transaction("scores", "readwrite");
  const store = transaction.objectStore("scores");

  const score = {
    value: scoreValue,
    date: new Date().toISOString(),
  };

  const request = store.add(score);

  request.onsuccess = () => {
    console.log("Score saved");
  };

  request.onerror = () => {
    console.error("Error saving score");
  };
}

// ========== Utility: Timer Example ==========
function startTimer(duration, display) {
  let timer = duration,
    minutes,
    seconds;
  const interval = setInterval(() => {
    minutes = Math.floor(timer / 60);
    seconds = timer % 60;

    display.textContent = `${minutes}:${
      seconds < 10 ? "0" + seconds : seconds
    }`;

    if (--timer < 0) {
      clearInterval(interval);
      display.textContent = "Time's up!";
    }
  }, 1000);
}

// ========== Show Error Popup ==========
function showDatabaseErrorPopup() {
  const popup = document.createElement("div");
  popup.textContent = "Sorry, could not connect to database!";
  popup.style.position = "fixed";
  popup.style.top = "50%";
  popup.style.left = "50%";
  popup.style.transform = "translate(-50%, -50%)";
  popup.style.backgroundColor = "#ff4d4f";
  popup.style.color = "white";
  popup.style.padding = "1.5rem 2rem";
  popup.style.borderRadius = "10px";
  popup.style.boxShadow = "0 10px 25px rgba(0, 0, 0, 0.2)";
  popup.style.zIndex = "9999";
  popup.style.fontSize = "1.2rem";
  popup.style.fontWeight = "bold";
  popup.style.textAlign = "center";
  document.body.appendChild(popup);
}
