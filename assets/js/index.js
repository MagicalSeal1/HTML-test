document.querySelectorAll(".dropdown-toggle").forEach(btn => {
  btn.addEventListener("click", () => {
    btn.classList.toggle("open");
  });
});
