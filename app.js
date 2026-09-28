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
const flashcardsPanel = document.getElementById("flashcardsPanel");
const mockExamPanel = document.getElementById("mockExamPanel");
const flashcardsTab = document.getElementById("flashcardsTab");
const mockExamTab = document.getElementById("mockExamTab");
const mockMeta = document.getElementById("mockMeta");
const mockQuestion = document.getElementById("mockQuestion");
const mockOptions = document.getElementById("mockOptions");
const mockFeedback = document.getElementById("mockFeedback");
let mockQuestions = [];
let mockIndex = 0;
let mockOrder = [];

function setStudyTab(showMockExam) {
  flashcardsPanel.hidden = showMockExam;
  mockExamPanel.hidden = !showMockExam;
  flashcardsTab.classList.toggle("active", !showMockExam);
  mockExamTab.classList.toggle("active", showMockExam);
  flashcardsTab.setAttribute("aria-selected", String(!showMockExam));
  mockExamTab.setAttribute("aria-selected", String(showMockExam));
}

function renderMockQuestion() {
  const current = mockQuestions[mockIndex];
  mockOptions.replaceChildren();
  mockFeedback.textContent = "";
  if (!current) {
    mockMeta.textContent = "No mock questions found.";
    mockQuestion.textContent = "Add questions to mock_qs.json to begin.";
    return;
  }
  mockMeta.textContent = `Question ${mockIndex + 1} of ${mockQuestions.length} · ${current.topic} · ${current.type}`;
  mockQuestion.textContent = current.question;
  mockOrder = current.alternatives.map((_, index) => index);
  if (current.matching) {
    renderMockMatching(current);
    return;
  }
  if (current.type === "drag_and_drop" || current.type === "sequence") {
    renderMockOrder(current);
    return;
  }
  current.alternatives.forEach((alternative, index) => {
    const label = document.createElement("label");
    label.className = "mock-option";
    const input = document.createElement("input");
    input.type = current.type === "multi_select" ? "checkbox" : "radio";
    input.name = "mock-answer";
    input.value = index;
    label.append(input, document.createTextNode(alternative));
    mockOptions.append(label);
  });
}

function renderMockMatching(current) {
  current.targets.forEach((target, targetIndex) => {
    const row = document.createElement("label");
    row.className = "mock-option mock-match-row";
    row.append(document.createTextNode(target));
    const select = document.createElement("select");
    select.dataset.targetIndex = targetIndex;
    select.innerHTML = `<option value="">Choose an answer</option>`;
    current.alternatives.forEach((alternative, alternativeIndex) => {
      const option = document.createElement("option");
      option.value = alternativeIndex;
      option.textContent = alternative;
      select.append(option);
    });
    row.append(select);
    mockOptions.append(row);
  });
}

function renderMockOrder(current) {
  mockOptions.replaceChildren();
  mockOrder.forEach((alternativeIndex, position) => {
    const row = document.createElement("div");
    row.className = "mock-option mock-order-row";
    row.textContent = `${position + 1}. ${current.alternatives[alternativeIndex]}`;
    const up = document.createElement("button");
    up.type = "button";
    up.textContent = "Up";
    up.disabled = position === 0;
    up.addEventListener("click", () => moveMockOrder(position, -1));
    const down = document.createElement("button");
    down.type = "button";
    down.textContent = "Down";
    down.disabled = position === mockOrder.length - 1;
    down.addEventListener("click", () => moveMockOrder(position, 1));
    row.append(up, down);
    mockOptions.append(row);
  });
}

function moveMockOrder(position, direction) {
  const nextPosition = position + direction;
  if (nextPosition < 0 || nextPosition >= mockOrder.length) return;
  [mockOrder[position], mockOrder[nextPosition]] = [mockOrder[nextPosition], mockOrder[position]];
  renderMockOrder(mockQuestions[mockIndex]);
}

function checkMockAnswer() {
  const current = mockQuestions[mockIndex];
  if (!current) return;
  const selected = [...mockOptions.querySelectorAll("input:checked")].map((input) => Number(input.value));
  let correct;
  if (current.type === "multiple_choice") {
    correct = selected.length === 1 && selected[0] === current.correct_answer;
  } else if (current.type === "multi_select") {
    correct = selected.length === current.correct_answers.length && selected.every((item) => current.correct_answers.includes(item));
  } else if (current.matching) {
    const matches = [...mockOptions.querySelectorAll("select")].map((select) => Number(select.value));
    correct = matches.every((item, index) => item === current.correct_matches[index]);
  } else {
    correct = mockOrder.every((item, index) => item === current.correct_order[index]);
  }
  mockFeedback.textContent = `${correct ? "Correct" : "Not quite"}. ${current.explanation}`;
  mockFeedback.className = `feedback ${correct ? "correct" : "incorrect"}`;
}

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
flashcardsTab.addEventListener("click", () => setStudyTab(false));
mockExamTab.addEventListener("click", () => setStudyTab(true));
document.getElementById("checkMockBtn").addEventListener("click", checkMockAnswer);
document.getElementById("nextMockBtn").addEventListener("click", () => {
  if (!mockQuestions.length) return;
  mockIndex = (mockIndex + 1) % mockQuestions.length;
  renderMockQuestion();
});
document.getElementById("prevMockBtn").addEventListener("click", () => {
  if (!mockQuestions.length) return;
  mockIndex = (mockIndex - 1 + mockQuestions.length) % mockQuestions.length;
  renderMockQuestion();
});

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

fetch("mock_qs.json")
  .then((response) => response.json())
  .then((data) => {
    mockQuestions = Array.isArray(data) ? data : [];
    renderMockQuestion();
  })
  .catch(() => {
    mockMeta.textContent = "Error loading mock questions.";
    mockQuestion.textContent = "Could not load mock_qs.json.";
  });
