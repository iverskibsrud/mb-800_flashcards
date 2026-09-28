import json
import tkinter as tk
from pathlib import Path
from tkinter import messagebox, ttk


cards_file = Path(__file__).with_name("cards.json")
mock_questions_file = Path(__file__).with_name("mock_qs.json")


question_types = {
	"multiple_choice": "Multiple choice",
	"multi_select": "Multi-select",
	"drag_and_drop": "Drag and drop",
	"sequence": "Sequence / order",
}


def load_json(path, fallback):
	try:
		return json.loads(path.read_text(encoding="utf-8"))
	except (OSError, json.JSONDecodeError):
		return fallback
cards = {
	card["question"]: card["answer"]
	for card in json.loads(cards_file.read_text(encoding="utf-8"))
}


class FlashcardApp:
	def __init__(self, root):
		self.root = root
		self.flashcards = list(cards.items())
		self.card_index = 0
		self.showing_answer = False
		self.question_color = "#ffffff"
		self.answer_color = "#dff3df"
		self.animation_token = 0
		self.adding_card = False
		self.mock_questions = load_json(mock_questions_file, [])
		self.mock_index = 0
		self.mock_answer_widgets = []

		root.title("MB-800 Study Tool")
		root.geometry("760x560")
		root.minsize(500, 360)

		self.tabs = ttk.Notebook(root)
		self.tabs.pack(expand=True, fill="both")
		self.flashcard_tab = tk.Frame(self.tabs, bg=self.question_color)
		self.mock_tab = tk.Frame(self.tabs, bg="#f6f8fb")
		self.tabs.add(self.flashcard_tab, text="Flashcards")
		self.tabs.add(self.mock_tab, text="MB-800 Mock Exam")

		self.toolbar = tk.Frame(self.flashcard_tab, bg=self.question_color)
		self.toolbar.pack(fill="x")
		self.add_button = tk.Button(
			self.toolbar,
			text="+",
			font=("Arial", 16, "bold"),
			width=3,
			command=self.show_add_form,
		)
		self.add_button.pack(side="right", padx=8, pady=6)

		self.card_area = tk.Frame(self.flashcard_tab, bg=self.question_color)
		self.card_area.pack(expand=True, fill="both")

		self.card_text = tk.Label(
			self.card_area,
			text="",
			font=("Arial", 24), 
			wraplength=620,
			justify="center",
			padx=30,
			pady=30,
			bg=self.question_color,
		)
		self.card_text.place(relx=0.5, rely=0.5, anchor="center")

		self.instructions = tk.Label(
			self.flashcard_tab,
			text="Space: flip  |  Left/Right: change card  |  Esc: exit  |  a: add card",
			font=("Arial", 11),
			pady=12,
			bg=self.question_color,
		)
		self.instructions.pack()
		self.build_mock_exam_view()

		root.bind("<space>", self.flip_card)
		root.bind("<Right>", self.next_card)
		root.bind("<Left>", self.previous_card)
		root.bind("<Return>", self.handle_return)
		root.bind("<a>", self.handle_add_shortcut)
		root.bind("<r>", self.handle_reader_shortcut)
		root.bind("<Escape>", self.handle_escape)
		root.focus_set()

		self.update_card()
		self.render_mock_question()

	def build_mock_exam_view(self):
		header = tk.Frame(self.mock_tab, bg="#f6f8fb")
		header.pack(fill="x", padx=28, pady=(22, 8))
		tk.Label(header, text="MB-800 Mock Exam", font=("Arial", 20, "bold")).pack(side="left")
		tk.Button(header, text="Add question", command=self.show_mock_question_form).pack(side="right")
		self.mock_meta = tk.Label(self.mock_tab, text="", bg="#f6f8fb", fg="#52606d")
		self.mock_meta.pack(anchor="w", padx=28)
		self.mock_question = tk.Label(
			self.mock_tab, text="", font=("Arial", 16, "bold"), wraplength=690,
			justify="left", anchor="w", bg="#ffffff", padx=22, pady=20,
		)
		self.mock_question.pack(fill="x", padx=28, pady=(12, 10))
		self.mock_answers = tk.Frame(self.mock_tab, bg="#f6f8fb")
		self.mock_answers.pack(fill="both", expand=True, padx=28)
		self.mock_feedback = tk.Label(self.mock_tab, text="", wraplength=690, justify="left", anchor="w", bg="#f6f8fb")
		self.mock_feedback.pack(fill="x", padx=28, pady=8)
		controls = tk.Frame(self.mock_tab, bg="#f6f8fb")
		controls.pack(fill="x", padx=28, pady=(4, 20))
		tk.Button(controls, text="Check answer", command=self.check_mock_answer).pack(side="left")
		tk.Button(controls, text="Previous", command=self.previous_mock_question).pack(side="right", padx=(8, 0))
		tk.Button(controls, text="Next", command=self.next_mock_question).pack(side="right")

	def render_mock_question(self):
		for widget in self.mock_answers.winfo_children():
			widget.destroy()
		self.mock_answer_widgets = []
		if not self.mock_questions:
			self.mock_question.config(text="No mock questions found.")
			self.mock_meta.config(text="Add a question to mock_qs.json from the form.")
			return
		question = self.mock_questions[self.mock_index]
		question_type = question.get("type", "multiple_choice")
		self.mock_meta.config(
			text=f"Question {self.mock_index + 1} of {len(self.mock_questions)}  |  "
			f"{question.get('topic', 'General')}  |  {question_types.get(question_type, question_type)}"
		)
		self.mock_question.config(text=question.get("question", ""))
		alternatives = question.get("alternatives", [])
		if question_type == "multiple_choice":
			self.mock_answer_widgets = [tk.IntVar(value=-1)]
			for number, alternative in enumerate(alternatives):
				tk.Radiobutton(self.mock_answers, text=alternative, variable=self.mock_answer_widgets[0], value=number).pack(anchor="w", pady=3)
		elif question_type == "multi_select":
			self.mock_answer_widgets = [tk.BooleanVar(value=False) for _ in alternatives]
			for number, alternative in enumerate(alternatives):
				tk.Checkbutton(self.mock_answers, text=alternative, variable=self.mock_answer_widgets[number]).pack(anchor="w", pady=3)
		else:
			listbox = tk.Listbox(self.mock_answers, height=max(3, len(alternatives)), exportselection=False)
			for alternative in alternatives:
				listbox.insert(tk.END, alternative)
			listbox.pack(side="left", fill="both", expand=True)
			self.mock_answer_widgets = [listbox]
			buttons = tk.Frame(self.mock_answers, bg="#f6f8fb")
			buttons.pack(side="left", padx=10)
			tk.Button(buttons, text="Move up", command=lambda: self.move_mock_item(-1)).pack(pady=3)
			tk.Button(buttons, text="Move down", command=lambda: self.move_mock_item(1)).pack(pady=3)
		self.mock_feedback.config(text="")

	def move_mock_item(self, direction):
		listbox = self.mock_answer_widgets[0]
		selection = listbox.curselection()
		if not selection:
			return
		old_index = selection[0]
		new_index = old_index + direction
		if not 0 <= new_index < listbox.size():
			return
		value = listbox.get(old_index)
		listbox.delete(old_index)
		listbox.insert(new_index, value)
		listbox.selection_set(new_index)

	def check_mock_answer(self):
		question = self.mock_questions[self.mock_index]
		question_type = question.get("type")
		if question_type == "multiple_choice":
			answer = self.mock_answer_widgets[0].get()
			correct = answer == question.get("correct_answer", -1)
		elif question_type == "multi_select":
			answer = [index for index, variable in enumerate(self.mock_answer_widgets) if variable.get()]
			correct = set(answer) == set(question.get("correct_answers", []))
		else:
			answer = list(self.mock_answer_widgets[0].get(0, tk.END))
			correct_items = [question.get("alternatives", [])[index] for index in question.get("correct_order", [])]
			correct = answer == correct_items
		result = "Correct" if correct else "Not quite"
		self.mock_feedback.config(text=f"{result}. {question.get('explanation', '')}", fg="#176b35" if correct else "#9b2c2c")

	def next_mock_question(self):
		if self.mock_questions:
			self.mock_index = (self.mock_index + 1) % len(self.mock_questions)
			self.render_mock_question()

	def previous_mock_question(self):
		if self.mock_questions:
			self.mock_index = (self.mock_index - 1) % len(self.mock_questions)
			self.render_mock_question()

	def show_mock_question_form(self):
		form = tk.Toplevel(self.root)
		form.title("Add mock exam question")
		form.geometry("620x650")
		form.transient(self.root)
		form.grab_set()
		body = tk.Frame(form, padx=24, pady=18)
		body.pack(expand=True, fill="both")
		entries = {}
		for label, key in (("Topic", "topic"), ("Question", "question"), ("Explanation", "explanation")):
			tk.Label(body, text=label).pack(anchor="w", pady=(8, 2))
			entry = tk.Entry(body)
			entry.pack(fill="x")
			entries[key] = entry
		tk.Label(body, text="Question type").pack(anchor="w", pady=(8, 2))
		type_var = tk.StringVar(value="multiple_choice")
		ttk.Combobox(body, textvariable=type_var, values=list(question_types), state="readonly").pack(fill="x")
		tk.Label(body, text="Alternatives (one per line)").pack(anchor="w", pady=(8, 2))
		alternatives = tk.Text(body, height=7)
		alternatives.pack(fill="both", expand=True)
		tk.Label(body, text="Correct indexes, starting at 0 (for example: 0 or 0,2 or 2,0,1)").pack(anchor="w", pady=(8, 2))
		correct = tk.Entry(body)
		correct.pack(fill="x")

		def save_question():
			items = [item.strip() for item in alternatives.get("1.0", tk.END).splitlines() if item.strip()]
			try:
				indexes = [int(item.strip()) for item in correct.get().split(",") if item.strip()]
			except ValueError:
				messagebox.showerror("Invalid answer", "Use comma-separated numbers such as 0 or 0,2.", parent=form)
				return
			if not entries["topic"].get().strip() or not entries["question"].get().strip() or not items:
				messagebox.showerror("Missing information", "Topic, question, and alternatives are required.", parent=form)
				return
			if any(index < 0 or index >= len(items) for index in indexes):
				messagebox.showerror("Invalid answer", "Every answer index must refer to an alternative.", parent=form)
				return
			question_type = type_var.get()
			question = {
				"type": question_type,
				"topic": entries["topic"].get().strip(),
				"question": entries["question"].get().strip(),
				"alternatives": items,
				"explanation": entries["explanation"].get().strip(),
			}
			if question_type == "multiple_choice":
				if len(indexes) != 1:
					messagebox.showerror("Invalid answer", "Multiple choice needs exactly one correct index.", parent=form)
					return
				question["correct_answer"] = indexes[0]
			elif question_type == "multi_select":
				question["correct_answers"] = indexes
			else:
				question["correct_order"] = indexes
			self.mock_questions.append(question)
			try:
				mock_questions_file.write_text(json.dumps(self.mock_questions, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
			except OSError as error:
				messagebox.showerror("Could not save question", str(error), parent=form)
				return
			self.mock_index = len(self.mock_questions) - 1
			form.destroy()
			self.render_mock_question()

		tk.Button(body, text="Save question", command=save_question).pack(pady=(14, 0))

	def update_card(self):
		question, answer = self.flashcards[self.card_index]
		background = self.answer_color if self.showing_answer else self.question_color
		self.card_text.config(
			text=answer if self.showing_answer else question,
			bg=background,
		)
		self.card_area.config(bg=background)
		self.instructions.config(bg=background)
		self.toolbar.config(bg=background)

	def show_add_form(self):
		if self.adding_card:
			return
		self.adding_card = True
		self.animation_token += 1
		self.card_area.pack_forget()
		self.instructions.pack_forget()
		self.add_button.config(state="disabled")

		self.add_form = tk.Frame(self.root, padx=40, pady=25)
		self.add_form.pack(expand=True, fill="both")
		tk.Label(self.add_form, text="Add a flashcard", font=("Arial", 22, "bold")).pack(pady=(0, 20))
		tk.Label(self.add_form, text="Question", anchor="w").pack(fill="x")
		self.question_entry = tk.Entry(self.add_form, font=("Arial", 14))
		self.question_entry.pack(fill="x", pady=(4, 14))
		tk.Label(self.add_form, text="Answer", anchor="w").pack(fill="x")
		self.answer_entry = tk.Entry(self.add_form, font=("Arial", 14))
		self.answer_entry.pack(fill="x", pady=(4, 20))
		tk.Button(
			self.add_form,
			text="Add card",
			font=("Arial", 11),
			command=self.add_card,
		).pack()
		tk.Label(self.add_form, text="Press Esc to return to testing", fg="#666666").pack(pady=14)
		self.question_entry.focus_set()

	def add_card(self):
		question = self.question_entry.get().strip()
		answer = self.answer_entry.get().strip()
		if not question or not answer:
			return
		cards[question] = answer
		try:
			self.save_cards()
		except OSError as error:
			messagebox.showerror("Could not save card", str(error))
			return
		self.flashcards = list(cards.items())
		self.card_index = len(self.flashcards) - 1
		self.showing_answer = False
		self.question_entry.delete(0, tk.END)
		self.answer_entry.delete(0, tk.END)
		self.question_entry.focus_set()

	def save_cards(self):
		json_file = Path(__file__).with_name("cards.json")
		json_file.write_text(
			json.dumps(
				[{"question": question, "answer": answer} for question, answer in cards.items()],
				ensure_ascii=False,
				indent=2,
			)
			+ "\n",
			encoding="utf-8",
		)

	def show_testing_view(self):
		if not self.adding_card:
			return
		self.adding_card = False
		self.add_form.destroy()
		self.add_button.config(state="normal")
		self.card_area.pack(expand=True, fill="both")
		self.instructions.pack(fill="x")
		self.update_card()
		self.root.focus_set()

	def handle_return(self, event=None):
		if self.adding_card:
			self.add_card()

	def handle_add_shortcut(self, event=None):
		if not self.adding_card or not isinstance(event.widget, tk.Entry):
			self.show_add_form()

	def handle_reader_shortcut(self, event=None):
		if self.adding_card and not isinstance(event.widget, tk.Entry):
			self.show_testing_view()

	def handle_escape(self, event=None):
		if self.adding_card:
			self.show_testing_view()
		else:
			self.root.destroy()

	def animate_color(self, start, end, token, step=0, steps=8):
		if token != self.animation_token:
			return
		start_rgb = tuple(int(start[index:index + 2], 16) for index in (1, 3, 5))
		end_rgb = tuple(int(end[index:index + 2], 16) for index in (1, 3, 5))
		progress = step / steps
		color = "#" + "".join(
			f"{round(start_value + (end_value - start_value) * progress):02x}"
			for start_value, end_value in zip(start_rgb, end_rgb)
		)
		self.card_area.config(bg=color)
		self.card_text.config(bg=color)
		self.instructions.config(bg=color)
		if step < steps:
			self.root.after(25, self.animate_color, start, end, token, step + 1, steps)

	def animate_navigation(self, direction, token, step=0, steps=12):
		if token != self.animation_token:
			return
		halfway = steps // 2
		distance = 45
		if step < halfway:
			offset = round(-direction * distance * step / halfway)
		else:
			if step == halfway:
				self.update_card()
				offset = direction * distance
			else:
				offset = round(direction * distance * (steps - step) / halfway)
		self.card_text.place_configure(relx=0.5, x=offset)
		if step < steps:
			self.root.after(20, self.animate_navigation, direction, token, step + 1, steps)
		else:
			self.card_text.place_configure(relx=0.5, x=0)

	def flip_card(self, event=None):
		if self.adding_card:
			return
		self.animation_token += 1
		old_color = self.answer_color if self.showing_answer else self.question_color
		self.showing_answer = not self.showing_answer
		self.update_card()
		new_color = self.answer_color if self.showing_answer else self.question_color
		self.animate_color(old_color, new_color, self.animation_token)

	def next_card(self, event=None):
		if self.adding_card:
			return
		self.animation_token += 1
		self.card_index = (self.card_index + 1) % len(self.flashcards)
		self.showing_answer = False
		self.animate_navigation(1, self.animation_token)

	def previous_card(self, event=None):
		if self.adding_card:
			return
		self.animation_token += 1
		self.card_index = (self.card_index - 1) % len(self.flashcards)
		self.showing_answer = False
		self.animate_navigation(-1, self.animation_token)


if __name__ == "__main__":
	root = tk.Tk()
	FlashcardApp(root)
	root.mainloop()