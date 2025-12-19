const titles = document.querySelectorAll(".section-title");

titles.forEach(title => {
  title.addEventListener("click", () => {
    const content = title.nextElementSibling;
    const isOpen = title.classList.contains("open");

    // 🔴 Önce diğer açık dropdown'ları kapat
    titles.forEach(otherTitle => {
      if (otherTitle !== title && otherTitle.classList.contains("open")) {
        const otherContent = otherTitle.nextElementSibling;

        otherContent.style.height = otherContent.scrollHeight + "px";
        requestAnimationFrame(() => {
          otherContent.style.height = "0px";
          otherContent.style.opacity = "0";
        });

        otherTitle.classList.remove("open");
      }
    });

    // 🔵 Tıklanan dropdown
    if (isOpen) {
      // KAPAT
      content.style.height = content.scrollHeight + "px";
      requestAnimationFrame(() => {
        content.style.height = "0px";
        content.style.opacity = "0";
      });
      title.classList.remove("open");
    } else {
      // AÇ
      content.style.height = content.scrollHeight + "px";
      content.style.opacity = "1";
      title.classList.add("open");

      content.addEventListener(
        "transitionend",
        function handler(e) {
          if (e.propertyName === "height") {
            content.style.height = "auto";
            content.removeEventListener("transitionend", handler);
          }
        }
      );
    }
  });
});
