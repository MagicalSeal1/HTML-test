import { db, authReady } from "./login.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

/* ===================== STATE ===================== */
let data = [];
let index = 0;
let nextIndex = 0; // Bir sonraki kartın indeksi
let knownStatus = {};
let currentUserUid = null;
let isSliding = false;
let isFlipped = false;

const dataName = new URLSearchParams(window.location.search).get("data");

/* ===================== ELEMENTS ===================== */
const card = document.getElementById("card");
const nextCard = document.getElementById("nextCard");
const nextQuestion = document.getElementById("nextQuestion");
const nextAnswer = document.getElementById("nextAnswer");
const question = document.getElementById("question");
const answer = document.getElementById("answer");
const counter = document.getElementById("counter");
const jumpSelect = document.getElementById("jumpSelect");
const shuffleCheck = document.getElementById("shuffle");
const titleEl = document.getElementById("pageTitle");
const descEl = document.getElementById("pageDescription");
const feedback = document.getElementById("swipeFeedback");

/* ===================== LOAD JSON ===================== */
fetch(`assets/data/${dataName}.json`)
  .then(r => r.json())
  .then(async json => {
    data = json.cards || [];
    titleEl.textContent = json.title || "";
    descEl.textContent = json.description || "";

    const user = await authReady;
    currentUserUid = user?.uid ?? null;

    loadProgress();
    determineNextIndex(); // İlk yüklemede sıradakini belirle
    render(); // İlk render
  });

/* ===================== PROGRESS ===================== */
function loadProgress() {
  // 1️⃣ Önce LOCAL
  knownStatus = JSON.parse(localStorage.getItem(`progress_${dataName}`) || "{}");
  index = Number(localStorage.getItem(`lastIndex_${dataName}`)) || 0;

  data.forEach((_, i) => {
    if (!knownStatus[i]) knownStatus[i] = "unknown";
  });

  determineNextIndex();
  render();

  // 2️⃣ Sonra CLOUD (arkaplan)
  if (!currentUserUid) return;

  const ref = doc(db, "users", currentUserUid, "progress", dataName);
  getDoc(ref)
    .then(snap => {
      if (!snap.exists()) return;
      const cloud = snap.data();
      knownStatus = cloud.knownStatus || knownStatus;
      index = cloud.lastIndex ?? index;
      determineNextIndex();
      render();
    })
    .catch(() => {});
}

/* ===================== BACKGROUND SAVE ===================== */
function syncProgress() {
  // LOCAL (anında)
  localStorage.setItem(`progress_${dataName}`, JSON.stringify(knownStatus));
  localStorage.setItem(`lastIndex_${dataName}`, index);

  // CLOUD (arkaplan)
  if (!currentUserUid) return;
  const ref = doc(db, "users", currentUserUid, "progress", dataName);
  setDoc(ref, { knownStatus, lastIndex: index }, { merge: true })
    .catch(() => {});
}

/* ===================== RENDER ===================== */
function render() {
  isSliding = false;
  isFlipped = false;

  // Reset sırasında animasyon olmaması için transition'ı kapat
  card.style.transition = "none";
  if (nextCard) nextCard.style.transition = "none";

  card.className = "card";
  card.style.transform = "";

  // Arkadaki kartı sıfırla
  if (nextCard) {
    nextCard.className = "card next-card";
  }

  question.textContent = data[index]?.soru ?? "";
  answer.textContent = data[index]?.cevap ?? "";
  counter.textContent = `/ ${data.length}`;

  // Arkadaki kartı doldur
  if (nextQuestion && nextAnswer && data[nextIndex]) {
    nextQuestion.textContent = data[nextIndex].soru;
    nextAnswer.textContent = data[nextIndex].cevap;
  }

  fillJumpMenu();

  // Reflow tetikle ve transition'ı geri aç (CSS'teki değerine dönsün)
  void card.offsetWidth;
  card.style.transition = "";
  if (nextCard) nextCard.style.transition = "";
}

/* ===================== SELECT ===================== */
function fillJumpMenu() {
  jumpSelect.innerHTML = "";
  data.forEach((_, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent =
      (knownStatus[i] === "known" ? "✓ " : "✗ ") + (i + 1);
    jumpSelect.appendChild(opt);
  });
  jumpSelect.value = index;
}

