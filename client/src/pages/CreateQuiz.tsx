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
  const [aiTopic, setAiTopic] = useState("");
  const [aiCount, setAiCount] = useState(3);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [showAiForm, setShowAiForm] = useState(false);
  const handleAIGenerate = async () => {
    setAiError("");
    setAiLoading(true);

    try {
      const res = await api.post("/quiz/generate", {
        topic: aiTopic,
        numberOfQuestions: aiCount,
      });

      if (!Array.isArray(res.data.generatedQuestions)) {
        throw new Error("Failed to generate questions!");
        return;
      }
      console.log(res.data.generatedQuestions);
      
      const isFirstQuestionEmpty =
  form.questions.length === 1 &&
  form.questions[0].text.trim() === "" &&
  form.questions[0].options.every(opt => opt.text.trim() === "");

setForm((prev) => ({
  ...prev,
  questions: isFirstQuestionEmpty
    ? [...res.data.generatedQuestions]
    : [...prev.questions, ...res.data.generatedQuestions],
}));
    } catch (err: any) {
      console.log(err);
      
      setAiError(err?.response?.data?.message || "AI generation failed");
    } finally {
      setAiLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleQuestionChange = (
    index: number,
    field: string,
    value: string
  ) => {
    const updatedQuestions = [...form.questions];
    (updatedQuestions[index] as any)[field] = value;
    setForm({ ...form, questions: updatedQuestions });
  };

  const handleOptionChange = (
    qIdx: number,
    oIdx: number,
    field: string,
    value: any
  ) => {
    const updatedQuestions = [...form.questions];
    const updatedOptions: any = [...updatedQuestions[qIdx].options];
    if (field === "isCorrect") {
      updatedOptions.forEach(
        (opt: any, i: number) => (opt.isCorrect = i === oIdx)
      );
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
      navigate("/");
    } catch (err: any) {
      console.error(err?.response?.data?.message || "Failed to create quiz");
    }
  };

  return (
    <>
      <section className="min-h-screen h-full bg-gray-50 py-10 px-6">
        <div className="max-w-5xl mx-auto bg-white p-8 rounded-md shadow">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">
            📝 Create a New Quiz
          </h1>
          {/* AI Assist Section */}
          <div
            className={`mb-8 p-4 border rounded-md overflow-hidden transition-all duration-500 ease-in-out ${
              showAiForm ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <h2 className="text-lg font-semibold text-yellow-700 mb-2">
              🤖 Generate Questions with AI
            </h2>
            <div className="flex gap-4 flex-col md:flex-row">
              <input
                type="text"
                placeholder="Enter topic"
                className="border p-2 rounded w-full md:w-1/2"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
              />
              <input
                type="number"
                placeholder="Number of questions"
                className="border p-2 rounded w-full md:w-1/4"
                value={aiCount}
                onChange={(e) => setAiCount(Number(e.target.value))}
              />
              <button
                onClick={handleAIGenerate}
                disabled={aiLoading || !aiTopic || aiCount <= 0}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {aiLoading ? "Generating..." : "AI Assist"}
              </button>
            </div>
            {aiError && <p className="text-red-600 mt-2">{aiError}</p>}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

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
                  onChange={(e) =>
                    handleQuestionChange(qIdx, "text", e.target.value)
                  }
                  className="border p-2 rounded w-full mb-2"
                  required
                />
                <input
                  type="text"
                  placeholder="Review (optional)"
                  value={question.review}
                  onChange={(e) =>
                    handleQuestionChange(qIdx, "review", e.target.value)
                  }
                  className="border p-2 rounded w-full mb-4"
                />

                <div className="space-y-3">
                  {question.options.map((option, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${qIdx}`}
                        checked={option.isCorrect}
                        onChange={() =>
                          handleOptionChange(qIdx, oIdx, "isCorrect", true)
                        }
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

      <button
        onClick={() => setShowAiForm((prev) => !prev)}
        className="fixed bottom-6 animate-bounce right-6 z-50 text-4xl transition-transform duration-300 ease-in-out transform hover:scale-110 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700"
      >
        {showAiForm ? "❌" : "🤖"}
      </button>
    </>
  );
};

export default CreateQuiz;
