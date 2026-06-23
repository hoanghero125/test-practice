# Test Practice PTIT

> Trắc nghiệm PTIT — multi-subject. Currently ships:
> - **Triết học Mác - Lênin** (default) — 506 câu, chia 3 chương
> - **Pháp Luật Đại Cương** — 421 câu

## Tính năng

- Multi-môn: dropdown chọn Triết hoặc PLĐC
- Chế độ: Theo thứ tự / Ngẫu nhiên
- Số câu: 25 / 50 / 100 / Tất cả / **Theo chương** (chỉ Triết)
- Xáo thứ tự câu hỏi / đáp án
- Light/dark mode toggle
- Review chi tiết sau khi làm bài (lọc Đúng/Sai)

## Cấu trúc

```
index.html              # Single-page app, 3 screens (home, quiz, result)
style.css               # All styling, dark/light theme
script.js               # Quiz logic, state, rendering
data/
  index.js              # Aggregator: defines SUBJECTS, SUBJECT_ORDER, DEFAULT_SUBJECT
  pldc.js               # Pháp Luật Đại Cương questions
  triet_hoc.js          # Triết học questions (with chapter field on each)
scripts/
  generate_quiz.py      # PDF → data/<subject>.js (subject object form)
  parse_triet_hoc.py    # Mistral OCR markdown → data/triet_hoc.js
  parse_pdf.py          # older text-only parser
question/
  430_questions.csv     # legacy CSV
  triet_hoc.pdf/        # Mistral OCR output (markdown.md + 113 page files)
```

## Thêm môn mới

1. Drop the source PDF in repo root
2. Run: `python scripts/generate_quiz.py --subject <key> --pdf <file.pdf> --name "Tên môn" --short "Short"`
3. Add `<script src="data/<key>.js"></script>` to `index.html` BEFORE `data/index.js`
4. Add the key to `SUBJECT_ORDER` in `data/index.js`

## Thêm chapter vào môn mới

Nếu môn mới có chia chương, thêm trường `chapter` trên mỗi câu hỏi (vd. `"ch1"`, `"ch2"`) và thêm block `chapters` vào subject object:

```js
window.SUBJECTS_DATA = window.SUBJECTS_DATA || {};
window.SUBJECTS_DATA.my_subject = {
  name: "My Subject",
  short: "MS",
  questions: [
    { num: 1, q: "...", a: "...", b: "...", c: "...", d: "...", ans: "a", chapter: "ch1" },
    ...
  ],
  chapters: {
    "ch1": "Chương 1: Tên chương",
    "ch2": "Chương 2: Tên chương"
  }
};
```

App sẽ tự động hiện nút **"Theo chương"** trong Số câu.

## Cập nhật câu hỏi

Sửa trực tiếp file `data/<subject>.js` (pretty-printed, dễ đọc), hoặc chạy lại generator để tái sinh từ PDF/OCR source.
