import { useEffect, useState } from "react";
import api from "../api/axio";
import QuizCard from "../components/QuizCard";

const AdminDashboard = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminQuizzes = async () => {
    try {
      const res = await api.get("/quiz/admin");
      setQuizzes(res.data.quizzes);
    } catch (err) {
      console.error("Error fetching admin quizzes", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminQuizzes();
  }, []);

  return (
    <section className="min-h-screen bg-gray-50 p-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">🛠️ Admin Dashboard</h1>
        <p className="text-gray-600 mb-8">Manage your quizzes, create new ones, and review existing content.</p>

        <div className="mb-10">
          <a
            href="/ad/create"
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
          >
            ➕ Create New Quiz
          </a>
        </div>

        {loading ? (
          <p className="text-gray-500 text-center">Loading your quizzes...</p>
        ) : quizzes.length === 0 ? (
          <p className="text-center text-gray-500">You haven't created any quizzes yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz: any) => (
              <QuizCard key={quiz.id} quiz={quiz} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default AdminDashboard;
