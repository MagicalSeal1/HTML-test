const titles = document.querySelectorAll(".section-title");

titles.forEach(title => {
  title.addEventListener("click", () => {
    const content = title.nextElementSibling;      // .dropdown-content
    const inner = content.querySelector(".dropdown-inner");
    const isOpen = title.classList.contains("open");

    if (isOpen) {
      // KAPAT
      const currentHeight = content.scrollHeight;
      content.style.height = currentHeight + "px";
      requestAnimationFrame(() => {
        content.style.height = "0px";
        content.style.opacity = "0";
      });
      title.classList.remove("open");
    } else {
      // Önce diğer açıkları kapat
      titles.forEach(t => {
        if (t !== title && t.classList.contains("open")) {
          const c = t.nextElementSibling;
          c.style.height = c.scrollHeight + "px";
          requestAnimationFrame(() => {
            c.style.height = "0px";
            c.style.opacity = "0";
            t.classList.remove("open");
          });
        }
      });

      // AÇ
      title.classList.add("open");
      const fullHeight = inner.scrollHeight;
      content.style.opacity = "0";
      content.style.height = "0px";

      requestAnimationFrame(() => {
        content.style.height = fullHeight + "px";
        content.style.opacity = "1";
      });

      const onEnd = (e) => {
        if (e.propertyName === "height") {
          content.style.height = "auto";
          content.removeEventListener("transitionend", onEnd);
        }
      };
      content.addEventListener("transitionend", onEnd);

      if (window.innerWidth < 768) {
        content.addEventListener("transitionend", () => {
          title.scrollIntoView({ behavior: "smooth", block: "start" });
        }, { once: true });
      }
    }
  });
});
