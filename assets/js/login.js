import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

/* Firebase config */
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

/* === AUTH READY PROMISE (TEK VE NET) === */
let authReadyResolver;
export const authReady = new Promise(resolve => {
  authReadyResolver = resolve;
});

/* === AUTH STATE === */
onAuthStateChanged(auth, async user => {
  currentUser = user ?? null;

  if (user) {
    await setDoc(
      doc(db, "users", user.uid),
      {
        name: user.displayName,
        email: user.email,
        updatedAt: Date.now()
      },
      { merge: true }
    );
  }

  authReadyResolver(currentUser);
});

/* === UI / MENU === */
const heroUser = document.getElementById("heroUser");
const userMenu = document.getElementById("userMenu");

userMenu.innerHTML = `<button id="userAction">Google ile giriş</button>`;
const userActionBtn = document.getElementById("userAction");

heroUser.addEventListener("click", (e) => {
  // Menü içine tıklandığında heroUser click'ini tetikleyip kapatmasın
  if (userMenu.contains(e.target)) return;

  userMenu.classList.toggle("open");
  heroUser.classList.toggle("open");
  document.body.classList.toggle("menu-open");
});

document.addEventListener("click", e => {
  if (!heroUser.contains(e.target) && !userMenu.contains(e.target)) {
    userMenu.classList.remove("open");
    heroUser.classList.remove("open");
    document.body.classList.remove("menu-open");
  }
});

async function googleLogin() {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
}

async function signOutUser() {
  await signOut(auth);
}

onAuthStateChanged(auth, user => {
  if (user) {
    heroUser.classList.add("logged-in");
    heroUser.innerHTML = `
      <img src="${user.photoURL}" class="hero-avatar" alt="Profil">
    `;
    userActionBtn.textContent = "Çıkış Yap";
    userActionBtn.onclick = signOutUser;
  } else {
    heroUser.classList.remove("logged-in");
    heroUser.innerHTML = `
      <span class="hero-name">Misafir</span>
      <span class="hero-arrow">▼</span>
    `;
    userActionBtn.textContent = "Google ile giriş";
    userActionBtn.onclick = googleLogin;
  }

  // Menüyü heroUser elementinin içine taşı (Böylece menü avatara göre konumlanır)
  heroUser.appendChild(userMenu);
});