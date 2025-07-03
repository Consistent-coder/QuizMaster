import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { NavLink } from "react-router-dom";

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white shadow-md py-4 px-6 flex justify-between items-center">
      <Link to="/" className="text-xl font-bold text-blue-600">
        QuizMaster
      </Link>

      <div className="space-x-4 flex items-center">
        {user ? (
          <>
            <NavLink to={user.role==="ADMIN"?"/ad/dashboard":"/u/dashboard"} className="text-gray-700 font-bold p-2 rounded-full border-blue-400 border-2 hover:bg-blue-300/50">Dashboard</NavLink>
            <button
              onClick={logout}
              className="text-red-600 hover:text-red-800"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-gray-700 hover:text-blue-600">
              Login
            </Link>
            <Link to="/register" className="text-gray-700 hover:text-blue-600">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
