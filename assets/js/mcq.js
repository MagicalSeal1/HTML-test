let data = [
  {
    soru: "HTML nedir?",
    options: ["Programlama dili", "İşletim sistemi", "İşaretleme dili", "Veritabanı"],
    answer: 2
  },
  {
    soru: "CSS ile ne yapılır?",
    options: ["Veri tabanı yönetimi", "Stil ve tasarım", "Programlama", "Sunucu yönetimi"],
    answer: 1
  },
  {
    soru: "JS nedir?",
    options: ["Veritabanı", "Programlama dili", "İşletim sistemi", "Tarayıcı"],
    answer: 1
  }
];

let index = 0;
let correctCount = 0;
let wrongCount = 0;

const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const correctEl = document.getElementById("correctCount");
const wrongEl = document.getElementById("wrongCount");
const resetBtn = document.getElementById("resetBtn");
let answered = false; // yeni değişken

function render() {
  const cardData = data[index];
  questionEl.textContent = cardData.soru;
  optionsEl.innerHTML = "";
  answered = false; // her yeni soruda cevap sıfırlanır

  cardData.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.onclick = () => checkAnswer(i, btn);
    optionsEl.appendChild(btn);
  });
}

function checkAnswer(selected, btn) {
  if (answered) return; // eğer zaten cevaplandıysa işlem yapma
  answered = true;      // artık cevap verildi

  const correctIndex = data[index].answer;

  if (selected === correctIndex) {
    btn.classList.add("correct");
    correctCount++;
  } else {
    btn.classList.add("wrong");
    wrongCount++;
    // doğru cevabı göster
    optionsEl.children[correctIndex].classList.add("correct");
  }

  updateCounters();
}

function updateCounters() {
  correctEl.textContent = correctCount;
  wrongEl.textContent = wrongCount;
}

resetBtn.onclick = () => {
  correctCount = 0;
  wrongCount = 0;
  updateCounters();
  render();
}

document.getElementById("next").onclick = () => {
  index = (index + 1) % data.length;
  render();
}

document.getElementById("prev").onclick = () => {
  index = (index - 1 + data.length) % data.length;
  render();
}

// İlk render
render();
