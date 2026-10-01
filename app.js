let allCards = [];
let cards = [];
let index = 0;
let showingAnswer = false;
const storageKey = "mb800_flashcards_cards";
const studyStateKey = "mb800_flashcards_state";

const card = document.getElementById("card");
const cardLabel = document.getElementById("cardLabel");
const cardContent = document.getElementById("cardContent");
const meta = document.getElementById("meta");
const flashcardsPanel = document.getElementById("flashcardsPanel");
const termSearchPanel = document.getElementById("termSearchPanel");
const mockExamPanel = document.getElementById("mockExamPanel");
const flashcardsTab = document.getElementById("flashcardsTab");
const termSearchTab = document.getElementById("termSearchTab");
const mockExamTab = document.getElementById("mockExamTab");
const pageTitle = document.getElementById("pageTitle");
const pageSubtitle = document.getElementById("pageSubtitle");
const termSearchInput = document.getElementById("termSearchInput");
const termSearchResults = document.getElementById("termSearchResults");
const termSearchMeta = document.getElementById("termSearchMeta");
const mockMeta = document.getElementById("mockMeta");
const mockQuestion = document.getElementById("mockQuestion");
const mockOptions = document.getElementById("mockOptions");
const mockFeedback = document.getElementById("mockFeedback");
const explanationBtn = document.getElementById("explanationBtn");
const explanationDialog = document.getElementById("explanationDialog");
const explanationContent = document.getElementById("explanationContent");
const caseStudyBtn = document.getElementById("caseStudyBtn");
const caseStudyDialog = document.getElementById("caseStudyDialog");
const caseStudyContent = document.getElementById("caseStudyContent");
const keyboardHelpDialog = document.getElementById("keyboardHelpDialog");
const testModeBtn = document.getElementById("testModeBtn");
const testProgress = document.getElementById("testProgress");
const testSetupDialog = document.getElementById("testSetupDialog");
const testSetupForm = document.getElementById("testSetupForm");
const testQuestionCount = document.getElementById("testQuestionCount");
const testResultDialog = document.getElementById("testResultDialog");
const testResultContent = document.getElementById("testResultContent");
let mockQuestions = [];
let mockIndex = 0;
let mockOrder = [];
let mockDragValue = null;
let testMode = false;
let testTarget = 0;
let testAnswered = 0;
let testCorrect = 0;
let testQuestionOrder = [];
let testQuestionAnswered = false;
let testResults = [];

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[character]));
}

function formatDisplayMarkup(value) {
  const rawText = String(value ?? "");
  const lines = rawText.replace(/\r\n/g, "\n").split("\n");
  const parts = [];
  const bulletItems = [];
  const paragraphLines = [];

  const flushParagraph = () => {
    if (!paragraphLines.length) return;
    parts.push(`<p>${escapeHtml(paragraphLines.join("\n")).replace(/\n/g, "<br>")}</p>`);
    paragraphLines.length = 0;
  };

  const flushList = () => {
    if (!bulletItems.length) return;
    parts.push(`<ul>${bulletItems.map((item) => `<li>${escapeHtml(item).replace(/\n/g, "<br>")}</li>`).join("")}</ul>`);
    bulletItems.length = 0;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    const bulletMatch = trimmed.match(/^[-*•]\s+(.*)$/) || trimmed.match(/^\d+[.)]\s+(.*)$/);
    if (bulletMatch) {
      flushParagraph();
      bulletItems.push(bulletMatch[1].trim());
      continue;
    }

    if (bulletItems.length) {
      flushList();
    }

    paragraphLines.push(trimmed);
  }

  flushParagraph();
  flushList();

  return parts.join("") || "";
}

function saveStudyState() {
  const state = {
    flashcardIndex: index,
    showingAnswer,
    mockIndex,
    activeTab: flashcardsPanel.hidden && mockExamPanel.hidden ? "termSearch" : flashcardsTab.classList.contains("active") ? "flashcards" : mockExamTab.classList.contains("active") ? "mockExam" : "termSearch",
  };
  localStorage.setItem(studyStateKey, JSON.stringify(state));
}

