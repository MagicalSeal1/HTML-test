import { db, authReady } from "../login.js";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

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
let currentDataName = null;
let currentCategory = "";
let currentSubCategory = "";
let currentDataId = "";

/* ===================== ELEMENTS ===================== */
let card, nextCard, nextQuestion, nextAnswer, question, answer;
let counter, jumpSelect, shuffleCheck, favoritesCheck, feedback;
let titleEl, descEl;

export default class StudyCardsView {
  static getHtml() {
    // Hash'ten parametreleri al (#/studycards?data=...)
    const hashQuery = window.location.hash.split('?')[1] || "";
    const urlParams = new URLSearchParams(hashQuery);
    // URL'den veya LocalStorage'dan tam yolu (Kategori/Alt/Id) al
    const dataName = urlParams.get('data') || localStorage.getItem("lastFullPath");

    if (!dataName) {
      return `
        <div class="warning-message" style="text-align:center; padding: 50px; color: #fff;">
          <h2>Henüz bir konu seçilmedi.</h2>
          <p>Lütfen "Ana Sayfa" sekmesinden çalışmak istediğiniz konuyu seçiniz.</p>
        </div>
      `;
    }

    return `
    <div id="view-cards">
      <!-- Sayfa İçi Header -->
      <div class="view-header">
        <div class="view-header-text">
          <h1 id="pageTitle">Yükleniyor...</h1>
          <p id="pageDescription">...</p>
        </div>
      </div>

      <div class="container">
        <div class="status">
          <button id="resetProgress">Sıfırla</button>
          <div class="center-group">
            <label class="shuffle-label" title="Soruları Karıştır">
              <input type="checkbox" id="shuffle">
              <span class="slider"></span>
            </label>
            <label class="favorites-label">
              <input type="checkbox" id="favorites">
              <span class="slider"></span>
            </label>
          </div>
          <div class="right-group">
            <label for="jumpSelect">Soru</label>
            <select id="jumpSelect" aria-label="Soru seç"></select>
            <span id="counter"></span>
          </div>      
        </div>
    
        <div class="scene">
          <div class="swipe-feedback" id="swipeFeedback"></div>
          <div class="card next-card" id="nextCard">
            <div class="card-face front"><h2 id="nextQuestion"></h2></div>
            <div class="card-face back"><h2 id="nextAnswer"></h2></div>
          </div>
          <div id="card" class="card">
            <div class="card-face front"><h2 id="question"></h2></div>
            <div class="card-face back"><h2 id="answer"></h2></div>
          </div>
        </div>
    
        <div class="controls">
          <button id="undoBtn" title="Geri Al">↺</button>
          <button id="markUnknown">✗</button>
          <button id="toggleFavorite" title="Favorilere Ekle/Çıkar">☆</button>
          <button id="markKnown">✓</button>
          <button id="shareBtn" title="Soruyu Paylaş">➦</button>
        </div>
      </div>
    </div>
    `;
  }

