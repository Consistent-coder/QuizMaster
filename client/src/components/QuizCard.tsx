import { Link } from "react-router-dom";

const QuizCard = ({ quiz }: { quiz: any }) => {
  const estimatedTime = Math.ceil((quiz.questionCount || 0) * 0.5); // 30s per question

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition duration-300 p-6 flex flex-col justify-between h-full border border-gray-100">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">{quiz.name}</h2>
        <p className="text-sm text-gray-600 mb-3">
          {quiz.description || "No description available."}
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {quiz.tags?.map((tag: any) => (
            <span
              key={tag.id}
              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full"
            >
              #{tag.name}
            </span>
          ))}
        </div>

        <div className="text-sm text-gray-500 space-y-1">
          <p>🧩 Questions: {quiz?.questionCount}</p>
          <p>⏱ Estimated Time: ~{estimatedTime} min</p>
          {quiz?.createdBy?.name && <p>👤 By: {quiz.createdBy.name}</p>}
        </div>
      </div>

      <div className="mt-6">
        <Link
          to={`/quiz/${quiz.id}`}
          className="block w-full text-center bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
        >
          Start Quiz
        </Link>
      </div>
    </div>
  );
};

export default QuizCard;
