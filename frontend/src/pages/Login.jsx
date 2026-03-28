import { useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { setUser } = useAuth();
  const navigate = useNavigate();


  const handleLogin = async (e) => {
  e.preventDefault();

  try {
    const res = await api.post("/v1/users/login", {
      email,
      password,
    });

    setUser(res.data.data.user);

    localStorage.setItem("username", res.data.data.user.username);
    localStorage.setItem("userId", res.data.data.user._id);

    navigate("/");

  } catch (error) {
    alert(error.response?.data?.message || "Login failed");
  }
};


  return (
    <div className="flex justify-center items-center h-screen">
      <form
        onSubmit={handleLogin}
        className="bg-zinc-900 p-8 rounded-lg w-96 space-y-4"
      >
        <h2 className="text-2xl font-bold text-center">Login</h2>

        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 rounded bg-zinc-800"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 rounded bg-zinc-800"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="w-full bg-red-600 p-2 rounded hover:bg-red-700">
          Login
        </button>
      </form>
    </div>
  );
}
