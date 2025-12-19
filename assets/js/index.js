document.querySelectorAll(".section-title").forEach(title => {
  title.addEventListener("click", () => {
    const isOpen = title.classList.contains("open");

    // Aynı anda sadece 1 açık kalsın
    document.querySelectorAll(".section-title.open").forEach(t => {
      if (t !== title) t.classList.remove("open");
    });

    // Tıklananı aç / kapat
    title.classList.toggle("open", !isOpen);
  });
});
