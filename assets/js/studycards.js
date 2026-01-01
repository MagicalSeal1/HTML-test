import { db, authReady } from "./login.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

/* ===================== STATE ===================== */
let data = [];
let index = 0;
let nextIndex = 0; // Bir sonraki kartın indeksi
let knownStatus = {};
let favoriteStatus = {};
let historyStack = [];
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
  favoriteStatus = JSON.parse(localStorage.getItem(`fav_${dataName}`) || "{}");
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
      favoriteStatus = cloud.favoriteStatus || favoriteStatus;
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
  localStorage.setItem(`fav_${dataName}`, JSON.stringify(favoriteStatus));
  localStorage.setItem(`lastIndex_${dataName}`, index);

  // CLOUD (arkaplan)
  if (!currentUserUid) return;
  const ref = doc(db, "users", currentUserUid, "progress", dataName);
  setDoc(ref, { knownStatus, favoriteStatus, lastIndex: index }, { merge: true })
    .catch(() => {});
}

/* ===================== RENDER ===================== */
function render() {
  isSliding = false;
  isFlipped = false;

  // Önceki karttan kalan feedback ikonunu temizle
  const oldFb = card.querySelector(".card-feedback");
  if (oldFb) oldFb.remove();

  // Önceki karttan kalan favori ikonunu temizle
  const oldFav = card.querySelector(".card-fav-indicator");
  if (oldFav) oldFav.remove();

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

  // Kart üzerine favori yıldızı ekle
  if (favoriteStatus[index]) {
    const favInd = document.createElement("div");
    favInd.className = "card-fav-indicator";
    favInd.textContent = "★";
    card.appendChild(favInd);
  }

  // Buton durumunu güncelle
  const favBtn = document.getElementById("toggleFavorite");
  if (favBtn) {
    const isFav = favoriteStatus[index];
    favBtn.textContent = isFav ? "★" : "☆";
    favBtn.classList.toggle("active-fav", !!isFav);
  }

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
      (favoriteStatus[i] ? "★ " : "") +
      (knownStatus[i] === "known" ? "✓ " : "✗ ") + (i + 1);
    jumpSelect.appendChild(opt);
  });
  jumpSelect.value = index;
}

/* ===================== FEEDBACK ===================== */
function showFeedback(isKnown) {
  const fb = document.createElement("div");
  fb.className = "card-feedback";
  fb.textContent = isKnown ? "✓" : "✗";

  // Kartın içinde, köşelerde görünecek şekilde stillendir
  Object.assign(fb.style, {
    position: "absolute",
    top: "20px",
    fontSize: "50px",
    fontWeight: "bold",
    zIndex: "10",
    pointerEvents: "none"
  });

  if (isKnown) {
    fb.style.right = "20px";
    fb.style.color = "#2ecc71"; // Yeşil
  } else {
    fb.style.left = "20px";
    fb.style.color = "#e74c3c"; // Kırmızı
  }

  card.appendChild(fb);
}

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
    card.classList.add("swipe-right"); // Bilinen -> Sola
  } else {
    card.classList.add("swipe-left"); // Bilinmeyen -> Sağa
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
  historyStack.push({ index, status: knownStatus[index] });
  isSliding = true;

  knownStatus[index] = "known";
  showFeedback(true);
  animateAndNext(true);
};

document.getElementById("markUnknown").onclick = () => {
  if (isSliding) return;
  historyStack.push({ index, status: knownStatus[index] });
  isSliding = true;

  knownStatus[index] = "unknown";
  showFeedback(false);
  animateAndNext(false);
};

const undoBtn = document.getElementById("undoBtn");
if (undoBtn) {
  undoBtn.onclick = () => {
    if (isSliding || historyStack.length === 0) return;
    isSliding = true;

    const lastAction = historyStack.pop();
    const prevIndex = lastAction.index;
    const prevStatus = lastAction.status;

    knownStatus[prevIndex] = prevStatus;

    const incomingCard = document.createElement("div");
    incomingCard.className = "card prev-enter";

    const qText = data[prevIndex]?.soru ?? "";
    const aText = data[prevIndex]?.cevap ?? "";

    incomingCard.innerHTML = `
      <div class="card-face front"><h2>${qText}</h2></div>
      <div class="card-face back"><h2>${aText}</h2></div>
    `;

    const fb = document.createElement("div");
    fb.className = "card-feedback";
    fb.textContent = "↶";
    Object.assign(fb.style, {
      position: "absolute",
      top: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      fontSize: "50px",
      fontWeight: "bold",
      zIndex: "10",
      pointerEvents: "none",
      color: "#3498db"
    });
    incomingCard.appendChild(fb);

    document.querySelector(".scene").appendChild(incomingCard);

    void incomingCard.offsetWidth;
    incomingCard.classList.add("active");
    card.classList.add("push-to-back");

    setTimeout(() => {
      incomingCard.remove();
      index = prevIndex;
      determineNextIndex();
      syncProgress();
      render();
    }, 600);
  };
}

const favBtn = document.getElementById("toggleFavorite");
if (favBtn) {
  favBtn.onclick = () => {
    favoriteStatus[index] = !favoriteStatus[index];
    syncProgress();
    render();
  };
}

const shareBtn = document.getElementById("shareBtn");
if (shareBtn) {
  shareBtn.onclick = async () => {
    const currentCard = data[index];
    if (!currentCard) return;

    const textToShare = `Soru: ${currentCard.soru}\nCevap: ${currentCard.cevap}`;

    if (navigator.share) {
      try {
        await navigator.share({
          text: textToShare,
        });
      } catch (err) {
        // Paylaşım penceresi kapatıldı veya hata oluştu (Sessizce geçilebilir)
      }
    } else {
      // Fallback: Panoya kopyala
      try {
        await navigator.clipboard.writeText(textToShare);
        alert("Soru ve cevap panoya kopyalandı!");
      } catch (err) {
        console.error("Kopyalama hatası:", err);
      }
    }
  };
}

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

/* ===================== SHUFFLE TOGGLE ===================== */
if (shuffleCheck) {
  shuffleCheck.addEventListener("change", () => {
    determineNextIndex();
    if (nextQuestion && nextAnswer && data[nextIndex]) {
      nextQuestion.textContent = data[nextIndex].soru;
      nextAnswer.textContent = data[nextIndex].cevap;
    }
  });
}
