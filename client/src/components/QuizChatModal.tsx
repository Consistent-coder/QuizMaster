import { useEffect, useState } from "react";
import api from "../api/axio";

const QuizChatModal = ({ quizId }: { quizId: string }) => {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadHistory = async () => {
    try {
      const res = await api.get(`/quiz/${quizId}/chat`);
      setHistory(res.data.messages || []);
    } catch (err) {
      console.error("Failed to load chat history", err);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    const token = localStorage.getItem("token");
    setIsLoading(true);
    setHistory((prev) => [...prev, { role: "user", content: message }]);

    try {
      const res = await api.post(`/quiz/${quizId}/chat`, { message }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const reply = res.data.reply;
      setHistory((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      console.error("Failed to get bot response", err);
      setHistory((prev) => [...prev, { role: "assistant", content: "❌ Sorry, something went wrong." }]);
    }

    setIsLoading(false);
    setMessage("");
  };

  useEffect(() => {
    if (open) loadHistory();
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-700 transition-all"
      >
        💬 QuizMaster
      </button>

      {/* Chat Modal */}
      {open && (
        <div className="fixed bottom-20 right-6 w-80 h-[70vh] bg-white shadow-xl rounded-lg flex flex-col z-50 border overflow-hidden">
          {/* Header */}
          <div className="px-4 py-2 border-b flex justify-between items-center bg-blue-100">
            <h2 className="font-semibold text-blue-800">QuizMaster</h2>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-500 hover:text-red-600 font-bold text-xl"
            >
              ×
            </button>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-white">
            {[...history, isLoading && { role: "assistant", content: "🤖 Thinking..." }]
              .filter(Boolean)
              .map((msg, idx) => (
                <div
                  key={idx}
                  className={`px-3 py-2 rounded-lg text-sm max-w-[80%] whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-blue-100 text-blue-800 ml-auto"
                      : "bg-gray-100 text-gray-700 mr-auto"
                  }`}
                >
                  {msg.content}
                </div>
              ))}
          </div>

          {/* Input */}
          <div className="p-3 border-t flex gap-2 items-center bg-white">
            <input
              type="text"
              disabled={isLoading}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              className="flex-1 border rounded px-3 py-2 text-sm"
              placeholder="Ask something..."
            />
            <button
              onClick={sendMessage}
              disabled={isLoading}
              className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default QuizChatModal;
