import { currentUser, googleLogin, emailLogin, linkEmailPassword, signOutUser, db, authReady } from "../login.js";
import { collection, getDocs, doc, setDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

export default class ProfileView {
  static getHtml() {
    // Kullanıcı verisi yoksa varsayılan değerler
    const displayName = currentUser?.displayName || "Misafir Kullanıcı";
    const email = currentUser?.email || "Giriş yapılmadı";
    const isLoggedIn = !!currentUser;
    
    // Şifre (password) sağlayıcısı bağlı mı kontrol et
    const isPasswordLinked = currentUser?.providerData?.some(p => p.providerId === 'password');

    // Avatar Alanı: Giriş yapılmışsa resim, yapılmamışsa "Misafir" yazısı
    let avatarHtml;
    if (isLoggedIn && currentUser?.photoURL) {
      avatarHtml = `<img src="${currentUser.photoURL}" alt="Profil" class="profile-avatar-large">`;
    } else {
      avatarHtml = `<div class="profile-avatar-placeholder">Misafir</div>`;
    }

    // Google Logosu (SVG)
    const googleLogoSvg = `<svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><path d="M17.64 9.2c0-.637-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.715H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/><path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.159 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>`;

    return `
      <div id="view-profile" class="profile-container">
        ${avatarHtml}
        
        <h2 style="font-size: 1.5rem; margin-bottom: 5px;">${displayName}</h2>
        <p style="color: var(--muted); margin-bottom: 10px;">${email}</p>
        
        <div style="margin-bottom: 30px;">
          ${isLoggedIn 
            ? `
              ${!isPasswordLinked ? `<button id="btn-link-email" class="btn-link-email">E-posta/Şifre Bağla</button>` : ''}
              <button id="btn-logout" class="btn-logout">Çıkış Yap</button>
              ` 
            : `
              <button id="btn-login" class="btn-google-login">${googleLogoSvg} <span>Google ile Giriş Yap</span></button>
              <button id="btn-email-login" class="btn-email-login">E-posta / Şifre ile Giriş</button>
              `
          }
        </div>

        <div class="stats-grid" style="width: 100%; max-width: 400px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          <div class="stat-card" style="background: var(--card); padding: 15px; border-radius: 12px; border: 1px solid var(--border);">
            <h3 id="stat-solved" style="color: var(--accent); font-size: 2rem;">0</h3>
            <p style="font-size: 0.8rem; color: var(--muted);">Çözülen Soru</p>
          </div>
          <div class="stat-card" style="background: var(--card); padding: 15px; border-radius: 12px; border: 1px solid var(--border);">
            <h3 id="stat-rate" style="color: #2ecc71; font-size: 2rem;">%0</h3>
            <p style="font-size: 0.8rem; color: var(--muted);">Başarı Oranı</p>
          </div>
        </div>
        
        <div style="margin-top: auto; padding-bottom: 20px; color: var(--muted); font-size: 0.8rem;">
          MagicalSeal
        </div>

        <!-- LOGIN MODAL -->
        <div id="loginModal" class="modal-overlay">
          <div class="modal-box">
            <h2>Giriş Yap</h2>
            <p style="color: var(--muted); font-size: 0.9rem; margin-bottom: 20px;">Hesabınıza erişmek için bilgilerinizi girin.</p>
            
            <div class="input-group">
              <input type="email" id="emailInput" placeholder="E-posta" required>
            </div>
            <div class="input-group">
              <input type="password" id="passwordInput" placeholder="Şifre" required>
            </div>
            
            <div id="loginError" class="error-msg"></div>

            <button id="modalLoginBtn" class="modal-btn primary">Giriş Yap</button>
            <button id="modalCloseBtn" class="modal-btn secondary">İptal</button>
          </div>
        </div>
      </div>
    `;
  }

  static init() {
    const btnLogin = document.getElementById("btn-login");
    const btnEmailLogin = document.getElementById("btn-email-login");
    const btnLinkEmail = document.getElementById("btn-link-email");
    const btnLogout = document.getElementById("btn-logout");

    if (btnLogin) {
      btnLogin.addEventListener("click", googleLogin);
    }

    if (btnLogout) {
      btnLogout.addEventListener("click", signOutUser);
    }

    // Modal Logic
    const modal = document.getElementById("loginModal");
    const modalClose = document.getElementById("modalCloseBtn");
    const modalLogin = document.getElementById("modalLoginBtn");
    const emailInput = document.getElementById("emailInput");
    const passInput = document.getElementById("passwordInput");
    const errorMsg = document.getElementById("loginError");

    let modalMode = 'login'; // 'login' veya 'link'

    if (btnEmailLogin) {
      btnEmailLogin.addEventListener("click", () => {
        modalMode = 'login';
        modal.querySelector('h2').textContent = "Giriş Yap";
        modalLogin.textContent = "Giriş Yap";
        emailInput.placeholder = "E-posta";
        emailInput.type = "email";
        modal.classList.add("active");
        emailInput.focus();
      });
    }

    if (btnLinkEmail) {
      btnLinkEmail.addEventListener("click", () => {
        modalMode = 'link';
        modal.querySelector('h2').textContent = "Hesabı Bağla";
        modalLogin.textContent = "Bağla";
        emailInput.placeholder = "E-posta Adresi";
        emailInput.type = "email";
        modal.classList.add("active");
        emailInput.focus();
      });
    }

    if (modalClose) {
      modalClose.addEventListener("click", () => {
        modal.classList.remove("active");
        errorMsg.textContent = "";
      });
    }

    if (modalLogin) {
      modalLogin.addEventListener("click", async () => {
        const email = emailInput.value;
        const pass = passInput.value;
        
        if (!email || !pass) {
          errorMsg.textContent = "Lütfen tüm alanları doldurun.";
          return;
        }

        modalLogin.textContent = "İşleniyor...";
        
        let result;
        if (modalMode === 'login') {
          result = await emailLogin(email, pass);
        } else {
          // Bağlama modunda username alanı e-posta olarak kullanılır
          result = await linkEmailPassword(email, pass);
        }
        
        if (!result.success) {
          modalLogin.textContent = modalMode === 'login' ? "Giriş Yap" : "Bağla";
          errorMsg.textContent = result.error === "auth/requires-recent-login" 
            ? "Güvenlik gereği tekrar giriş yapmalısınız." 
            : "İşlem başarısız: " + result.error;
        } else {
            // Başarılı ise modalı kapat ve sayfayı yenile (UI güncellensin)
            modal.classList.remove("active");
            if (modalMode === 'link') {
                // Sayfayı yenilemek yerine UI'ı güncellemek daha şık olur ama router.js'deki router() fonksiyonunu çağırabiliriz
                // Ancak basitlik için:
                location.reload(); 
            }
        }
      });
    }

    this.updateStats();
  }

  static async updateStats() {
    await authReady; // Auth durumunun netleşmesini bekle

    let totalAnswered = 0;
    let totalKnown = 0;

    if (currentUser) {
      // Firebase'den çek
      try {
        // Ana kategorileri tara
        const categories = ["Karargâh Subaylığı", "Komuta Kurmay"];
        
        for (const category of categories) {
          const querySnapshot = await getDocs(collection(db, "users", currentUser.uid, category));
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.knownStatus) {
              Object.values(data.knownStatus).forEach(status => {
                totalAnswered++;
                if (status === "known") totalKnown++;
              });
            }
          });
        }

        // Hesaplanan istatistikleri 'stats' koleksiyonuna kaydet
        await setDoc(doc(db, "users", currentUser.uid, "stats", "summary"), {
          totalAnswered,
          totalKnown,
          updatedAt: Date.now()
        }, { merge: true });

      } catch (error) {
        console.error("İstatistik hatası:", error);
      }
    } else {
      // LocalStorage'dan çek
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith("progress_")) {
          try {
            const knownStatus = JSON.parse(localStorage.getItem(key));
            Object.values(knownStatus).forEach(status => {
              totalAnswered++;
              if (status === "known") totalKnown++;
            });
          } catch (e) { }
        }
      });
    }

    const solvedEl = document.getElementById("stat-solved");
    const rateEl = document.getElementById("stat-rate");

    if (solvedEl) solvedEl.textContent = totalAnswered;
    if (rateEl) {
      const rate = totalAnswered > 0 ? Math.round((totalKnown / totalAnswered) * 100) : 0;
      rateEl.textContent = `%${rate}`;
    }
  }
}