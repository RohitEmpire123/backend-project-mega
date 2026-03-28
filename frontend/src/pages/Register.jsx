import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    fullName: "",
    email: "",
    password: "",
  });

  const [avatar, setAvatar] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!avatar) {
      alert("Avatar is required");
      return;
    }

    try {
      setLoading(true);

      const data = new FormData();
      data.append("username", form.username);
      data.append("fullName", form.fullName);
      data.append("email", form.email);
      data.append("password", form.password);
      data.append("avatar", avatar);

      if (coverImage) {
        data.append("coverImage", coverImage);
      }

      await api.post("/v1/users/register", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Registered successfully 🎉");
      navigate("/login");

    } catch (error) {
      alert(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-black text-white">
      <form
        onSubmit={handleSubmit}
        className="bg-zinc-900 p-8 rounded-xl w-96 space-y-4"
      >
        <h2 className="text-2xl font-bold text-center">Create Account</h2>

        <input
          type="text"
          name="username"
          placeholder="Username"
          className="w-full p-2 rounded bg-zinc-800"
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="fullName"
          placeholder="Full Name"
          className="w-full p-2 rounded bg-zinc-800"
          onChange={handleChange}
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          className="w-full p-2 rounded bg-zinc-800"
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          className="w-full p-2 rounded bg-zinc-800"
          onChange={handleChange}
          required
        />

        <div>
          <label className="text-sm">Avatar (required)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setAvatar(e.target.files[0])}
            className="w-full mt-1"
          />
        </div>

        <div>
          <label className="text-sm">Cover Image (optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCoverImage(e.target.files[0])}
            className="w-full mt-1"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 p-2 rounded hover:bg-red-700"
        >
          {loading ? "Creating..." : "Register"}
        </button>
      </form>
    </div>
  );
}