function loadStudyState() {
  try {
    const raw = localStorage.getItem(studyStateKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function setStudyTab(tabNameOrShowMock) {
  const tabName = typeof tabNameOrShowMock === "string"
    ? tabNameOrShowMock
    : tabNameOrShowMock ? "mockExam" : "flashcards";

  flashcardsPanel.hidden = tabName !== "flashcards";
  termSearchPanel.hidden = tabName !== "termSearch";
  mockExamPanel.hidden = tabName !== "mockExam";

  flashcardsTab.classList.toggle("active", tabName === "flashcards");
  termSearchTab.classList.toggle("active", tabName === "termSearch");
  mockExamTab.classList.toggle("active", tabName === "mockExam");

  flashcardsTab.setAttribute("aria-selected", String(tabName === "flashcards"));
  termSearchTab.setAttribute("aria-selected", String(tabName === "termSearch"));
  mockExamTab.setAttribute("aria-selected", String(tabName === "mockExam"));

  pageTitle.textContent = tabName === "mockExam" ? "MB-800 Test Questions" : tabName === "termSearch" ? "MB-800 Term Searcher" : "MB-800 Flashcards";
  pageSubtitle.textContent = tabName === "mockExam" ? "Practice questions and answers" : tabName === "termSearch" ? "Search flashcards by keyword" : "Flashcards for review";

  saveStudyState();
}

function renderMockQuestion() {
  const current = mockQuestions[mockIndex];
  mockOptions.replaceChildren();
  document.querySelector(".mock-context-table")?.remove();
  mockFeedback.textContent = "";
  mockFeedback.className = "feedback";
  explanationBtn.hidden = true;
  explanationContent.textContent = "";
  caseStudyBtn.hidden = !current?.case_study;
  caseStudyContent.textContent = "";
  if (caseStudyDialog.open) caseStudyDialog.close();
  if (explanationDialog.open) explanationDialog.close();
  if (!current) {
    mockMeta.textContent = "No mock questions found.";
    mockQuestion.textContent = "Add questions to mock_qs.json to begin.";
    return;
  }
  setMockInputsDisabled(false);
  testQuestionAnswered = false;
  testProgress.hidden = !testMode;
  testProgress.textContent = testMode ? `${testAnswered}/${testTarget} answered` : "";
  document.getElementById("checkMockBtn").textContent = testMode ? "Submit answer" : "Check answer";
  document.getElementById("checkMockBtn").disabled = false;
  document.getElementById("prevMockBtn").disabled = testMode;
  document.getElementById("nextMockBtn").disabled = testMode;
  mockMeta.textContent = `Question ${mockIndex + 1} of ${mockQuestions.length} · ${current.topic} · ${current.type}`;
  const contextMarker = "{{context_table}}";
  const questionText = current.question.replace(" Solution:", "\n\nSolution:");
  if (current.context_table && questionText.includes(contextMarker)) {
    const [beforeContext, afterContext] = questionText.split(contextMarker);
    mockQuestion.innerHTML = formatDisplayMarkup(beforeContext);
    mockQuestion.append(createMockContextTable(current.context_table));
    mockQuestion.insertAdjacentHTML("beforeend", formatDisplayMarkup(afterContext));
  } else {
    mockQuestion.innerHTML = formatDisplayMarkup(questionText);
  }
  if (current.case_study) {
    caseStudyContent.innerHTML = formatDisplayMarkup(current.case_study);
  }
  saveStudyState();
  if (current.context_table && !questionText.includes(contextMarker)) renderMockContextTable(current.context_table);
  mockOrder = (current.alternatives ?? []).map((_, index) => index);
  if (current.matching) {
    renderMockMatching(current);
    return;
  }
  if (current.type === "hotspot") {
    renderMockHotspot(current);
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
    input.addEventListener("change", clearAnswerState);
    label.append(input, document.createTextNode(alternative));
    mockOptions.append(label);
  });
}

function renderMockHotspot(current) {
  const hotspot = document.createElement("div");
  hotspot.className = "mock-hotspot";
  current.fields.forEach((field, index) => {
    const label = document.createElement("label");
    label.className = "mock-hotspot-field";
    label.append(document.createTextNode(field.label));
    const select = document.createElement("select");
    select.className = "mock-hotspot-select";
    select.dataset.hotspotIndex = index;
    select.addEventListener("change", clearAnswerState);
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select an answer";
    placeholder.disabled = true;
    placeholder.selected = true;
    select.append(placeholder);
    field.options.forEach((option, optionIndex) => {
      const choice = document.createElement("option");
      choice.value = optionIndex;
      choice.textContent = option;
      select.append(choice);
    });
    label.append(select);
    hotspot.append(label);
  });
  mockOptions.append(hotspot);
}

function clearAnswerState() {
  mockOptions.querySelectorAll(".is-correct, .is-incorrect").forEach((element) => {
    element.classList.remove("is-correct", "is-incorrect");
  });
  mockFeedback.textContent = "";
  mockFeedback.className = "feedback";
  explanationBtn.hidden = true;
  explanationContent.textContent = "";
}

function createMockContextTable(tableData) {
  const table = document.createElement("table");
  table.className = "mock-context-table";
  const head = document.createElement("thead");
  const headerRow = document.createElement("tr");
  tableData.headers.forEach((header) => {
    const cell = document.createElement("th");
    cell.scope = "col";
    cell.textContent = header;
    headerRow.append(cell);
  });
  head.append(headerRow);
  const body = document.createElement("tbody");
  tableData.rows.forEach((row) => {
    const tableRow = document.createElement("tr");
    row.forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      tableRow.append(cell);
    });
    body.append(tableRow);
  });
  table.append(head, body);
  return table;
}

