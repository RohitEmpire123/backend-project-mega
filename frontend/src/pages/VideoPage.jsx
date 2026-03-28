import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios";

export default function VideoPage() {
  const { id } = useParams();
  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const currentUserId = localStorage.getItem("userId");


  useEffect(() => {
    fetchVideo();
    fetchComments();
  }, [id]);

  const fetchVideo = async () => {
    try {
      const res = await api.get(`/v1/videos/${id}`);
      setVideo(res.data.data);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await api.get(`/comments/videos/${id}/comments`);
      setComments(res.data.data.comments || []);
    } catch (error) {
      console.log(error);
    }
  };

 const handleAddComment = async () => {
  if (!newComment.trim()) return;

  try {
    const res = await api.post(`/comments/videos/${id}/comments`, {
      content: newComment,
    });

    setComments([res.data.data, ...comments]); // add new comment on top
    setNewComment("");

  } catch (error) {
    alert(error.response?.data?.message || "Failed to add comment");
  }
};
const handleDeleteComment = async (commentId) => {
  try {
    await api.delete(`/comments/comments/${commentId}`);

    setComments(comments.filter((c) => c._id !== commentId));

  } catch (error) {
    alert(error.response?.data?.message || "Delete failed");
  }
};


  if (!video) return <div className="p-6">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <video
        src={video.videoFile}
        controls
        className="w-full rounded-lg"
      />

      <h2 className="text-2xl font-bold mt-4">{video.title}</h2>
      <p className="text-zinc-400">{video.views} views</p>
      <p className="mt-2">{video.description}</p>

      {/* COMMENTS SECTION */}
      <div className="mt-8">
        <h3 className="text-xl font-bold mb-4">Comments</h3>

        {/* Add Comment */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1 p-2 bg-zinc-800 rounded"
          />
          <button
            onClick={handleAddComment}
            className="bg-red-600 px-4 rounded"
          >
            Post
          </button>
        </div>

        {/* Comment List */}
        {comments.map((comment) => (
  <div
    key={comment._id}
    className="bg-zinc-900 p-3 rounded mb-3"
  >
    <div className="flex justify-between items-center">
      <p className="font-semibold">
        {comment.owner?.username}
      </p>

      {comment.owner?._id === currentUserId && (
        <button
          onClick={() => handleDeleteComment(comment._id)}
          className="text-red-500 text-sm"
        >
          Delete
        </button>
      )}
    </div>

    <p className="text-zinc-300">{comment.content}</p>
  </div>
))}

      </div>
    </div>
  );
}
