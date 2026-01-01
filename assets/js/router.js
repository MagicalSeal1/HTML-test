import HomeView from "./views/home.js";
import StudyCardsView from "./views/studycards.js";
import ProfileView from "./views/profile.js";

// Rota sırası (Geçiş yönünü belirlemek için)
const routeOrder = ["/", "/studycards", "/profile"];

let lastPath = null;

export const router = async () => {
  // 1. Hash'ten yolu ayrıştır (Örn: #/studycards?data=... -> /studycards)
  let hash = location.hash.slice(1); // # işaretini at
  if (!hash) hash = "/";
  
  const [path, query] = hash.split('?');

  // 2. Geçiş Yönünü Belirle
  let transition = "fade";
  if (lastPath !== null && path !== lastPath) {
    const currentIndex = routeOrder.indexOf(lastPath);
    const targetIndex = routeOrder.indexOf(path);
    
    if (currentIndex !== -1 && targetIndex !== -1) {
      transition = targetIndex > currentIndex ? "slide-left" : "slide-right";
    }
  }
  lastPath = path;

  const routes = [
    { path: "/", view: HomeView },
    { path: "/index.html", view: HomeView },
    { path: "/studycards", view: StudyCardsView },
    { path: "/studycards.html", view: StudyCardsView },
    { path: "/profile", view: ProfileView },
    { path: "/profile.html", view: ProfileView },
  ];

  // Mevcut URL ile rotaları eşleştir
  const potentialMatches = routes.map(route => {
    return {
      route: route,
      isMatch: path === route.path
    };
  });

  let match = potentialMatches.find(potentialMatch => potentialMatch.isMatch);

  if (!match) {
    match = {
      route: routes[0],
      isMatch: true
    };
  }

  // View Enjeksiyonu
  const app = document.getElementById("app");
  const viewClass = match.route.view;
  
  // Yeni görünümü oluştur
  const newView = document.createElement("div");
  newView.className = "view-section";
  newView.innerHTML = viewClass.getHtml();

  // İlk yükleme ise direkt ekle
  if (app.children.length === 0) {
    app.appendChild(newView);
  } else {
    // Animasyonlu geçiş
    const oldView = app.firstElementChild;
    
    // ID çakışmasını önlemek için eski view'daki ID'leri temizle (Opsiyonel ama güvenli)
    // oldView.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));

    // Sınıfları ekle
    newView.classList.add(`${transition}-enter`);
    oldView.classList.add(`${transition}-exit`);

    app.appendChild(newView);

    // Animasyon bitince eskiyi kaldır
    newView.addEventListener("animationend", () => {
      newView.classList.remove(`${transition}-enter`);
      if (oldView && oldView.parentNode) {
        oldView.remove();
      }
    }, { once: true });
  }

  // Nav bar aktif durumu güncelle
  document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));

  if (viewClass === HomeView) {
    document.getElementById("nav-index")?.classList.add("active");
    HomeView.init();

  } else if (viewClass === StudyCardsView) {
    document.getElementById("nav-cards")?.classList.add("active");
    
    // Parametreleri Hash'ten al
    const params = new URLSearchParams(query);
    let dataName = params.get("data");
    
    // Eğer URL'de data yoksa, son çalışılan konuyu aç
    if (!dataName) {
      dataName = localStorage.getItem("lastFullPath");
      if (dataName) {
        // URL'i güncelle (sayfa yenilemeden)
        const newUrl = `#${path}?data=${dataName}`;
        history.replaceState(null, null, newUrl);
      }
    }
    
    if (dataName) {
      StudyCardsView.init(dataName);
    }

  } else if (viewClass === ProfileView) {
    document.getElementById("nav-profile")?.classList.add("active");
    ProfileView.init();
  }
};

// Hash değişimlerini dinle
window.addEventListener("hashchange", router);

// Sayfa yüklendiğinde
document.addEventListener("DOMContentLoaded", router);