function renderMockContextTable(tableData) {
  mockQuestion.after(createMockContextTable(tableData));
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
  source.innerHTML = "<strong>Action</strong><span class=\"mock-dnd-hint\">Drag an action into an answer space.</span>";
  answer.innerHTML = "<strong>Answer</strong><span class=\"mock-dnd-hint\">Place each action in the correct numbered space.</span>";
  source.dataset.dnd = "source";
  answer.dataset.dnd = "answer";
  answer.addEventListener("dragover", (event) => event.preventDefault());
  current.alternatives.forEach((alternative, index) => {
    const item = document.createElement("div");
    item.className = "mock-option";
    item.draggable = true;
    item.dataset.dndItem = index;
    item.textContent = alternative;
    item.addEventListener("dragstart", () => { mockDragValue = index; });
    source.append(item);
  });
  source.addEventListener("dragover", (event) => event.preventDefault());
  source.addEventListener("drop", (event) => {
    event.preventDefault();
    if (mockDragValue === null) return;
    const item = mockOptions.querySelector(`[data-dnd-item='${mockDragValue}']`);
    if (item && item.parentElement !== source) {
      source.append(item);
      animateMoved(item);
    }
  });
  current.alternatives.forEach((_, slotIndex) => {
    const slot = document.createElement("div");
    slot.className = "mock-answer-slot";
    slot.dataset.slotIndex = slotIndex;
    slot.innerHTML = `<span class="mock-slot-number">${slotIndex + 1}</span><span class="mock-slot-placeholder">Drop an action here</span>`;
    slot.addEventListener("dragover", (event) => {
      event.preventDefault();
      slot.classList.add("is-drop-target");
    });
    slot.addEventListener("dragleave", () => slot.classList.remove("is-drop-target"));
    slot.addEventListener("drop", (event) => {
      event.preventDefault();
      slot.classList.remove("is-drop-target");
      if (mockDragValue === null) return;
      const item = mockOptions.querySelector(`[data-dnd-item='${mockDragValue}']`);
      if (!item) return;
      const displacedItem = slot.querySelector("[data-dnd-item]");
      if (displacedItem && displacedItem !== item) source.append(displacedItem);
      item.remove();
      slot.querySelector(".mock-slot-placeholder")?.remove();
      slot.append(item);
      mockOrder = [...answer.querySelectorAll("[data-dnd-item]")].map((entry) => Number(entry.dataset.dndItem));
      animateMoved(item);
    });
    answer.append(slot);
  });
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

function getMockAnswerCorrect(current) {
  const selected = [...mockOptions.querySelectorAll("input:checked")].map((input) => Number(input.value));
  if (current.type === "multiple_choice") {
    return selected.length === 1 && selected[0] === current.correct_answer;
  }
  if (current.type === "multi_select") {
    return selected.length === current.correct_answers.length && selected.every((item) => current.correct_answers.includes(item));
  }
  if (current.matching) {
    const matches = [...mockOptions.querySelectorAll("[data-target-index]")].map((row) => Number(row.dataset.answer));
    return matches.length === current.correct_matches.length && matches.every((item, index) => item === current.correct_matches[index]);
  }
  if (current.type === "hotspot") {
    const answers = [...mockOptions.querySelectorAll("[data-hotspot-index]")].map((select) => select.value === "" ? null : Number(select.value));
    return answers.length === current.fields.length && answers.every((item, index) => item === current.fields[index].correct_answer);
  }
  const order = [...mockOptions.querySelectorAll("[data-dnd='answer'] [data-dnd-item]")].map((item) => Number(item.dataset.dndItem));
  return order.length === current.correct_order.length && order.every((item, index) => item === current.correct_order[index]);
}

function setMockInputsDisabled(disabled) {
  mockOptions.querySelectorAll("input, select").forEach((input) => {
    input.disabled = disabled;
  });
  mockOptions.classList.toggle("test-answer-recorded", disabled);
}

function finishTestMode() {
  const percentage = Math.round((testCorrect / testTarget) * 100);
  const passed = percentage >= 70;
  const topicStats = Object.values(testResults.reduce((stats, result) => {
    const topic = result.topic || "Uncategorized";
    stats[topic] ??= { topic, correct: 0, total: 0 };
    stats[topic].total += 1;
    stats[topic].correct += result.correct ? 1 : 0;
    return stats;
  }, {})).sort((left, right) => (left.correct / left.total) - (right.correct / right.total));
  const reviewTopics = topicStats.filter((item) => item.correct < item.total).slice(0, 3);
  const topicMarkup = topicStats.length
    ? `<ul>${topicStats.map((item) => `<li>${escapeHtml(item.topic)}: ${item.correct}/${item.total} correct (${Math.round((item.correct / item.total) * 100)}%)</li>`).join("")}</ul>`
    : "<p>No topic statistics available.</p>";
  const reviewMarkup = reviewTopics.length
    ? `<p><strong>Prioritize these topics:</strong> ${reviewTopics.map((item) => escapeHtml(item.topic)).join(", ")}</p>`
    : "<p>Excellent coverage: no topic needs extra review based on this test.</p>";
  testResultContent.innerHTML = `
    <p><strong>${testCorrect}/${testTarget} correct (${percentage}%).</strong> ${passed ? "You passed." : "You did not pass."}</p>
    <p>${testTarget - testCorrect} question${testTarget - testCorrect === 1 ? "" : "s"} to review.</p>
    <h3>Performance by topic</h3>
    ${topicMarkup}
    ${reviewMarkup}
  `;
  testResultDialog.showModal();
}

function startTestMode() {
  if (!mockQuestions.length) return;
  testTarget = Math.min(Math.max(Number(testQuestionCount.value) || 1, 1), mockQuestions.length);
  testQuestionCount.value = testTarget;
  testAnswered = 0;
  testCorrect = 0;
  testResults = [];
  testQuestionOrder = Array.from({ length: testTarget }, (_, position) => (mockIndex + position) % mockQuestions.length);
  mockIndex = testQuestionOrder[0];
  testMode = true;
  setStudyTab("mockExam");
  renderMockQuestion();
}

function checkMockAnswer() {
  const current = mockQuestions[mockIndex];
  if (!current) return;
  const correct = getMockAnswerCorrect(current);
  if (testMode) {
    if (testQuestionAnswered) return;
    testQuestionAnswered = true;
    testAnswered += 1;
    testCorrect += correct ? 1 : 0;
    testResults.push({ topic: current.topic, correct });
    testProgress.textContent = `${testAnswered}/${testTarget} answered`;
    mockFeedback.textContent = "Answer recorded.";
    mockFeedback.className = "feedback recorded";
    setMockInputsDisabled(true);
    document.getElementById("checkMockBtn").disabled = true;
    document.getElementById("nextMockBtn").disabled = testAnswered === testTarget;
    if (testAnswered === testTarget) finishTestMode();
    return;
  }
  if (current.type === "multi_select") {
    mockOptions.querySelectorAll(".mock-option").forEach((option, index) => {
      option.classList.toggle("is-correct", current.correct_answers.includes(index));
      option.classList.toggle("is-incorrect", !current.correct_answers.includes(index));
    });
  }
  if (current.type === "hotspot") {
    mockOptions.querySelectorAll("[data-hotspot-index]").forEach((select, index) => {
      const isCorrect = Number(select.value) === current.fields[index].correct_answer;
      select.classList.toggle("is-correct", isCorrect);
      select.classList.toggle("is-incorrect", !isCorrect);
    });
  }
  mockFeedback.textContent = `${correct ? "Correct" : "Not quite"}.`;
  mockFeedback.className = `feedback ${correct ? "correct" : "incorrect"}`;
  explanationContent.innerHTML = formatDisplayMarkup(current.explanation);
  explanationBtn.hidden = false;
}

function renderTermSearchResults() {
  const query = termSearchInput.value.trim();
  termSearchMeta.textContent = query ? `Showing matches for "${query}"` : "Type a word to find matching flashcards.";

  if (!query) {
    termSearchResults.innerHTML = '<p class="empty-state">No search has been made yet.</p>';
    return;
  }

  const normalized = query.toLowerCase();
  const matches = cards.filter((card) => {
    const haystack = `${card.question}\n${card.answer}`.toLowerCase();
    return haystack.includes(normalized);
  });

  if (!matches.length) {
    termSearchResults.innerHTML = '<p class="empty-state">No flashcards match that word.</p>';
    return;
  }

  const fragment = document.createDocumentFragment();
  matches.forEach((cardItem) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "term-search-result";
    button.innerHTML = `
      <div>
        <strong>Question</strong>
        <p>${escapeHtml(cardItem.question)}</p>
      </div>
      <div>
        <strong>Answer</strong>
        <p>${escapeHtml(cardItem.answer)}</p>
      </div>
    `;
    button.addEventListener("click", () => {
      const targetIndex = cards.findIndex((candidate) => candidate.question === cardItem.question && candidate.answer === cardItem.answer);
      if (targetIndex >= 0) {
        index = targetIndex;
        showingAnswer = false;
        setStudyTab("flashcards");
        render();
      }
    });
    fragment.append(button);
  });

  termSearchResults.replaceChildren(fragment);
}

