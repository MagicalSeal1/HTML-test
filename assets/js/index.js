const titles = document.querySelectorAll(".section-title");

titles.forEach(title => {
  title.addEventListener("click", () => {
    const content = title.nextElementSibling;
    const isOpen = title.classList.contains("open");

    titles.forEach(t => {
      const c = t.nextElementSibling;
      if (t.classList.contains("open")) {
        // 🔽 KAPATMA ANİMASYONU
        const currentHeight = c.scrollHeight;

        c.style.height = currentHeight + "px";
        c.style.opacity = "1";

        // reflow
        c.offsetHeight;

        c.style.height = "0px";
        c.style.opacity = "0";

        t.classList.remove("open");
      }
    });

    if (!isOpen) {
      title.classList.add("open");

      // 🔼 AÇMA ANİMASYONU
      content.style.visibility = "hidden";
      content.style.height = "auto";

      const fullHeight = content.scrollHeight;

      content.style.height = "0px";
      content.style.opacity = "0";

      content.offsetHeight;

      content.style.visibility = "visible";
      content.style.height = fullHeight + "px";
      content.style.opacity = "1";

      content.addEventListener("transitionend", function handler(e) {
        if (e.propertyName === "height") {
          content.style.height = "auto";
          content.removeEventListener("transitionend", handler);
        }
      });

      // 📱 Mobilde otomatik scroll
      if (window.innerWidth < 768) {
        setTimeout(() => {
          title.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }, 500);
      }
    }
  });
});
