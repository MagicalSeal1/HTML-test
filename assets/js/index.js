const titles = document.querySelectorAll(".section-title");

titles.forEach(title => {
  title.addEventListener("click", () => {
    const content = title.nextElementSibling;                // .dropdown-content
    const inner = content.querySelector(".dropdown-inner");
    const isOpen = title.classList.contains("open");

    // Önce diğer açıkları kapat
    titles.forEach(t => {
      if (t !== title && t.classList.contains("open")) {
        const c = t.nextElementSibling;
        c.style.height = c.scrollHeight + "px";   // mevcut yüksekliği sabitle
        requestAnimationFrame(() => {
          c.style.height = "0px";
          c.style.opacity = "0";
          t.classList.remove("open");
        });
      }
    });

    if (!isOpen) {
      title.classList.add("open");

      // İçeriğin doğal yüksekliğini ölç
      const fullHeight = inner.scrollHeight;

      // Başlangıç durumunu ayarla
      content.style.opacity = "0";
      content.style.height = "0px";

      // Bir sonraki framede hedef yüksekliğe geç
      requestAnimationFrame(() => {
        content.style.height = fullHeight + "px";
        content.style.opacity = "1";
      });

      // Geçiş bitince height:auto yap
      const onEnd = (e) => {
        if (e.propertyName === "height") {
          content.style.height = "auto";
          content.removeEventListener("transitionend", onEnd);
        }
      };
      content.addEventListener("transitionend", onEnd);

      // Mobilde scroll: geçiş bitişine bağla
      if (window.innerWidth < 768) {
        content.addEventListener("transitionend", () => {
          title.scrollIntoView({ behavior: "smooth", block: "start" });
        }, { once: true });
      }
    }
  });
});
