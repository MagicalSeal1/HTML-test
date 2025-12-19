const titles = document.querySelectorAll(".section-title");

titles.forEach(title => {
  title.addEventListener("click", () => {
    const content = title.nextElementSibling;
    const isOpen = title.classList.contains("open");

    // 🔒 Önce hepsini kapat
    titles.forEach(t => {
      const c = t.nextElementSibling;
      t.classList.remove("open");
      c.style.height = "0px";
      c.style.opacity = "0";
    });

    if (!isOpen) {
      title.classList.add("open");

      // 1️⃣ Ölçüm için geçici olarak aç
      content.style.visibility = "hidden";
      content.style.height = "auto";

      const fullHeight = content.scrollHeight;

      // 2️⃣ Geri kapat (ölçüm bitti)
      content.style.height = "0px";
      content.style.opacity = "0";

      // 🔁 reflow zorla (çok önemli)
      content.offsetHeight;

      // 3️⃣ Animasyonla aç
      content.style.visibility = "visible";
      content.style.height = fullHeight + "px";
      content.style.opacity = "1";

      // 4️⃣ Animasyon bitince auto yap
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
        }, 250);
      }
    }
  });
});