  static init(fullPath) {
    if (!fullPath) return;

    // 1. Path Ayrıştırma (Kategori/AltKategori/ID)
    // Eski format (sadece ID) gelirse diye kontrol
    if (fullPath.includes('/')) {
      [currentCategory, currentSubCategory, currentDataId] = fullPath.split('/');
    } else {
      currentDataId = fullPath;
      currentCategory = "Genel";
      currentSubCategory = "Genel";
    }
    
    // Eğer konu değiştiyse durumu sıfırla, aynı konuysa (örn: profilden geri gelindi) kaldığı yerden devam et
    if (currentDataName !== fullPath) {
      resetState();
      currentDataName = fullPath;
      // Yeni konuyu kaydet (Local - Tam Yol)
      localStorage.setItem("lastFullPath", fullPath);
      localStorage.setItem("lastTopicId", currentDataId); // Sadece ID lazım olursa diye
    } else {
      // Aynı konu ise sadece elementleri yeniden bağlayacağız, state (index, data) korunacak.
      // Ancak render'ı tetiklememiz lazım.
    }

    // Elementleri seç
    card = document.getElementById("card");
    nextCard = document.getElementById("nextCard");
    nextQuestion = document.getElementById("nextQuestion");
    nextAnswer = document.getElementById("nextAnswer");
    question = document.getElementById("question");
    answer = document.getElementById("answer");
    counter = document.getElementById("counter");
    jumpSelect = document.getElementById("jumpSelect");
    shuffleCheck = document.getElementById("shuffle");
    favoritesCheck = document.getElementById("favorites");
    feedback = document.getElementById("swipeFeedback");
    
    // Header elementleri (Artık view içinde)
    titleEl = document.querySelector("#view-cards #pageTitle");
    descEl = document.querySelector("#view-cards #pageDescription");

    // Olay Dinleyicilerini Bağla
    bindEvents();

    // Veriyi Çek
    // Dosya yolunu tam yol (Kategori/Alt/Id) olarak kullan
    fetch(`assets/data/${fullPath}.json`)
      .then(r => {
        if (!r.ok) throw new Error(`Dosya bulunamadı (${r.status})`);
        return r.json();
      })
      .then(async json => {
        // Veri zaten yüklü ve aynıysa tekrar yükleme (State koruması için)
        if (data.length === 0) {
            data = json.cards || [];
        }
        
        if(titleEl) titleEl.textContent = json.title || "";
        if(descEl) descEl.textContent = json.description || "";

        const user = await authReady;
        currentUserUid = user?.uid ?? null;

        // Kullanıcı giriş yapmışsa SON OTURUMU (Last Session) ana koleksiyona kaydet
        if (currentUserUid) {
            const userRef = doc(db, "users", currentUserUid);
            setDoc(userRef, { 
              lastSession: {
                fullPath: currentDataName,
                category: currentCategory,
                subCategory: currentSubCategory,
                dataId: currentDataId,
                updatedAt: serverTimestamp()
              }
            }, { merge: true }).catch(err => console.error("Firebase session save error:", err));
        }

        loadProgress(); // İlerleme durumunu çek (veya hafızadakini kullan)
        // determineNextIndex(); // loadProgress içinde çağrılıyor zaten
        render();
      })
      .catch(err => {
        console.error("Veri yükleme hatası:", err);
        if(titleEl) titleEl.textContent = "Hata";
        if(descEl) descEl.textContent = "İçerik yüklenemedi. Dosya yolunu kontrol edin.";
      });
  }
}

/* ===================== PROGRESS ===================== */
function loadProgress() {
  // 1️⃣ Önce LOCAL (Hız için hemen yükle)
  
  const localKnown = JSON.parse(localStorage.getItem(`progress_${currentDataId}`) || "{}");
  const localFav = JSON.parse(localStorage.getItem(`fav_${currentDataId}`) || "{}");
  const localIndex = Number(localStorage.getItem(`lastIndex_${currentDataId}`)) || 0;

  // RAM boşsa Local'den al
  if (Object.keys(knownStatus).length === 0) knownStatus = localKnown;
  if (Object.keys(favoriteStatus).length === 0) favoriteStatus = localFav;
  // Index'i sadece RAM sıfırsa veya yeni konuysa güncelle, aksi takdirde RAM'deki index (kaldığı yer) geçerli
  if (index === 0) index = localIndex;

  data.forEach((_, i) => {
    if (!knownStatus[i]) knownStatus[i] = "unknown";
  });

  determineNextIndex();
  
  // 2️⃣ Sonra CLOUD (Arka planda senkronize et)
  if (!currentUserUid) return;

  // Her ana başlık (Category) için ayrı koleksiyon altında bir doküman
  const ref = doc(db, "users", currentUserUid, currentCategory, currentDataId);
  
  getDoc(ref)
    .then(snap => {
      if (!snap.exists()) return;
      
      const cloud = snap.data();
      console.log("Bulut verisi yüklendi:", currentDataId);
      
      // Basit Birleştirme Mantığı:
      // Eğer Local boşsa Cloud'u al.
      // Eğer Cloud verisi varsa ve Local ile farklıysa, Cloud'u önceliklendir (veya timestamp kontrolü yapılabilir)
      // Şimdilik: Cloud verisi varsa Local'i güncelle (Senkronizasyon)
      
      if (cloud.knownStatus && Object.keys(cloud.knownStatus).length > 0) {
        knownStatus = { ...knownStatus, ...cloud.knownStatus };
        favoriteStatus = { ...favoriteStatus, ...cloud.favoriteStatus };
        // Index'i sadece kullanıcı henüz ilerlemediyse (0 ise) Cloud'dan al
        if (index === 0 && cloud.lastIndex) index = cloud.lastIndex;
        
        // Local'i de güncelle ki sonraki açılışta güncel olsun
        syncProgress(true); // true = Cloud'a tekrar yazma, sadece Local
        render(); // Arayüzü güncelle
      }
    })
    .catch(() => {});
}

