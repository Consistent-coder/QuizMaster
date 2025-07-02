import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Navbar from "./components/Navbar";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ProtectedRoute from "./routes/Protected.route";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRoute from "./routes/AdminRoute";
import CreateQuiz from "./pages/CreateQuiz";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route />
        </Route>
        <Route element={<AdminRoute />}>
          <Route path="/ad">
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="create" element={<CreateQuiz />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
