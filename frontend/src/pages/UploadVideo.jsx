import { useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function UploadVideo() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [videoFile, setVideoFile] = useState(null);


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!videoFile || !thumbnail) {
      alert("Video and Thumbnail required");
      return;
  }



    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("thumbnail", thumbnail);
      formData.append("videoFile", videoFile);


      await api.post("/v1/videos", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Video uploaded successfully 🚀");
      navigate("/");

    } catch (error) {
      alert(error.response?.data?.message || "Upload failed");
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
        <h2 className="text-2xl font-bold text-center">Upload Video</h2>

        <input
          type="text"
          placeholder="Video Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 bg-zinc-800 rounded"
          required
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 bg-zinc-800 rounded"
        />
        <input
            type="file"
            accept="video/*"
            onChange={(e) => setVideoFile(e.target.files[0])}
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setThumbnail(e.target.files[0])}
          
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 p-2 rounded hover:bg-red-700"
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
      </form>
    </div>
  );
}
