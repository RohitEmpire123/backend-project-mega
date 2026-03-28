import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post("/v1/users/logout");

      localStorage.removeItem("userId");
      localStorage.removeItem("username");

      setUser(null);
      navigate("/login"); // 🔥 THIS LINE FIXES IT

    } catch (error) {
      console.log(error);
    }
  };

  return (
    <nav className="bg-zinc-900 px-6 py-4 flex justify-between items-center">
      <Link to="/" className="text-red-500 font-bold text-xl">
        RohitTube
      </Link>

      <div className="flex items-center gap-4">
        {user && (
          <Link
            to="/upload"
            className="bg-red-600 px-4 py-1 rounded hover:bg-red-700"
          >
            Upload
          </Link>
        )}

        {user ? (
          <>
            <span className="text-sm">{user.username}</span>
            <button
              onClick={handleLogout}
              className="bg-zinc-700 px-3 py-1 rounded"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="bg-zinc-700 px-3 py-1 rounded">
              Login
            </Link>
            <Link to="/register" className="bg-red-600 px-3 py-1 rounded">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
