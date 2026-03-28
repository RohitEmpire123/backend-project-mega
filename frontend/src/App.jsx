import { Routes, Route } from "react-router-dom"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Register from "./pages/Register"
import VideoPage from "./pages/VideoPage";
import Navbar from "./components/Navbar";
import UploadVideo from "./pages/UploadVideo";



export default function App() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/video/:id" element={<VideoPage />} />
        <Route path="/upload" element={<UploadVideo />} />

      </Routes>
    </div>
  )
}