function render() {
  const current = cards[index];
  if (!current) {
    cardLabel.textContent = "No cards";
    cardContent.textContent = "No flashcards found.";
    meta.textContent = `${allCards.length} cards available`;
    saveStudyState();
    return;
  }

  card.classList.toggle("answer", showingAnswer);
  cardLabel.textContent = showingAnswer ? "Answer" : "Question";
  cardContent.innerHTML = formatDisplayMarkup(showingAnswer ? current.answer : current.question);
  meta.textContent = `Card ${index + 1} of ${cards.length}`;
  saveStudyState();
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
flashcardsTab.addEventListener("click", () => setStudyTab("flashcards"));
termSearchTab.addEventListener("click", () => setStudyTab("termSearch"));
mockExamTab.addEventListener("click", () => setStudyTab("mockExam"));
termSearchInput.addEventListener("input", renderTermSearchResults);
termSearchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    renderTermSearchResults();
  }
});
document.getElementById("checkMockBtn").addEventListener("click", checkMockAnswer);
explanationBtn.addEventListener("click", () => explanationDialog.showModal());
document.getElementById("closeExplanationBtn").addEventListener("click", () => explanationDialog.close());
caseStudyBtn.addEventListener("click", () => caseStudyDialog.showModal());
document.getElementById("closeCaseStudyBtn").addEventListener("click", () => caseStudyDialog.close());
document.getElementById("keyboardHelpBtn").addEventListener("click", () => keyboardHelpDialog.showModal());
document.getElementById("closeKeyboardHelpBtn").addEventListener("click", () => keyboardHelpDialog.close());
testModeBtn.addEventListener("click", () => {
  testQuestionCount.max = Math.max(mockQuestions.length, 1);
  testSetupDialog.showModal();
});
testSetupForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (event.submitter?.value === "start") {
    testSetupDialog.close();
    startTestMode();
  } else {
    testSetupDialog.close();
  }
});
document.getElementById("closeTestResultBtn").addEventListener("click", () => {
  testResultDialog.close();
  testMode = false;
  renderMockQuestion();
});
document.getElementById("nextMockBtn").addEventListener("click", () => {
  if (!mockQuestions.length) return;
  if (testMode) {
    if (!testQuestionAnswered || testAnswered >= testTarget) return;
    mockIndex = testQuestionOrder[testAnswered];
    renderMockQuestion();
    return;
  }
  mockIndex = (mockIndex + 1) % mockQuestions.length;
  renderMockQuestion();
});
document.getElementById("prevMockBtn").addEventListener("click", () => {
  if (!mockQuestions.length) return;
  mockIndex = (mockIndex - 1 + mockQuestions.length) % mockQuestions.length;
  renderMockQuestion();
});