/* ===================== FEEDBACK ===================== */
function showFeedback(isKnown) {
  feedback.textContent = isKnown ? "✓" : "✗";
  feedback.className =
    "swipe-feedback show " + (isKnown ? "known" : "unknown");

  // bir frame sonra temizle → render ile çakışmaz
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      feedback.className = "swipe-feedback";
    });
  });
}

/* ===================== NAV ===================== */

/* ===================== NAV ===================== */

function determineNextIndex() {
  // Mevcut index'ten sonraki kartı (veya rastgele kartı) belirler
  // ancak index'i değiştirmez. Sadece nextIndex'i günceller.
  
  let tempIndex = index;
  
  if (shuffleCheck?.checked && data.length > 1) {
    const unknowns = [];
    data.forEach((_, i) => {
      // Şu anki kart hariç bilinmeyenleri bul
      if (knownStatus[i] !== "known" && i !== index) unknowns.push(i);
    });

    if (unknowns.length > 0) {
      nextIndex = unknowns[Math.floor(Math.random() * unknowns.length)];
    } else {
      // Hepsi biliniyorsa veya tek kart kaldıysa
      nextIndex = index; 
    }
  } else {
    // Sıradaki bilinmeyeni bul
    do {
      tempIndex = (tempIndex + 1) % data.length;
      if (knownStatus[tempIndex] !== "known") break;
    } while (tempIndex !== index);
    nextIndex = tempIndex;
  }
}

function animateAndNext(isKnown) {
  // 1. Animasyon sınıflarını ekle
  if (isKnown) {
    card.classList.add("swipe-left"); // Bilinen -> Sola
  } else {
    card.classList.add("swipe-right"); // Bilinmeyen -> Sağa
  }

  if (nextCard) {
    nextCard.classList.add("enter"); // Arkadaki öne gelir
  }

  // 2. Animasyon bitince verileri güncelle
  setTimeout(() => {
    index = nextIndex; // Sıradaki kartı aktif yap
    determineNextIndex(); // Yeni bir 'sıradaki' belirle
    syncProgress();
    render(); // Ekranı tazele (sınıfları temizler)
  }, 400); // CSS transition süresiyle uyumlu (0.4s)
}

/* ===================== BUTTONS ===================== */
document.getElementById("markKnown").onclick = () => {
  if (isSliding) return;
  isSliding = true;

  knownStatus[index] = "known";
  showFeedback(true);
  animateAndNext(true);
};

document.getElementById("markUnknown").onclick = () => {
  if (isSliding) return;
  isSliding = true;

  knownStatus[index] = "unknown";
  showFeedback(false);
  animateAndNext(false);
};

document.getElementById("prevPlain").onclick = () => {
  if (isSliding) return;
  isSliding = true;

  // 1. Yeni indeksi hesapla
  const newIndex = (index - 1 + data.length) % data.length;

  // 2. Animasyon için geçici kart oluştur (Önden gelen)
  const incomingCard = document.createElement("div");
  incomingCard.className = "card prev-enter";
  
  const qText = data[newIndex]?.soru ?? "";
  const aText = data[newIndex]?.cevap ?? "";
  
  incomingCard.innerHTML = `
    <div class="card-face front"><h2>${qText}</h2></div>
    <div class="card-face back"><h2>${aText}</h2></div>
  `;
  document.querySelector(".scene").appendChild(incomingCard);

  // 3. Animasyonu tetikle (Reflow sonrası)
  void incomingCard.offsetWidth;
  incomingCard.classList.add("active"); // Önden küçülerek gel
  card.classList.add("push-to-back");   // Mevcut kart arkaya git

  // 4. Animasyon bitince state güncelle
  setTimeout(() => {
    incomingCard.remove();
    index = newIndex;
    determineNextIndex();
    syncProgress();
    render();
  }, 600); // CSS transition süresi (0.6s)
};

document.getElementById("resetProgress").onclick = () => {
  data.forEach((_, i) => knownStatus[i] = "unknown");
  index = 0;
  determineNextIndex();
  syncProgress();
  render();
};

/* ===================== FLIP ===================== */
card.addEventListener("click", () => {
  if (isSliding) return;
  isFlipped = !isFlipped;
  card.classList.toggle("flip", isFlipped);
});

/* ===================== JUMP ===================== */
jumpSelect.addEventListener("change", () => {
  index = Number(jumpSelect.value);
  determineNextIndex();
  syncProgress();
  render();
});
