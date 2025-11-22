import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axiosClient from "../utils/axios";
import Post from "../components/Post";
import Loading from "../components/Loading";
import { toast } from "react-hot-toast";

function Home() {
  const { user } = useSelector((state) => state.authSlice);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await axiosClient.get("/api/posts/getAll");
      setPosts(result.data.posts || []);
    } catch (error) {
      console.log(error);
      setError("Failed to load posts");
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  const handlePostUpdate = (updatedPost) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post._id === updatedPost._id ? updatedPost : post
      )
    );
  };

  const handlePostDelete = (postId) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post._id !== postId));
  };

  if (loading) {
    return (
      <div className="w-full bg-black min-h-[100vh] flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="w-full bg-black min-h-[100vh]">
      <div className="w-full min-h-[100vh] flex flex-col items-center gap-[20px] p-[10px] pt-[40px] bg-white rounded-t-[60px] pb-[120px]">
        {error && (
          <div className="w-[90%] p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {posts.length === 0 ? (
          <div className="w-[90%] p-8 text-center text-gray-500">
            <p className="text-xl font-semibold mb-2">No posts yet</p>
            <p>Be the first to share something!</p>
          </div>
        ) : (
          posts.map((post) => (
            <Post
              key={post._id}
              post={post}
              onPostUpdate={handlePostUpdate}
              onPostDelete={handlePostDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default Home;