window.addEventListener("keydown", (event) => {
  const targetTag = event.target && event.target.tagName ? event.target.tagName : "";
  const isTypingTarget = ["INPUT", "TEXTAREA", "SELECT"].includes(targetTag);
  if (isTypingTarget && event.code === "Space") return;

  if (event.key.toLowerCase() === "t" && !isTypingTarget && !event.altKey && !event.ctrlKey && !event.metaKey) {
    const tabButtons = [flashcardsTab, termSearchTab, mockExamTab];
    const currentIndex = tabButtons.findIndex((button) => button.classList.contains("active"));
    tabButtons[(currentIndex + 1) % tabButtons.length].click();
    return;
  }

  if (!mockExamPanel.hidden) {
    if (event.key.toLowerCase() === "e" && !explanationBtn.hidden) {
      event.preventDefault();
      explanationDialog.showModal();
      return;
    }
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
    cards = allCards;
    const state = loadStudyState();
    if (state && Number.isInteger(state.flashcardIndex) && cards.length) {
      index = Math.min(Math.max(state.flashcardIndex, 0), cards.length - 1);
    }
    if (typeof state?.showingAnswer === "boolean") {
      showingAnswer = state.showingAnswer;
    }
    if (state && Number.isInteger(state.mockIndex) && mockQuestions.length) {
      mockIndex = Math.min(Math.max(state.mockIndex, 0), mockQuestions.length - 1);
    }
    setStudyTab(state?.activeTab ?? "flashcards");
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
    const state = loadStudyState();
    if (state && Number.isInteger(state.mockIndex) && mockQuestions.length) {
      mockIndex = Math.min(Math.max(state.mockIndex, 0), mockQuestions.length - 1);
    }
    renderMockQuestion();
    setStudyTab(state?.activeTab ?? "flashcards");
  })
  .catch(() => {
    mockMeta.textContent = "Error loading mock questions.";
    mockQuestion.textContent = "Could not load mock_qs.json.";
  });
