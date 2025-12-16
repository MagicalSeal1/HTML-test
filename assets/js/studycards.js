let data = [];
let index = 0;
let isFlipped = false;
let isSliding = false;

let startX = 0;
let currentX = 0;
let hasMoved = false;
const SWIPE_THRESHOLD = 60;

const card = document.getElementById("card");
const question = document.getElementById("question");
const answer = document.getElementById("answer");
const counter = document.getElementById("counter");
const jumpInput = document.getElementById("jumpInput");
const scene = document.querySelector(".scene");

/* URL param → JSON seçimi */
const params = new URLSearchParams(window.location.search);

const dataName = params.get("data");
if (!dataName) {
  document.body.innerHTML = `
    <h2 style="color:#fff">Veri seçilmedi</h2>
    <p style="color:#9ca3af">Lütfen ana sayfadan bir kart seçin.</p>
  `;
  throw new Error("data parametresi yok");
}

const jsonPath = `/HTML-test/assets/data/${dataName}.json`;

fetch(jsonPath)
  .then(r => {
    if (!r.ok) throw new Error("JSON bulunamadı");
    return r.json();
  })
  .then(json => {
    document.getElementById("pageTitle").textContent = json.title;
    document.getElementById("pageDescription").textContent = json.description;
    data = json.cards;
    index = 0;
    render();
  });

function render(direction = "") {
  isSliding = true;
  isFlipped = false;

  /* Flip’i anında kapat */
  card.style.transition = "none";
  card.classList.remove("flip", "slide-left", "slide-right");

  /* Safari reflow zorlaması */
  card.offsetHeight;

  /* İçerik */
  question.textContent = data[index].soru;
  answer.textContent = data[index].cevap;
  counter.textContent = `/ ${data.length}`;
  jumpInput.value = index + 1;

  requestAnimationFrame(() => {
    card.style.transition = "";

    if (direction) {
      card.classList.add(direction);
    }

    setTimeout(() => {
      isSliding = false;
    }, 420); // slide animasyon süresi
  });
}

/* TAP = FLIP (slide sırasında KAPALI) */
card.addEventListener("click", () => {
  if (hasMoved || isSliding) return;

  isFlipped = !isFlipped;
  card.classList.toggle("flip", isFlipped);
});

/* BUTONLAR */
document.getElementById("next").onclick = () => {
  if (isSliding) return;
  index = (index + 1) % data.length;
  render("slide-right");
};

document.getElementById("prev").onclick = () => {
  if (isSliding) return;
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

/* SWIPE */
scene.addEventListener("touchstart", e => {
  startX = e.touches[0].clientX;
  currentX = startX;
  hasMoved = false;
}, { passive: true });

scene.addEventListener("touchmove", e => {
  currentX = e.touches[0].clientX;
  if (Math.abs(currentX - startX) > 12) {
    hasMoved = true;
  }
}, { passive: true });

scene.addEventListener("touchend", () => {
  if (!hasMoved || isSliding) return;

  const diff = startX - currentX;

  if (Math.abs(diff) > SWIPE_THRESHOLD) {
    if (diff > 0) {
      index = (index + 1) % data.length;
      render("slide-right");
    } else {
      index = (index - 1 + data.length) % data.length;
      render("slide-left");
    }
  }

  hasMoved = false;
});
