import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axio";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const {user}=useAuth();
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

   useEffect(()=>{
      if(user) return navigate("/");
    },[])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post("/auth/signin", form);
      const { user, token } = res.data;

      login(user, token);
      navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.msg || "Login failed");
    }
  };

  return (
    <section className="flex justify-center items-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-md shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

        {error && <p className="text-red-600 mb-4 text-center">{error}</p>}

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="w-full mb-4 px-4 py-2 border rounded-md"
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="w-full mb-6 px-4 py-2 border rounded-md"
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
        >
          Login
        </button>
      </form>
    </section>
  );
};

export default Login;