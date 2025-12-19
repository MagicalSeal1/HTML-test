const titles = document.querySelectorAll(".section-title");

titles.forEach(title => {
  title.addEventListener("click", () => {
    const content = title.nextElementSibling;
    const isOpen = title.classList.contains("open");

    // 🔒 Önce tüm dropdownları kapat
    titles.forEach(t => {
      const c = t.nextElementSibling;
      t.classList.remove("open");
      c.style.height = "0px";
      c.style.opacity = "0";
    });

    if (!isOpen) {
      title.classList.add("open");

      // 📏 GERÇEK YÜKSEKLİĞİ ÖLÇ
      const fullHeight = content.scrollHeight;

      content.style.height = fullHeight + "px";
      content.style.opacity = "1";

      // 🎯 Mobilde otomatik hizalama
      if (window.innerWidth < 768) {
        setTimeout(() => {
          title.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }, 200);
      }

      // 🔁 Animasyon bitince auto yap (çok önemli)
      content.addEventListener("transitionend", function handler(e) {
        if (e.propertyName === "height") {
          content.style.height = "auto";
          content.removeEventListener("transitionend", handler);
        }
      });
    }
  });
});
