const titles = document.querySelectorAll(".section-title");

const isMobile = () =>
  window.matchMedia("(max-width: 768px)").matches;

titles.forEach(title => {
  title.addEventListener("click", () => {
    const content = title.nextElementSibling;
    const isOpen = title.classList.contains("open");

    // 🔴 Diğer açık dropdown'ları kapat
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

      // 📱 MOBİLDE OTOMATİK SCROLL
      if (isMobile()) {
        setTimeout(() => {
          const y =
            title.getBoundingClientRect().top +
            window.pageYOffset -
            12; // üstten küçük boşluk

          window.scrollTo({
            top: y,
            behavior: "smooth"
          });
        }, 350); // height animasyonu süresiyle uyumlu
      }
    }
  });
});
