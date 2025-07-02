import { useState } from "react";
import api from "../api/axio";
import { useNavigate } from "react-router-dom";

const CreateQuiz = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    description: "",
    topic: "",
    tags: "",
    questions: [
      {
        text: "",
        review: "",
        options: [
          { text: "", isCorrect: true },
          { text: "", isCorrect: false },
        ],
      },
    ],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleQuestionChange = (index: number, field: string, value: string) => {
    const updatedQuestions = [...form.questions];
    (updatedQuestions[index] as any)[field] = value;
    setForm({ ...form, questions: updatedQuestions });
  };

  const handleOptionChange = (qIdx: number, oIdx: number, field: string, value: any) => {
    const updatedQuestions = [...form.questions];
    const updatedOptions:any = [...updatedQuestions[qIdx].options];
    if (field === "isCorrect") {
      updatedOptions.forEach((opt:any, i:number) => (opt.isCorrect = i === oIdx));
    } else {
      updatedOptions[oIdx][field] = value;
    }
    updatedQuestions[qIdx].options = updatedOptions;
    setForm({ ...form, questions: updatedQuestions });
  };

  const addQuestion = () => {
    setForm({
      ...form,
      questions: [
        ...form.questions,
        {
          text: "",
          review: "",
          options: [
            { text: "", isCorrect: true },
            { text: "", isCorrect: false },
          ],
        },
      ],
    });
  };

  const addOption = (qIdx: number) => {
    const updatedQuestions = [...form.questions];
    updatedQuestions[qIdx].options.push({ text: "", isCorrect: false });
    setForm({ ...form, questions: updatedQuestions });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      description: form.description,
      topic: form.topic,
      tags: form.tags.split(",").map((t) => t.trim()),
      questions: form.questions,
    };
    try {
      await api.post("/quiz/create", payload);
      navigate("/admin");
    } catch (err: any) {
      console.error(err?.response?.data?.message || "Failed to create quiz");
    }
  };

  return (
    <section className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-5xl mx-auto bg-white p-8 rounded-md shadow">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">📝 Create a New Quiz</h1>
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Basic Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="text"
              name="name"
              placeholder="Quiz Title"
              value={form.name}
              onChange={handleChange}
              required
              className="border p-2 rounded w-full"
            />
            <input
              type="text"
              name="topic"
              placeholder="Quiz Topic"
              value={form.topic}
              onChange={handleChange}
              required
              className="border p-2 rounded w-full"
            />
          </div>
          <textarea
            name="description"
            placeholder="Quiz Description"
            value={form.description}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
          <input
            type="text"
            name="tags"
            placeholder="Comma separated tags (e.g. react,frontend)"
            value={form.tags}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />

          {/* Questions */}
          {form.questions.map((question, qIdx) => (
            <div key={qIdx} className="border p-4 rounded-md bg-gray-50">
              <h3 className="font-semibold mb-2">Question {qIdx + 1}</h3>
              <input
                type="text"
                placeholder="Question Text"
                value={question.text}
                onChange={(e) => handleQuestionChange(qIdx, "text", e.target.value)}
                className="border p-2 rounded w-full mb-2"
                required
              />
              <input
                type="text"
                placeholder="Review (optional)"
                value={question.review}
                onChange={(e) => handleQuestionChange(qIdx, "review", e.target.value)}
                className="border p-2 rounded w-full mb-4"
              />

              <div className="space-y-3">
                {question.options.map((option, oIdx) => (
                  <div key={oIdx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${qIdx}`}
                      checked={option.isCorrect}
                      onChange={() => handleOptionChange(qIdx, oIdx, "isCorrect", true)}
                    />
                    <input
                      type="text"
                      placeholder={`Option ${oIdx + 1}`}
                      value={option.text}
                      onChange={(e) =>
                        handleOptionChange(qIdx, oIdx, "text", e.target.value)
                      }
                      className="border p-2 rounded w-full"
                      required
                    />
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => addOption(qIdx)}
                className="mt-3 text-sm text-blue-600 hover:underline"
              >
                ➕ Add Option
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addQuestion}
            className="text-sm text-blue-600 hover:underline"
          >
            ➕ Add Another Question
          </button>

          <div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Create Quiz
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default CreateQuiz;
