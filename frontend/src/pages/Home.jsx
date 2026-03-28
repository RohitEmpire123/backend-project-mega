import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await api.get("/v1/videos");
        setVideos(res.data.data.videos || []);
      } catch (error) {
        console.log("Error fetching videos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-white">
        Loading videos...
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen text-zinc-400">
        No videos available. Publish one 🚀
      </div>
    );
  }

  return (
    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {videos.map((video) => (
        <div
          key={video._id}
          onClick={() => navigate(`/video/${video._id}`)}
          className="bg-zinc-900 rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition duration-200"
        >
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-48 object-cover"
          />

          <div className="p-4 space-y-1">
            <h3 className="font-semibold line-clamp-2">
              {video.title}
            </h3>

            <p className="text-sm text-zinc-400">
              {video.owner?.username}
            </p>

            <p className="text-xs text-zinc-500">
              {video.views} views
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
