document.querySelectorAll(".section-title").forEach(title => {
  title.addEventListener("click", () => {
    const content = title.nextElementSibling;
    const isOpen = title.classList.contains("open");

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

      // Animasyon bitince height:auto
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
