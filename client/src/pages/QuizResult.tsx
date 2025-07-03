import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import api from "../api/axio";
import QuizChatModal from "../components/QuizChatModal";
import { useAuth } from "../context/AuthContext";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const QuizResult = () => {
  const { id } = useParams();
  const {user}=useAuth();
  const navigate = useNavigate();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await api.get(`/quiz/${id}/attempt`);
        setResult(res.data);
      } catch (err) {
        console.error("Error fetching result", err);
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [id]);

  if (loading) return <div className="text-center py-20">Loading...</div>;
  if (!result) return <div className="text-center py-20">Result not found</div>;

  const { quiz, totalScore, percentage, evaluatedAnswers } = result;

  const chartData = {
    labels: evaluatedAnswers.map((_: any, i: number) => `Q${i + 1}`),
    datasets: [
      {
        label: "Correct",
        data: evaluatedAnswers.map((q: any) => (q.isCorrect ? 1 : 0)),
        backgroundColor: "rgba(34,197,94,0.7)",
      },
      {
        label: "Incorrect",
        data: evaluatedAnswers.map((q: any) =>
          q.isCorrect || q.selectedOption === null ? 0 : 1
        ),
        backgroundColor: "rgba(239,68,68,0.7)",
      },
      {
        label: "Unattempted",
        data: evaluatedAnswers.map((q: any) =>
          q.selectedOption === null ? 1 : 0
        ),
        backgroundColor: "rgba(234,179,8,0.7)",
      },
    ],
  };

  return (
    <section className="min-h-screen py-10 px-6 bg-gray-50 relative">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">{quiz.name}</h1>
          <p className="text-gray-600">Topic: {quiz.topic}</p>
          <h2 className="text-xl font-semibold text-green-600">
            Score: {totalScore} ({percentage}%)
          </h2>
        </div>

        {/* Chart */}
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="text-lg font-semibold mb-2">📊 Performance Graph</h3>
          <Bar data={chartData} />
        </div>

        {/* Question Review */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">🧠 Detailed Review</h3>
          {evaluatedAnswers.map((q: any, idx: number) => (
            <div key={q.questionId} className="border p-4 rounded-md">
              <h4 className="font-semibold mb-2">
                Q{idx + 1}. {q.questionText}
              </h4>
              <ul className="mb-2 space-y-1">
                {q.options.map((opt: any, i: number) => {
                  const isCorrect = opt.text === q.correctAnswer;
                  const isSelected = opt.text === q.selectedOption;
                  const wasUnattempted = q.selectedOption === null;

                  let className = "p-2 rounded border ";

                  if (wasUnattempted) {
                    className += "bg-yellow-100 border-yellow-400";
                  } else if (isCorrect) {
                    className += "bg-green-100 border-green-400";
                  } else if (isSelected && !isCorrect) {
                    className += "bg-red-100 border-red-400";
                  } else {
                    className += "bg-gray-50";
                  }

                  return (
                    <li key={i} className={className}>
                      {opt.text}
                    </li>
                  );
                })}
              </ul>

              {q.selectedOption === null && (
                <p className="text-yellow-600 italic mt-1">
                  ⚠️ You didn't attempt this question.
                </p>
              )}

              <p className="text-sm text-gray-600 italic">💡 {q.review}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={() => user?.role==="ADMIN"?navigate("/ad/dashboard"):navigate("/u/dashboard")}
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Chat Bot */}
      <QuizChatModal quizId={id!} />
    </section>
  );
};

export default QuizResult;