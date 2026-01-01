import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { router } from "./router.js"; // Router'ı import et (Sayfa yenileme yerine kullanmak için)
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  EmailAuthProvider,
  linkWithCredential
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs
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

/* === EXPORTED FUNCTIONS === */
export async function googleLogin() {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
    // Sayfayı yenilemek yerine router'ı tetikle
    if (location.hash === "#/profile") {
      router();
    }
  } catch (error) {
    console.error("Giriş hatası:", error);
  }
}

export async function emailLogin(email, password) {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    if (location.hash === "#/profile") {
      router();
    }
    return { success: true };
  } catch (error) {
    console.error("Giriş hatası:", error);
    return { success: false, error: error.code };
  }
}

export async function signOutUser() {
  await signOut(auth);
  if (location.hash === "#/profile") {
    router();
  }
}

export async function linkEmailPassword(email, password) {
  try {
    const credential = EmailAuthProvider.credential(email, password);
    await linkWithCredential(auth.currentUser, credential);
    return { success: true };
  } catch (error) {
    console.error("Bağlama hatası:", error);
    return { success: false, error: error.code };
  }
}

/* === NAVBAR UPDATE === */
function updateNavbar(user) {
  const navProfile = document.getElementById("nav-profile");
  if (!navProfile) return;

  if (user) {
    // Profil ikonunu kullanıcı fotoğrafı ile değiştir
    navProfile.innerHTML = `
      <img src="${user.photoURL}" alt="Profil" class="nav-profile-img">
      <span>Profil</span>
    `;
  } else {
    // Varsayılan ikon (Standart Kullanıcı İkonu)
    navProfile.innerHTML = `
      <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
      <span>Profil</span>
    `;
  }
}

onAuthStateChanged(auth, user => {
  updateNavbar(user);
});