/* ===================== BACKGROUND SAVE ===================== */
function syncProgress(skipCloud = false) {
  // LOCAL (anında)
  localStorage.setItem(`progress_${currentDataId}`, JSON.stringify(knownStatus));
  localStorage.setItem(`fav_${currentDataId}`, JSON.stringify(favoriteStatus));
  localStorage.setItem(`lastIndex_${currentDataId}`, index);

  if (skipCloud) return;

  // CLOUD (arkaplan)
  if (!currentUserUid) return;
  
  const ref = doc(db, "users", currentUserUid, currentCategory, currentDataId);
  
  const payload = { 
    knownStatus, 
    favoriteStatus, 
    lastIndex: index,
    updatedAt: serverTimestamp()
  };

  // DÜZELTME: setDoc({merge:true}) map objelerini birleştirir (silinenleri silmez).
  // updateDoc ise alanı tamamen değiştirir. Önce update deneyelim, yoksa set yapalım.
  updateDoc(ref, payload)
    .then(() => console.log("Buluta kaydedildi."))
    .catch((err) => {
      // Eğer doküman yoksa 'not-found' hatası verir, o zaman setDoc ile oluştururuz.
      if (err.code === 'not-found') {
        setDoc(ref, payload, { merge: true })
          .then(() => console.log("Buluta oluşturuldu."))
          .catch(e => console.error("Oluşturma hatası:", e));
      } else {
        console.error("Kaydetme hatası:", err);
      }
    });
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
  return new Promise((resolve) => {
    const fb = document.createElement("div");
    fb.className = "card-feedback";
    fb.textContent = isKnown ? "✓" : "✗";

    // Kartın içinde, köşelerde görünecek şekilde stillendir
    Object.assign(fb.style, {
      position: "absolute",
      top: "20px",
      fontSize: "100px",
      fontWeight: "bold",
      zIndex: "100",
      pointerEvents: "none",
      transform: "translateZ(50px) scale(0.5)",
      opacity: "0",
      transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
    });

    if (isKnown) {
      fb.style.right = "40px";
      fb.style.color = "#2ecc71"; // Yeşil
    } else {
      fb.style.left = "40px";
      fb.style.color = "#e74c3c"; // Kırmızı
    }

    card.appendChild(fb);

    requestAnimationFrame(() => {
      fb.style.opacity = "1";
      fb.style.transform = "translateZ(50px) scale(1)";
    });

    setTimeout(resolve, 300);
  });
}

