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
const jumpSelect = document.getElementById("jumpSelect");
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

    buildJumpMenu(data.length);
    render();
  });

/* 🔽 JUMP SELECT OLUŞTUR */
function buildJumpMenu(total) {
  jumpSelect.innerHTML = "";

  for (let i = 1; i <= total; i++) {
    const option = document.createElement("option");
    option.value = i - 1
