import json
import tkinter as tk
from pathlib import Path
from tkinter import messagebox


cards_file = Path(__file__).with_name("cards.json")
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

		root.title("Flashcards")
		root.geometry("700x400")
		root.minsize(400, 250)

		self.toolbar = tk.Frame(root, bg=self.question_color)
		self.toolbar.pack(fill="x")
		self.add_button = tk.Button(
			self.toolbar,
			text="+",
			font=("Arial", 16, "bold"),
			width=3,
			command=self.show_add_form,
		)
		self.add_button.pack(side="right", padx=8, pady=6)

		self.card_area = tk.Frame(root, bg=self.question_color)
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
			root,
			text="Space: flip  |  Left/Right: change card  |  Esc: exit  |  a: add card",
			font=("Arial", 11),
			pady=12,
			bg=self.question_color,
		)
		self.instructions.pack()

		root.bind("<space>", self.flip_card)
		root.bind("<Right>", self.next_card)
		root.bind("<Left>", self.previous_card)
		root.bind("<Return>", self.handle_return)
		root.bind("<a>", self.handle_add_shortcut)
		root.bind("<r>", self.handle_reader_shortcut)
		root.bind("<Escape>", self.handle_escape)
		root.focus_set()

		self.update_card()

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