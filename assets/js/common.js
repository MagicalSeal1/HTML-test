document.addEventListener("DOMContentLoaded", () => {
  const card = document.getElementById("card");
  if (!card) return; // index.html ise çık

  let data = [];
  let index = 0;

  let startX = 0;
  let currentX = 0;
  let hasMoved = false;
  const SWIPE_THRESHOLD = 60;

  const question = document.getElementById("question");
  const answer = document.getElementById("answer");
  const counter = document.getElementById("counter");
  const jumpInput = document.getElementById("jumpInput");
  const scene = document.querySelector(".scene");

  fetch("data/deneme.json")
    .then(res => res.json())
    .then(json => {
      data = json;
      render();
    });

  function render(direction = "") {
    card.style.transition = "none";
    card.classList.remove("flip", "slide-left", "slide-right");
    card.getBoundingClientRect();

    question.textContent = data[index].soru;
    answer.textContent = data[index].cevap;
    counter.textContent = `/ ${data.length}`;
    jumpInput.value = index + 1;

    requestAnimationFrame(() => {
      card.style.transition = "";
      if (direction) card.classList.add(direction);
    });
  }

  card.addEventListener("click", () => {
    if (hasMoved) return;
    card.classList.toggle("flip");
  });

  document.getElementById("next").onclick = () => {
    index = (index + 1) % data.length;
    render("slide-right");
  };

  document.getElementById("prev").onclick = () => {
    index = (index - 1 + data.length) % data.length;
    render("slide-left");
  };

  jumpInput.onchange = () => {
    const val = parseInt(jumpInput.value, 10);
    if (val >= 1 && val <= data.length) {
      index = val - 1;
      render();
    }
  };

  scene.addEventListener("touchstart", e => {
    startX = e.touches[0].clientX;
    currentX = startX;
    hasMoved = false;
  });

  scene.addEventListener("touchmove", e => {
    currentX = e.touches[0].clientX;
    if (Math.abs(currentX - startX) > 10) hasMoved = true;
  });

  scene.addEventListener("touchend", () => {
    if (!hasMoved) return;
    const diff = startX - currentX;

    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      index = diff > 0
        ? (index + 1) % data.length
        : (index - 1 + data.length) % data.length;
      render(diff > 0 ? "slide-right" : "slide-left");
    }
  });
});

