import { db, currentUser } from "./login.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

let data = [];
let index = 0;
let isFlipped = false;
let isSliding = false;
let hasMoved = false;
let knownStatus = {};
let currentUserUid = null;
const dataName = new URLSearchParams(window.location.search).get("data");

const card = document.getElementById("card");
const question = document.getElementById("question");
const answer = document.getElementById("answer");
const counter = document.getElementById("counter");
const jumpSelect = document.getElementById("jumpSelect");
const scene = document.querySelector(".scene");

if (!dataName) {
  document.body.innerHTML = `<h2 style="color:#fff">Veri seçilmedi</h2><p style="color:#9ca3af">Ana sayfadan kart seç.</p>`;
  throw new Error("data parametresi yok");
}

// JSON yükleme
fetch(`assets/data/${dataName}.json`)
  .then(r => r.ok ? r.json() : Promise.reject("JSON bulunamadı"))
  .then(json => {
    data = json.cards || [];
    document.getElementById("pageTitle").textContent = json.title || "";
    document.getElementById("pageDescription").textContent = json.description || "";

    index = Number(localStorage.getItem(`lastIndex_${dataName}`)) || 0;

    waitForUserAndLoadProgress();
  })
  .catch(err => console.error("JSON yükleme hatası:", err));

// Kullanıcı hazır olana kadar bekle
function waitForUserAndLoadProgress() {
  const interval = setInterval(() => {
    if (currentUser !== undefined) {
      clearInterval(interval);
      currentUserUid = currentUser?.uid ?? null;
      loadProgress();
    }
  }, 50);
}

// Progress yükleme
// loadProgress güncel hali
async function loadProgress() {
  // firebase veya misafir localStorage
  if (currentUserUid) {
    try {
      const docRef = doc(db, "users", currentUserUid, "progress", dataName);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        knownStatus = docSnap.data().knownStatus || {};
        index = docSnap.data().lastIndex ?? index;
      }
    } catch (err) {
      console.error("Firebase progress yüklenemedi:", err);
    }
  } else {
    const stored = localStorage.getItem(`progress_${dataName}`);
    knownStatus = stored ? JSON.parse(stored) : {};
  }

  // Eksik indexleri unknown ata
  data.forEach((_, i) => { if (!knownStatus[i]) knownStatus[i] = "unknown"; });

  // Render ve select kutusunu doldur
  render();
  fillJumpMenu();
}

// fillJumpMenu
function fillJumpMenu() {
  jumpSelect.innerHTML = "";
  data.forEach((_, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = (knownStatus[i] === "known" ? "✓ " : "✗ ") + (i + 1);
    jumpSelect.appendChild(opt);
  });
  jumpSelect.value = index;
}

// Render kart
// render ve fillJumpMenu'yi birbirine bağlamak yerine
function render(direction = "") {
  isSliding = true;
  isFlipped = false;
  card.style.transition = "none";
  card.classList.remove("flip", "slide-left", "slide-right");
  card.offsetHeight;

  question.textContent = data[index].soru;
  answer.textContent = data[index].cevap;
  counter.textContent = `/ ${data.length}`;
  jumpSelect.value = index;
  localStorage.setItem(`lastIndex_${dataName}`, index);

  requestAnimationFrame(() => {
    card.style.transition = "";
    if (direction) card.classList.add(direction);
    setTimeout(() => isSliding = false, 420);
  });

  // Select kutusunu her render sonrası güncelle
  fillJumpMenu();
}

// Progress kaydet
async function saveProgress() {
  if (!currentUserUid) {
    localStorage.setItem(`progress_${dataName}`, JSON.stringify(knownStatus));
    localStorage.setItem(`lastIndex_${dataName}`, index);
    return;
  }

  try {
    const docRef = doc(db, "users", currentUserUid, "progress", dataName);
    await setDoc(docRef, { knownStatus, lastIndex: index }, { merge: true });
  } catch (err) { console.error("Progress kaydedilemedi:", err); }
}

/* Butonlar */
document.getElementById("markKnown").onclick = () => { knownStatus[index] = "known"; saveProgress(); render(); };
document.getElementById("markUnknown").onclick = () => { knownStatus[index] = "unknown"; saveProgress(); render(); };
document.getElementById("next").onclick = nextUnknown;
document.getElementById("prev").onclick = prevUnknown;
jumpSelect.addEventListener("change", () => { index = Number(jumpSelect.value); render(); });

function nextUnknown() {
  if (isSliding) return;
  let start = index;
  do {
    index = (index + 1) % data.length;
    if (knownStatus[index] !== "known") break;
  } while (index !== start);
  render("slide-right");
}

function prevUnknown() {
  if (isSliding) return;
  let start = index;
  do {
    index = (index - 1 + data.length) % data.length;
    if (knownStatus[index] !== "known") break;
  } while (index !== start);
  render("slide-left");
}


/* Kart flip */
card.addEventListener("click", () => {
  if (hasMoved || isSliding) return;
  isFlipped = !isFlipped;
  card.classList.toggle("flip", isFlipped);
});

/* Swipe */
let startX = 0, currentX = 0;
scene.addEventListener("touchstart", e => { startX = e.touches[0].clientX; currentX = startX; hasMoved = false; }, { passive: true });
scene.addEventListener("touchmove", e => { currentX = e.touches[0].clientX; const diff = currentX - startX; if(Math.abs(diff) > 12){ hasMoved = true; card.style.transform=`translateX(${diff}px) rotate(${diff/20}deg)`;} }, { passive:true });
scene.addEventListener("touchend", () => {
  if (!hasMoved || isSliding){ card.style.transform=""; return; }
  const diff = currentX - startX;
  knownStatus[index] = diff > 0 ? "known" : "unknown";
  saveProgress();
  index = (index + 1) % data.length;
  card.style.transform = "";
  render(diff>0 ? "slide-left" : "slide-right");
  hasMoved = false;
});