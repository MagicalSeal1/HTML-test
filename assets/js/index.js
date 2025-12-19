const titles = document.querySelectorAll(".section-title");

titles.forEach(title => {
  title.addEventListener("click", () => {
    const isOpen = title.classList.contains("open");

    // diğerlerini kapat
    titles.forEach(t => {
      if (t !== title) t.classList.remove("open");
    });

    // toggle
    title.classList.toggle("open", !isOpen);
  });
});
