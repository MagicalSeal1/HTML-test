import { currentUser, googleLogin, emailLogin, linkEmailPassword, signOutUser, db, authReady } from "../login.js";
import { collection, getDocs, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

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

        <!-- İSTATİSTİK PANELİ -->
        <div class="stats-grid" style="width: 100%; max-width: 400px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
          <div class="stat-card" style="background: var(--card); padding: 15px; border-radius: 12px; border: 1px solid var(--border);">
            <h3 id="stat-solved" style="color: var(--accent); font-size: 2rem;">0</h3>
            <p style="font-size: 0.8rem; color: var(--muted);">Çözülen</p>
          </div>
          <div class="stat-card" style="background: var(--card); padding: 15px; border-radius: 12px; border: 1px solid var(--border);">
            <h3 id="stat-rate" style="color: #2ecc71; font-size: 2rem;">%0</h3>
            <p style="font-size: 0.8rem; color: var(--muted);">Başarı</p>
          </div>
          <div class="stat-card" style="background: var(--card); padding: 15px; border-radius: 12px; border: 1px solid var(--border);">
            <h3 id="stat-streak" style="color: #f59e0b; font-size: 2rem;">0</h3>
            <p style="font-size: 0.8rem; color: var(--muted);">Gün Seri</p>
          </div>
        </div>

        <!-- GÜNLÜK HEDEF -->
        <div class="profile-section" style="width: 100%; max-width: 400px; margin-top: 20px; text-align: left;">
            <h3 style="font-size: 1.1rem; margin-bottom: 10px; color: var(--text);">Günlük Hedef</h3>
            <div class="goal-container" style="background: var(--card); padding: 15px; border-radius: 12px; border: 1px solid var(--border);">
                <div class="progress-bar" style="background: #374151; height: 10px; border-radius: 5px; overflow: hidden; margin-bottom: 8px;">
                    <div id="goal-progress" style="width: 0%; height: 100%; background: var(--accent); transition: width 0.5s ease;"></div>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.9rem; color: var(--muted);">
                    <span id="goal-current">0 Soru</span>
                    <span id="goal-target">Hedef: 50</span>
                </div>
            </div>
        </div>

        <!-- FAVORİLER -->
        <div class="profile-section" style="width: 100%; max-width: 400px; margin-top: 15px;">
            <button id="btn-favorites" class="menu-card" style="width: 100%; text-align: left; display: flex; align-items: center; gap: 10px; padding: 15px; font-size: 1.1rem; cursor: pointer;">
                <span style="color: #e0ffff; font-size: 1.2rem;">★</span> Favorilerim
            </button>
        </div>

        <!-- ROZETLER BÖLÜMÜ -->
        <div class="badges-section" style="width: 100%; max-width: 400px; margin-top: 25px; text-align: left;">
          <h3 style="font-size: 1.2rem; margin-bottom: 10px; color: var(--text); border-bottom: 1px solid var(--border); padding-bottom: 5px;">Rozetler</h3>
          <div id="badges-container" style="display: flex; gap: 10px; flex-wrap: wrap;">
            <!-- JS ile doldurulacak -->
            <div class="badge-item" id="badge-newbie" style="opacity: 0.5; filter: grayscale(1); transition: all 0.3s;">
              <span style="font-size: 2rem;">🌱</span>
              <div style="font-size: 0.8rem;">Acemi<br><span style="font-size:0.7rem; color:var(--muted)">(10 Soru)</span></div>
            </div>
            <div class="badge-item" id="badge-bronze" style="opacity: 0.5; filter: grayscale(1); transition: all 0.3s;">
              <span style="font-size: 2rem;">🥉</span>
              <div style="font-size: 0.8rem;">Bronz<br><span style="font-size:0.7rem; color:var(--muted)">(50 Soru)</span></div>
            </div>
            <div class="badge-item" id="badge-silver" style="opacity: 0.5; filter: grayscale(1); transition: all 0.3s;">
              <span style="font-size: 2rem;">🥈</span>
              <div style="font-size: 0.8rem;">Gümüş<br><span style="font-size:0.7rem; color:var(--muted)">(100 Soru)</span></div>
            </div>
            <div class="badge-item" id="badge-gold" style="opacity: 0.5; filter: grayscale(1); transition: all 0.3s;">
              <span style="font-size: 2rem;">🥇</span>
              <div style="font-size: 0.8rem;">Altın<br><span style="font-size:0.7rem; color:var(--muted)">(500 Soru)</span></div>
            </div>
          </div>
        </div>
        
        <!-- AYARLAR -->
        <div class="profile-section" style="width: 100%; max-width: 400px; margin-top: 25px; text-align: left;">
            <h3 style="font-size: 1.2rem; margin-bottom: 10px; color: var(--text); border-bottom: 1px solid var(--border); padding-bottom: 5px;">Ayarlar</h3>
            
            <div class="setting-item" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0;">
                <span>Karanlık Mod</span>
                <label class="switch" style="position: relative; display: inline-block; width: 50px; height: 24px;">
                    <input type="checkbox" id="toggle-theme" checked style="opacity: 0; width: 0; height: 0;">
                    <span class="slider round" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #374151; transition: .4s; border-radius: 34px;"></span>
                </label>
            </div>
            <div class="setting-item" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0;">
                <span>Yazı Boyutu</span>
                <select id="select-fontsize" style="background: var(--card); color: var(--text); border: 1px solid var(--border); padding: 5px; border-radius: 5px;">
                    <option value="normal">Normal</option>
                    <option value="large">Büyük</option>
                </select>
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

        <!-- FAVORITES MODAL -->
        <div id="favModal" class="modal-overlay">
            <div class="modal-box" style="max-width: 400px; height: 80vh; display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h2>Favoriler</h2>
                    <button id="closeFavBtn" style="background:none; border:none; color:var(--text); font-size:1.5rem; cursor:pointer;">&times;</button>
                </div>
                <div id="favList" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px;">
                    <p style="text-align:center; color:var(--muted); margin-top: 20px;">Yükleniyor...</p>
                </div>
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
    const btnFavorites = document.getElementById("btn-favorites");
    const closeFavBtn = document.getElementById("closeFavBtn");
    const favModal = document.getElementById("favModal");

    if (btnLogin) {
      btnLogin.addEventListener("click", googleLogin);
    }

    if (btnLogout) {
      btnLogout.addEventListener("click", signOutUser);
    }

    if (btnFavorites) {
        btnFavorites.addEventListener("click", () => this.loadFavorites());
    }

    if (closeFavBtn) {
        closeFavBtn.addEventListener("click", () => favModal.classList.remove("active"));
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
    this.initSettings();
  }

  static async updateStats() {
    await authReady; // Auth durumunun netleşmesini bekle

    let totalAnswered = 0;
    let totalKnown = 0;
    
    // Basit Seri (Streak) Mantığı - LocalStorage tabanlı
    const today = new Date().toDateString();
    const lastStudyDate = localStorage.getItem('lastStudyDate');
    let streak = parseInt(localStorage.getItem('streak') || '0');

    if (lastStudyDate !== today) {
        // Eğer dün çalıştıysa seriyi koru, yoksa sıfırla (Basit mantık)
        // Gerçek tarih kontrolü için moment.js vb. gerekir ama burada basit tutuyoruz.
        // Şimdilik sadece gösterim yapıyoruz.
    }
    document.getElementById("stat-streak").textContent = streak;

    // Günlük Hedef
    const dailyGoal = 50;
    const todayCount = parseInt(localStorage.getItem('todayCount') || '0'); // Studycards.js'de artırılmalı
    document.getElementById("goal-current").textContent = `${todayCount} Soru`;
    document.getElementById("goal-target").textContent = `Hedef: ${dailyGoal}`;
    const progressPct = Math.min(100, (todayCount / dailyGoal) * 100);
    document.getElementById("goal-progress").style.width = `${progressPct}%`;

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

    // Rozetleri Güncelle
    this.updateBadge("badge-newbie", totalAnswered >= 10);
    this.updateBadge("badge-bronze", totalAnswered >= 50);
    this.updateBadge("badge-silver", totalAnswered >= 100);
    this.updateBadge("badge-gold", totalAnswered >= 500);
  }

  static updateBadge(id, isUnlocked) {
    const el = document.getElementById(id);
    if (el && isUnlocked) {
      el.style.opacity = "1";
      el.style.filter = "grayscale(0)";
      el.style.transform = "scale(1.1)";
    }
  }

  static initSettings() {
    const toggleTheme = document.getElementById('toggle-theme');
    const selectFont = document.getElementById('select-fontsize');

    // 1. Başlangıçta ayarları yükle ve uygula
    this.loadAndApplyUserSettings();

    // 2. Değişiklikleri kaydedecek olay dinleyicileri ekle
    toggleTheme.addEventListener('change', (e) => {
      const newTheme = e.target.checked ? 'dark' : 'light';
      const currentSettings = JSON.parse(localStorage.getItem('userSettings') || '{}');
      const newSettings = { ...currentSettings, theme: newTheme };
      this.applySettings(newSettings);
      this.saveUserSettings(newSettings);
    });

    selectFont.addEventListener('change', (e) => {
      const newSize = e.target.value;
      const currentSettings = JSON.parse(localStorage.getItem('userSettings') || '{}');
      const newSettings = { ...currentSettings, fontSize: newSize };
      this.applySettings(newSettings);
      this.saveUserSettings(newSettings);
    });
  }

  static async saveUserSettings(settings) {
    if (!settings) return;
    localStorage.setItem('userSettings', JSON.stringify(settings));

    await authReady;
    if (currentUser) {
      try {
        await setDoc(doc(db, "users", currentUser.uid, "settings", "userSettings"), settings, { merge: true });
      } catch (error) {
        console.error("Firebase'e ayar kaydetme hatası:", error);
      }
    }
  }

  static applySettings(settings) {
    const toggleTheme = document.getElementById('toggle-theme');
    const selectFont = document.getElementById('select-fontsize');

    if (settings.theme === 'light') {
      document.body.classList.add('light-mode');
      if (toggleTheme) toggleTheme.checked = false;
    } else {
      document.body.classList.remove('light-mode');
      if (toggleTheme) toggleTheme.checked = true;
    }

    if (settings.fontSize === 'large') {
      document.documentElement.style.fontSize = '18px';
      if (selectFont) selectFont.value = 'large';
    } else {
      document.documentElement.style.fontSize = '16px';
      if (selectFont) selectFont.value = 'normal';
    }
  }

  static async loadAndApplyUserSettings() {
    let settings = { theme: 'dark', fontSize: 'normal' }; // Varsayılanlar

    const localSettings = localStorage.getItem('userSettings');
    if (localSettings) {
      try {
        settings = { ...settings, ...JSON.parse(localSettings) };
      } catch (e) { /* ayrıştırma hatasını yoksay */ }
    }

    await authReady;
    if (currentUser) {
      try {
        const userSettingsDoc = await getDoc(doc(db, "users", currentUser.uid, "settings", "userSettings"));
        if (userSettingsDoc.exists()) {
          settings = { ...settings, ...userSettingsDoc.data() };
          localStorage.setItem('userSettings', JSON.stringify(settings)); // Yerel depoyu senkronize et
        }
      } catch (error) {
        console.error("Firebase'den ayar yükleme hatası:", error);
      }
    }
    
    this.applySettings(settings);
  }

  static async loadFavorites() {
      const modal = document.getElementById("favModal");
      const list = document.getElementById("favList");
      modal.classList.add("active");
      list.innerHTML = '<p style="text-align:center; color:var(--muted); margin-top: 20px;">Yükleniyor...</p>';

      let favorites = [];
      
      // Firebase'den favorileri çek (Basitleştirilmiş tarama)
      if (currentUser) {
          const categories = ["Karargâh Subaylığı", "Komuta Kurmay"];
          for (const category of categories) {
              try {
                  const q = await getDocs(collection(db, "users", currentUser.uid, category));
                  q.forEach(doc => {
                      const data = doc.data();
                      if (data.favorites) {
                          Object.keys(data.favorites).forEach(cardId => {
                              if (data.favorites[cardId] === true) {
                                  favorites.push({ id: cardId, cat: category, sub: doc.id });
                              }
                          });
                      }
                  });
              } catch (e) { console.error(e); }
          }
      }

      if (favorites.length === 0) {
          list.innerHTML = '<p style="text-align:center; color:var(--muted); margin-top: 20px;">Henüz favori kartınız yok.</p>';
      } else {
          list.innerHTML = favorites.map(f => `
            <div class="menu-card" style="padding: 15px; border-radius: 8px; background: var(--card); border: 1px solid var(--border);">
                <div style="font-weight:bold; color:var(--accent)">${f.sub}</div>
                <div style="font-size:0.9rem; color:var(--text)">Kart ID: ${f.id}</div>
            </div>
          `).join('');
      }
  }
}