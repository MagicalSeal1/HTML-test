const titles = document.querySelectorAll(".section-title");

titles.forEach(title => {
  title.addEventener("click", () => {
    const content = title.nextElementSibling;                // .section-content
    const inner = content.querySelector(".section-content__inner");
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

      // 1) İçeriğin doğal yüksekliğini ölç
      //   - inner her zaman layout’ta (display:block) ve görünür olmalı
      //   - ölçümü yapmadan önce içerik gizli olmamalı (visibility yerine opacity kullanıyoruz)
      const fullHeight = inner.scrollHeight;

      // 2) Başlangıç durumunu ayarla
      content.style.opacity = "0";
      content.style.height = "0px";

      // 3) Bir sonraki framede hedef yüksekliğe geç
      requestAnimationFrame(() => {
        content.style.height = fullHeight + "px";
        content.style.opacity = "1";
      });

      // 4) Geçiş bitince height:auto yap
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
