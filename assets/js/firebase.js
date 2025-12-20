// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBy5_BQX5piNX03bFkvzsCQA6SKa1cxozM",
  authDomain: "karsuprj.firebaseapp.com",
  projectId: "karsuprj",
  storageBucket: "karsuprj.firebasestorage.app",
  messagingSenderId: "185472958814",
  appId: "1:185472958814:web:d551fa74f7ed62dbe80fcf"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };