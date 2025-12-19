const titles = document.querySelectorAll(".section-title");

titles.forEach(title => {
  title.addEventListener("click", () => {
    const content = title.nextElementSibling;
    const isOpen = title.classList.contains("open");

    // Önce tüm açık olanları kapat
    titles.forEach(t => {
      const c = t.nextElementSibling;
      if (t.classList.contains("open")) {
        c.style.height = c.scrollHeight + "px";
        c.style.opacity = "1";

        // Animasyonu başlatmak için requestAnimationFrame
        requestAnimationFrame(() => {
          c.style.height = "0px";
          c.style.opacity = "0";
          t.classList.remove("open");
        });
      }
    });

    // Eğer tıklanan zaten açık değilse aç
    if (!isOpen) {
      title.classList.add("open");

      // Açma animasyonu
      content.style.height = "0px";
      content.style.opacity = "0";
      content.style.visibility = "visible";

      const fullHeight = content.scrollHeight;

      requestAnimationFrame(() => {
        content.style.height = fullHeight + "px";
        content.style.opacity = "1";
      });

      // Animasyon bitince height'i auto yap
      const handler = e => {
        if (e.propertyName === "height") {
          content.style.height = "auto";
          content.removeEventListener("transitionend", handler);
        }
      };
      content.addEventListener("transitionend", handler);

      // Mobilde otomatik scroll
      if (window.innerWidth < 768) {
        content.addEventListener("transitionend", () => {
          title.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }, { once: true });
      }
    }
  });
});
