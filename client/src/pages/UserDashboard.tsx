import { useEffect, useState } from "react";
import api from "../api/axio";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Pie } from "react-chartjs-2";
import { useNavigate } from "react-router-dom";

ChartJS.register(ArcElement, Tooltip, Legend);

const UserDashboard = () => {
  const [inProgress, setInProgress] = useState<any[]>([]);
  const [completed, setCompleted] = useState<any[]>([]);
  const [stats, setStats] = useState({ completed: 0, inProgress: 0 });
  const [activeTab, setActiveTab] = useState("overview");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    const fetchData = async () => {
      try {
        const [inProgRes, completedRes, statsRes] = await Promise.all([
          api.get("/quiz/u/in-progress", { headers }),
          api.get("/quiz/u/completed", { headers }),
          api.get("/quiz/u/stats", { headers }),
        ]);
        setInProgress(inProgRes.data || []);
        setCompleted(completedRes.data || []);
        setStats(statsRes.data || { completed: 0, inProgress: 0 });
      } catch (err) {
        console.error("Dashboard fetch failed", err);
      }
    };

    fetchData();
  }, []);

  const tabStyle = (tab: string) =>
    `px-4 py-2 font-semibold transition-all text-sm md:text-base rounded-t-lg ${
      activeTab === tab
        ? "bg-white border-t border-x text-blue-600"
        : "bg-gray-100 hover:bg-gray-200 text-gray-500"
    }`;

  const pieData = {
    labels: ["Completed", "In Progress"],
    datasets: [
      {
        label: "Quizzes",
        data: [stats.completed, stats.inProgress],
        backgroundColor: ["#4ade80", "#60a5fa"],
        borderWidth: 1,
      },
    ],
  };

  const renderQuote = () => (
    <div className="text-center mt-8 text-gray-400 italic text-sm">
      “The expert in anything was once a beginner.” - Helen Hayes
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">📊 Activity Dashboard</h1>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-100 border-l-4 border-green-500 p-4 rounded shadow-sm">
          <h3 className="text-lg font-semibold text-green-800">✅ Completed</h3>
          <p className="text-2xl">{stats.completed}</p>
        </div>
        <div className="bg-blue-100 border-l-4 border-blue-500 p-4 rounded shadow-sm">
          <h3 className="text-lg font-semibold text-blue-800">📝 In Progress</h3>
          <p className="text-2xl">{stats.inProgress}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-2">
        <button className={tabStyle("overview")} onClick={() => setActiveTab("overview")}>
          Overview
        </button>
        <button className={tabStyle("inprogress")} onClick={() => setActiveTab("inprogress")}>
          📝 In Progress
        </button>
        <button className={tabStyle("completed")} onClick={() => setActiveTab("completed")}>
          ✅ Completed
        </button>
      </div>

      <div className="bg-white shadow-md rounded-b-lg p-6 min-h-[300px]">
        {activeTab === "overview" && (
          <div className="w-full max-w-xs mx-auto">
            <Pie data={pieData} />
            {(stats.completed === 0 && stats.inProgress === 0) && renderQuote()}
          </div>
        )}

        {activeTab === "inprogress" && (
          <>
            {inProgress.length === 0 ? (
              renderQuote()
            ) : (
              <ul className="space-y-3">
                {inProgress.map((quiz) => (
                  <li
                    key={quiz.id}
                    onClick={() => navigate(`/quiz/${quiz.id}`)}
                    className="p-4 bg-blue-50 hover:bg-blue-100 cursor-pointer border rounded shadow-sm transition"
                  >
                    <div className="text-md font-semibold text-blue-900">{quiz.name}</div>
                    <div className="text-sm text-gray-600">Topic: {quiz.topic}</div>
                    <div className="text-xs text-gray-400">
                      Started: {new Date(quiz.startedAt).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {activeTab === "completed" && (
          <>
            {completed.length === 0 ? (
              renderQuote()
            ) : (
              <ul className="space-y-3">
                {completed.map((quiz) => (
                  <li
                    key={quiz.id}
                    className="p-4 bg-green-50 hover:bg-green-100 border rounded shadow-sm transition"
                  >
                    <div className="text-md font-semibold text-green-900">{quiz.name}</div>
                    <div className="text-sm text-gray-600">Topic: {quiz.topic}</div>
                    <div className="text-xs text-gray-500">
                      Score: {quiz.score}% — Completed at:{" "}
                      {new Date(quiz.completedAt || quiz.updatedAt).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
