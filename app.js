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
const keyboardHelpDialog = document.getElementById("keyboardHelpDialog");
let mockQuestions = [];
let mockIndex = 0;
let mockOrder = [];
let mockDragValue = null;

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
  const columns = document.createElement("div");
  columns.className = "mock-dnd-columns";
  const source = document.createElement("div");
  const answer = document.createElement("div");
  source.className = "mock-dnd-side";
  answer.className = "mock-dnd-side";
  source.innerHTML = "<strong>Options</strong><span class=\"mock-dnd-hint\">Drag an option to a requirement.</span>";
  answer.innerHTML = "<strong>Answer area</strong><span class=\"mock-dnd-hint\">Drop one option into each row.</span>";
  current.alternatives.forEach((alternative, index) => {
    const item = document.createElement("div");
    item.className = "mock-option";
    item.draggable = true;
    item.dataset.dndItem = index;
    item.textContent = alternative;
    item.addEventListener("dragstart", () => { mockDragValue = index; });
    source.append(item);
  });
  current.targets.forEach((target, targetIndex) => {
    const row = document.createElement("div");
    row.className = "mock-option mock-match-row";
    row.append(document.createTextNode(target));
    row.dataset.targetIndex = targetIndex;
    row.addEventListener("dragover", (event) => event.preventDefault());
    row.addEventListener("drop", () => {
      if (mockDragValue !== null) {
        row.dataset.answer = mockDragValue;
        row.querySelector(".mock-drop-value")?.remove();
        const value = document.createElement("span");
        value.className = "mock-drop-value";
        value.textContent = current.alternatives[mockDragValue];
        row.append(value);
        animateMoved(row);
      }
    });
    answer.append(row);
  });
  columns.append(source, answer);
  mockOptions.append(columns);
}

function renderMockOrder(current) {
  mockOptions.replaceChildren();
  const columns = document.createElement("div");
  columns.className = "mock-dnd-columns";
  const source = document.createElement("div");
  const answer = document.createElement("div");
  source.className = "mock-dnd-side";
  answer.className = "mock-dnd-side";
  source.innerHTML = "<strong>Actions</strong><span class=\"mock-dnd-hint\">Drag actions to the answer area.</span>";
  answer.innerHTML = "<strong>Answer area</strong><span class=\"mock-dnd-hint\">Drop actions here in the correct order.</span>";
  source.dataset.dnd = "source";
  answer.dataset.dnd = "answer";
  answer.addEventListener("dragover", (event) => event.preventDefault());
  const answerHint = answer.querySelector(".mock-dnd-hint");
  const addDropZone = () => {
    const zone = document.createElement("div");
    zone.className = "mock-drop-zone";
    zone.textContent = "Drop here";
    zone.addEventListener("dragover", (event) => {
      event.preventDefault();
      zone.classList.add("is-drop-target");
    });
    zone.addEventListener("dragleave", () => zone.classList.remove("is-drop-target"));
    zone.addEventListener("drop", (event) => {
      event.preventDefault();
      zone.classList.remove("is-drop-target");
      if (mockDragValue === null) return;
      const item = document.querySelector(`[data-dnd-item='${mockDragValue}']`);
      if (item) {
        answer.insertBefore(item, zone.nextSibling);
        animateMoved(item);
      }
    });
    return zone;
  };
  answer.append(answerHint, addDropZone());
  current.alternatives.forEach((alternative, index) => {
    const item = document.createElement("div");
    item.className = "mock-option";
    item.draggable = true;
    item.dataset.dndItem = index;
    item.textContent = alternative;
    item.addEventListener("dragstart", () => { mockDragValue = index; });
    source.append(item);
  });
  answer.replaceChildren(answerHint);
  current.alternatives.forEach(() => answer.append(addDropZone()));
  columns.append(source, answer);
  mockOptions.append(columns);
}

function animateMoved(element) {
  element.classList.remove("is-moving");
  void element.offsetWidth;
  element.classList.add("is-moving");
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
    const matches = [...mockOptions.querySelectorAll("[data-target-index]")].map((row) => Number(row.dataset.answer));
    correct = matches.every((item, index) => item === current.correct_matches[index]);
  } else {
    const order = [...mockOptions.querySelectorAll("[data-dnd='answer'] [data-dnd-item]")].map((item) => Number(item.dataset.dndItem));
    correct = order.length === current.correct_order.length && order.every((item, index) => item === current.correct_order[index]);
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
document.getElementById("keyboardHelpBtn").addEventListener("click", () => keyboardHelpDialog.showModal());
document.getElementById("closeKeyboardHelpBtn").addEventListener("click", () => keyboardHelpDialog.close());
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
  if (!mockExamPanel.hidden) {
    if (event.code === "ArrowRight") {
      event.preventDefault();
      document.getElementById("nextMockBtn").click();
      return;
    }
    if (event.code === "ArrowLeft") {
      event.preventDefault();
      document.getElementById("prevMockBtn").click();
      return;
    }
    if (event.code === "Enter") {
      if (document.activeElement.tagName !== "BUTTON") {
        event.preventDefault();
        checkMockAnswer();
      }
      return;
    }
    if (/^[1-9]$/.test(event.key)) {
      const option = mockOptions.querySelectorAll("input")[Number(event.key) - 1];
      if (option) {
        option.checked = option.type === "radio" ? true : !option.checked;
        option.focus();
      }
      return;
    }
  }
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