/* ===================== NAV ===================== */
function determineNextIndex() {
  // Mevcut index'ten sonraki kartı (veya rastgele kartı) belirler
  // ancak index'i değiştirmez. Sadece nextIndex'i günceller.
  
  let tempIndex = index;
  const onlyFav = favoritesCheck?.checked;
  
  if (shuffleCheck?.checked && data.length > 1) {
    const unknowns = [];
    data.forEach((_, i) => {
      // Şu anki kart hariç bilinmeyenleri bul
      if (i === index) return;
      if (knownStatus[i] === "known") return;
      if (onlyFav && !favoriteStatus[i]) return;
      unknowns.push(i);
    });

    if (unknowns.length > 0) {
      nextIndex = unknowns[Math.floor(Math.random() * unknowns.length)];
    } else {
      // Hepsi biliniyorsa veya tek kart kaldıysa
      nextIndex = index; 
    }
  } else {
    // Sıradaki bilinmeyeni bul
    let count = 0;
    do {
      tempIndex = (tempIndex + 1) % data.length;
      count++;
      const isKnown = knownStatus[tempIndex] === "known";
      const isFav = favoriteStatus[tempIndex];
      
      if (!isKnown && (!onlyFav || isFav)) break;
    } while (tempIndex !== index && count < data.length);
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
  }, 500); // CSS transition süresiyle uyumlu (0.5s)
}

/* ===================== BUTTONS ===================== */

function bindEvents() {
    const markKnownBtn = document.getElementById("markKnown");
    if (markKnownBtn) {
      markKnownBtn.onclick = async () => {
        if (isSliding) return;
        historyStack.push({ index, status: knownStatus[index] });
        isSliding = true;

        knownStatus[index] = "known";
        await showFeedback(true);
        animateAndNext(true);
      };
    }

    const markUnknownBtn = document.getElementById("markUnknown");
    if (markUnknownBtn) {
      markUnknownBtn.onclick = async () => {
        if (isSliding) return;
        historyStack.push({ index, status: knownStatus[index] });
        isSliding = true;

        knownStatus[index] = "unknown";
        await showFeedback(false);
        animateAndNext(false);
      };
    }

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
      // DÜZELTME: False yapmak yerine siliyoruz
      if (favoriteStatus[index]) {
        delete favoriteStatus[index];
      } else {
        favoriteStatus[index] = true;
      }
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
        try { await navigator.share({ text: textToShare }); } catch (err) {}
      } else {
        try { await navigator.clipboard.writeText(textToShare); alert("Kopyalandı!"); } catch (err) {}
      }
    };
  }

  const resetBtn = document.getElementById("resetProgress");
  if (resetBtn) {
    resetBtn.onclick = () => {
      data.forEach((_, i) => knownStatus[i] = "unknown");
      index = 0;
      determineNextIndex();
      syncProgress();
      render();
    };
  }

  if (card) {
    card.addEventListener("click", () => {
      if (isSliding) return;
      isFlipped = !isFlipped;
      card.classList.toggle("flip", isFlipped);
    });
  }

  if (jumpSelect) {
    jumpSelect.addEventListener("change", () => {
      index = Number(jumpSelect.value);
      determineNextIndex();
      syncProgress();
      render();
    });
  }

  if (shuffleCheck) {
    shuffleCheck.addEventListener("change", () => {
      determineNextIndex();
      if (nextQuestion && nextAnswer && data[nextIndex]) {
        nextQuestion.textContent = data[nextIndex].soru;
        nextAnswer.textContent = data[nextIndex].cevap;
      }
    });
  }

  if (favoritesCheck) {
    favoritesCheck.addEventListener("change", () => {
      determineNextIndex();
      if (nextQuestion && nextAnswer && data[nextIndex]) {
        nextQuestion.textContent = data[nextIndex].soru;
        nextAnswer.textContent = data[nextIndex].cevap;
      }
    });
  }
}

/* ===================== STATE RESET ===================== */
function resetState() {
  data = [];
  index = 0;
  nextIndex = 0;
  knownStatus = {};
  favoriteStatus = {};
  historyStack = [];
  isSliding = false;
  isFlipped = false;
}
