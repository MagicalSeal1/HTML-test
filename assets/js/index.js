document.querySelectorAll(".section-title").forEach(title => {
  title.addEventListener("click", () => {
    title.classList.toggle("open");
  });
});
