let cards = [];
let index = 0;
let showingAnswer = false;
let canAddCards = false;
const editorPassword = "hemmelig";
const storageKey = "mb800_flashcards_cards";

const card = document.getElementById("card");
const cardLabel = document.getElementById("cardLabel");
const cardContent = document.getElementById("cardContent");
const meta = document.getElementById("meta");
const editor = document.getElementById("editor");
const newQuestion = document.getElementById("newQuestion");
const newAnswer = document.getElementById("newAnswer");

function render() {
  const current = cards[index];
  if (!current) {
    cardLabel.textContent = "No cards";
    cardContent.textContent = "No flashcards found.";
    meta.textContent = "";
    return;
  }

  card.classList.toggle("answer", showingAnswer);
  cardLabel.textContent = showingAnswer ? "Answer" : "Question";
  cardContent.textContent = showingAnswer ? current.answer : current.question;
  meta.textContent = `Card ${index + 1} of ${cards.length}`;
}

function nextCard() {
  if (!cards.length) return;
  index = (index + 1) % cards.length;
  showingAnswer = false;
  render();
}

function previousCard() {
  if (!cards.length) return;
  index = (index - 1 + cards.length) % cards.length;
  showingAnswer = false;
  render();
}

function flipCard() {
  showingAnswer = !showingAnswer;
  render();
}

function shuffleCard() {
  if (cards.length < 2) return;
  let next = index;
  while (next === index) {
    next = Math.floor(Math.random() * cards.length);
  }
  index = next;
  showingAnswer = false;
  render();
}

function loadStoredCards() {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const valid = Array.isArray(parsed) && parsed.every(
      (item) =>
        item &&
        typeof item.question === "string" &&
        typeof item.answer === "string",
    );
    return valid ? parsed : null;
  } catch {
    return null;
  }
}

function saveCards() {
  localStorage.setItem(storageKey, JSON.stringify(cards));
}

function unlockCardEditor() {
  if (canAddCards) {
    editor.hidden = !editor.hidden;
    return;
  }

  const password = window.prompt("Enter password to add cards:");
  if (password !== editorPassword) {
    window.alert("Wrong password.");
    return;
  }

  canAddCards = true;
  editor.hidden = false;
  newQuestion.focus();
}

function addCard() {
  if (!canAddCards) return;
  const question = newQuestion.value.trim();
  const answer = newAnswer.value.trim();
  if (!question || !answer) return;

  cards.push({ question, answer });
  index = cards.length - 1;
  showingAnswer = false;
  saveCards();
  render();

  newQuestion.value = "";
  newAnswer.value = "";
  newQuestion.focus();
}

document.getElementById("nextBtn").addEventListener("click", nextCard);
document.getElementById("prevBtn").addEventListener("click", previousCard);
document.getElementById("flipBtn").addEventListener("click", flipCard);
document.getElementById("shuffleBtn").addEventListener("click", shuffleCard);
document.getElementById("addCardsBtn").addEventListener("click", unlockCardEditor);
document.getElementById("saveCardBtn").addEventListener("click", addCard);

window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    flipCard();
  } else if (event.code === "ArrowRight") {
    nextCard();
  } else if (event.code === "ArrowLeft") {
    previousCard();
  }
});

fetch("cards.json")
  .then((response) => response.json())
  .then((data) => {
    cards = loadStoredCards() ?? data;
    render();
  })
  .catch(() => {
    cardLabel.textContent = "Error";
    cardContent.textContent = "Could not load flashcards.";
    meta.textContent = "";
  });
