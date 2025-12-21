import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// Firebase config
export const firebaseConfig = {
  apiKey: "AIzaSyBy5_BQX5piNX03bFkvzsCQA6SKa1cxozM",
  authDomain: "karsuprj.firebaseapp.com",
  projectId: "karsuprj",
  storageBucket: "karsuprj.firebasestorage.app",
  messagingSenderId: "185472958814",
  appId: "1:185472958814:web:d551fa74f7ed62dbe80fcf"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export let currentUser = null;

const heroUser = document.getElementById("heroUser");
const userMenu = document.getElementById("userMenu");

// Menüye tek buton ekle
userMenu.innerHTML = `<button id="userAction">Google ile giriş</button>`;
const userActionBtn = document.getElementById("userAction");

// --- Menü aç/kapa ---
function toggleMenu() {
  userMenu.classList.toggle("open");
  heroUser.classList.toggle("open");
}

function closeMenu() {
  userMenu.classList.remove("open");
  heroUser.classList.remove("open");
}

heroUser.addEventListener("click", toggleMenu);
document.addEventListener("click", e => {
  if (!heroUser.contains(e.target) && !userMenu.contains(e.target)) closeMenu();
});

// --- Google login ---
async function googleLogin() {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    await setDoc(doc(db, "users", user.uid), {
      name: user.displayName,
      email: user.email,
      createdAt: new Date()
    }, { merge: true });

    currentUser = user;
    updateHeroUser(user);

    // Butonu çıkış yap olarak ayarla
    userActionBtn.textContent = "Çıkış Yap";
    userActionBtn.onclick = async () => {
      closeMenu();
      await signOutUser();
    };

  } catch (err) {
    console.error("Google ile giriş başarısız:", err);
  }
}

// --- Çıkış yap ---
async function signOutUser() {
  await signOut(auth);
  currentUser = null;
  heroUser.innerHTML = `<span class="hero-name">Misafir</span><span class="hero-arrow">▼</span>`;
  userActionBtn.textContent = "Google ile giriş";
  userActionBtn.onclick = async () => {
    closeMenu();
    await googleLogin();
  };
}

// --- Auth state ---
onAuthStateChanged(auth, user => {
  currentUser = user;
  if (user) {
    updateHeroUser(user);
    userActionBtn.textContent = "Çıkış Yap";
    userActionBtn.onclick = async () => {
      closeMenu();
      await signOutUser();
    };
  } else {
    heroUser.innerHTML = `<span class="hero-name">Misafir</span><span class="hero-arrow">▼</span>`;
    userActionBtn.textContent = "Google ile giriş";
    userActionBtn.onclick = async () => {
      closeMenu();
      await googleLogin();
    };
  }
});

// --- Hero güncelle ---
function updateHeroUser(user) {
  const nameParts = (user.displayName || user.email).split(" ");
  let displayName = nameParts.length > 1
    ? nameParts[0] + " " + nameParts[1][0] + "."
    : nameParts[0];

  heroUser.innerHTML = `
    <span class="hero-name">${displayName}</span>
    <img src="${user.photoURL}" alt="Profil" class="hero-avatar">
    <span class="hero-arrow">▼</span>
  `;
}