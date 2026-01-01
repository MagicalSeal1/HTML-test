import HomeView from "./views/home.js";
import StudyCardsView from "./views/studycards.js";
import ProfileView from "./views/profile.js";

// Sayfa yönlendirme (Router) fonksiyonu
const navigateTo = url => {
  history.pushState(null, null, url);
  router();
};

const router = async () => {
  const routes = [
    { path: "/", view: HomeView, navId: "nav-home" },
    { path: "/studycards", view: StudyCardsView, navId: "nav-cards" },
    { path: "/profile", view: ProfileView, navId: "nav-profile" }
  ];

  // Mevcut URL ile eşleşen rotayı bul
  // Query parametrelerini (?data=...) yok sayarak eşleştirme yapıyoruz
  const potentialMatches = routes.map(route => {
    return {
      route: route,
      isMatch: location.pathname === route.path
    };
  });

  let match = potentialMatches.find(potentialMatch => potentialMatch.isMatch);

  // Eşleşme yoksa Ana Sayfaya yönlendir
  if (!match) {
    match = {
      route: routes[0],
      isMatch: true
    };
  }

  const view = match.route.view;

  // 1. İçeriği yükle
  document.querySelector("#app").innerHTML = view.getHtml();
  
  // URL'den data parametresini al
  const urlParams = new URLSearchParams(window.location.search);
  const dataParam = urlParams.get('data');

  // 2. Sayfa özelindeki scriptleri çalıştır (Event listener'lar vb.)
  if (view.init) {
    view.init(dataParam);
  }

  // 3. Navigasyon Barını Güncelle (Aktif sınıfını ata)
  updateActiveNav(match.route.navId);
};

// Navigasyon barındaki aktif sınıfını yöneten fonksiyon
const updateActiveNav = (navId) => {
  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.remove("active");
  });
  const activeLink = document.getElementById(navId);
  if (activeLink) {
    activeLink.classList.add("active");
  }
};

// Tarayıcı geri/ileri butonları için
window.addEventListener("popstate", router);

// Sayfa yüklendiğinde router'ı çalıştır
document.addEventListener("DOMContentLoaded", () => {
  document.body.addEventListener("click", e => {
    // data-link özniteliğine sahip linkler için varsayılan davranışı engelle (SPA mantığı)
    if (e.target.matches("[data-link]") || e.target.closest("[data-link]")) {
      e.preventDefault();
      const link = e.target.matches("[data-link]") ? e.target : e.target.closest("[data-link]");
      navigateTo(link.href);
    }
  });

  router();
});