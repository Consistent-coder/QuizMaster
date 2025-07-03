import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axio";

const StartQuiz = () => {
  const { id } = useParams(); // quizId from URL
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [questionId: string]: string | null }>({});
  const [attemptId, setAttemptId] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Fetch quiz and saved answers
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await api.get(`/quiz/${id}/start`);
        console.log(res?.data);
        if (res?.data?.attempt?.status === "COMPLETED") {
          navigate(`/quiz/${id}/result`);
          return;
        }

        const saved = res.data.savedAnswers || {};

        setQuiz(res.data.quiz);
        setAttemptId(res.data.attemptId);
        setAnswers(saved);

        // Try to resume from last answered question
        const keys = Object.keys(saved);
        if (keys.length > 0) {
          const lastIndex = res.data.quiz.questions.findIndex((q: any) => q.id === keys[keys.length - 1]);
          setCurrentIndex(lastIndex !== -1 ? lastIndex : 0);
        }
      } catch (err:any) {
        if(err.response?.data?.msg.includes("You have already completed this quiz.")){
          navigate(`/quiz/${id}/result`);
          return;
        }
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [id, navigate]);

  // Auto-save answers with debounce
  useEffect(() => {
    if (!attemptId || Object.keys(answers).length === 0) return;

    const timer = setTimeout(() => {
      const payload = Object.entries(answers)
        .filter(([_, val]) => val !== null)
        .map(([questionId, selectedOptionId]) => ({ questionId, selectedOptionId }));

      if (payload.length === 0) return;

      setSaving(true);
      api
        .post(`/quiz/${id}/save-progress`, { answers: payload })
        .catch((err) => console.error("Save failed:", err))
        .finally(() => setSaving(false));
    }, 1000); // debounce 1s

    return () => clearTimeout(timer);
  }, [answers, attemptId, id]);

  const handleOptionSelect = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = async () => {
    const payload = Object.entries(answers)
      .filter(([_, val]) => val !== null)
      .map(([questionId, selectedOptionId]) => ({ questionId, selectedOptionId }));

    if (!payload.length) return;

    try {
      setSubmitLoading(true);
      await api.post(`/quiz/${id}/submit`, { answers: payload });
      navigate(`/quiz/${id}/result`);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) return <div className="text-center py-20">Loading...</div>;
  if (!quiz) return <div className="text-center py-20">Quiz not found</div>;

  const currentQuestion = quiz.questions[currentIndex];
  const selectedOptionId = answers[currentQuestion.id];

  return (
    <section className="min-h-screen py-10 px-6 bg-gray-50">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-6 text-center">{quiz.name}</h1>

        <div>
          <p className="text-lg font-medium mb-4">
            Question {currentIndex + 1}/{quiz.questions.length}
          </p>
          <h3 className="text-xl mb-4">{currentQuestion.text}</h3>

          <div className="space-y-2">
            {currentQuestion.options.map((option: any) => (
              <button
                key={option.id}
                onClick={() => handleOptionSelect(currentQuestion.id, option.id)}
                className={`w-full text-left px-4 py-2 border rounded ${
                  selectedOptionId === option.id
                    ? "bg-blue-100 border-blue-500"
                    : "hover:bg-gray-100"
                }`}
              >
                {option.text}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <button
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((prev) => prev - 1)}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50"
          >
            Prev
          </button>

          {currentIndex === quiz.questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={submitLoading}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              {submitLoading ? "Submitting..." : "Submit"}
            </button>
          ) : (
            <button
              onClick={() => setCurrentIndex((prev) => prev + 1)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Next
            </button>
          )}
        </div>

        <p className="text-sm text-right mt-4 text-gray-500">
          {saving ? "Saving progress..." : "Progress auto-saved"}
        </p>
      </div>
    </section>
  );
};

export default StartQuiz;
