import { useEffect, useState } from "react";
import QuizCard from "../components/QuizCard";
import api from "../api/axio";

const Home = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchQuizzes = async (query: string = "") => {
    setLoading(true);
    try {
      const res = await api.get("/quiz/all", {
        params: query ? { searchTerm: query } : {},
      });
      console.log(res.data.quizzes);
      
      setQuizzes(res.data.quizzes);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQuizzes(searchTerm.trim());
  };

  return (
    <section className="min-h-screen bg-gray-100 py-12 px-4">
  <div className="max-w-6xl mx-auto">
    <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
      🧠 Explore Quizzes
    </h1>

    <form onSubmit={handleSearch} className="flex justify-center mb-10">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search quizzes..."
        className="w-full max-w-md px-4 py-2 border rounded-l-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700 transition"
      >
        Search
      </button>
    </form>

    {loading ? (
      <div className="text-center py-20 text-gray-600 animate-pulse">
        Loading quizzes...
      </div>
    ) : quizzes.length === 0 ? (
      <div className="text-center py-20 text-gray-500">No quizzes found.</div>
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

export default Home;