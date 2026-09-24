let allCards = [];
let cards = [];
let index = 0;
let showingAnswer = false;
let selectedCategories = new Set();
const storageKey = "mb800_flashcards_cards";

const card = document.getElementById("card");
const cardLabel = document.getElementById("cardLabel");
const cardContent = document.getElementById("cardContent");
const meta = document.getElementById("meta");
const menuToggle = document.getElementById("menuToggle");
const categoryMenu = document.getElementById("categoryMenu");
const categoryList = document.getElementById("categoryList");
const menuBackdrop = document.getElementById("menuBackdrop");

function renderCategoryOptions(categories) {
  categoryList.replaceChildren();
  categories.forEach((category) => {
    const label = document.createElement("label");
    label.className = "category-option";
    label.innerHTML = `<input type="checkbox" value="${category}"><span>${category}</span>`;
    const checkbox = label.querySelector("input");
    checkbox.checked = selectedCategories.has(category);
    checkbox.addEventListener("change", updateSelectedCategories);
    categoryList.append(label);
  });
}

function updateSelectedCategories() {
  selectedCategories = new Set(
    [...categoryList.querySelectorAll("input:checked")].map((input) => input.value),
  );
  cards = selectedCategories.size
    ? allCards.filter((item) => selectedCategories.has(item.category))
    : allCards;
  index = 0;
  showingAnswer = false;
  render();
}

function setAllCategories(selected) {
  categoryList.querySelectorAll("input").forEach((input) => {
    input.checked = selected;
  });
  updateSelectedCategories();
}

function setMenuOpen(isOpen) {
  categoryMenu.hidden = !isOpen;
  menuBackdrop.hidden = !isOpen;
  menuToggle.setAttribute("aria-expanded", String(isOpen));
}

function render() {
  const current = cards[index];
  if (!current) {
    cardLabel.textContent = "No cards";
    cardContent.textContent = "No flashcards found.";
    meta.textContent = `${allCards.length} cards available`;
    return;
  }

  card.classList.toggle("answer", showingAnswer);
  cardLabel.textContent = showingAnswer ? "Answer" : "Question";
  cardContent.textContent = showingAnswer ? current.answer : current.question;
  meta.textContent = selectedCategories.size
    ? `Card ${index + 1} of ${cards.length} · ${selectedCategories.size} ${selectedCategories.size === 1 ? "category" : "categories"}`
    : `Card ${index + 1} of ${cards.length} · All categories`;
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
        typeof item.answer === "string" &&
        typeof item.category === "string",
    );
    return valid ? parsed : null;
  } catch {
    return null;
  }
}

function saveCards() {
  localStorage.setItem(storageKey, JSON.stringify(cards));
}

document.getElementById("nextBtn").addEventListener("click", nextCard);
document.getElementById("prevBtn").addEventListener("click", previousCard);
document.getElementById("flipBtn").addEventListener("click", flipCard);
document.getElementById("shuffleBtn").addEventListener("click", shuffleCard);
menuToggle.addEventListener("click", () => setMenuOpen(categoryMenu.hidden));
document.getElementById("closeMenu").addEventListener("click", () => setMenuOpen(false));
menuBackdrop.addEventListener("click", () => setMenuOpen(false));
document.getElementById("selectAllBtn").addEventListener("click", () => setAllCategories(true));
document.getElementById("clearAllBtn").addEventListener("click", () => setAllCategories(false));

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
    allCards = loadStoredCards() ?? data;
    const categories = [...new Set(allCards.map((item) => item.category))].sort((a, b) => a.localeCompare(b, "no"));
    selectedCategories = new Set(categories);
    renderCategoryOptions(categories);
    cards = allCards;
    render();
  })
  .catch(() => {
    cardLabel.textContent = "Error";
    cardContent.textContent = "Could not load flashcards.";
    meta.textContent = "";
  });
