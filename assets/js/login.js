import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

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

// Kullanıcı objesi export
export let currentUser = null;

const heroUser = document.getElementById("heroUser");
const userMenu = document.getElementById("userMenu");

userMenu.innerHTML = `
  <button id="googleLogin">Google ile giriş</button>
  <button id="changeUser" style="display:none">Kullanıcı Değiştir</button>
`;

const googleBtn = document.getElementById("googleLogin");
const changeUserBtn = document.getElementById("changeUser");

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
  } catch (err) {
    console.error("Google ile giriş başarısız:", err);
  }
}

googleBtn.addEventListener("click", async () => {
  closeMenu();
  await googleLogin();
});

changeUserBtn.addEventListener("click", async () => {
  closeMenu();
  await signOut(auth);
  currentUser = null;
  heroUser.textContent = "Misafir";
  await googleLogin();
});

onAuthStateChanged(auth, user => {
  currentUser = user;
  if (user) {
    updateHeroUser(user);
    googleBtn.style.display = "none";
    changeUserBtn.style.display = "block";
  } else {
    heroUser.textContent = "Misafir";
    googleBtn.style.display = "block";
    changeUserBtn.style.display = "none";
  }
});

function updateHeroUser(user) {
  const nameParts = (user.displayName || user.email).split(" ");
  let displayName = nameParts.length > 1 ? nameParts[0] + " " + nameParts[1][0] + "." : nameParts[0];

  heroUser.innerHTML = `
    <span class="hero-name">${displayName}</span>
    <img src="${user.photoURL}" alt="Profil" class="hero-avatar">
  `;
}

// Menü aç/kapa
function toggleMenu() {
  if (userMenu.style.opacity === "1") closeMenu();
  else openMenu();
}
function openMenu() {
  userMenu.style.opacity = "1";
  userMenu.style.transform = "translateY(0) scale(1)";
  userMenu.style.pointerEvents = "auto";
}
function closeMenu() {
  userMenu.style.opacity = "0";
  userMenu.style.transform = "translateY(-6px) scale(0.98)";
  userMenu.style.pointerEvents = "none";
}

heroUser.addEventListener("click", toggleMenu);
document.addEventListener("click", e => {
  if (!heroUser.contains(e.target) && !userMenu.contains(e.target)) closeMenu();
});