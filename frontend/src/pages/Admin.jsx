import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import axiosClient from "../utils/axios";
import { toast } from "react-hot-toast";
import { ClipLoader } from "react-spinners";
import { FiTrash2, FiUserPlus } from "react-icons/fi";
import { authenticateUser } from "../store/authSlice";

function Admin() {
  const { user } = useSelector((state) => state.authSlice);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState({
    users: false,
    posts: false,
    admins: false,
  });
  const [deleting, setDeleting] = useState({});
  const [createAdminForm, setCreateAdminForm] = useState({
    username: "",
    emailId: "",
    password: "",
    bio: "",
  });
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [likesModal, setLikesModal] = useState({
    open: false,
    postId: null,
    postContent: "",
    likes: [],
    loading: false,
    modalId: null,
  });

  // Check if user is admin or owner
  useEffect(() => {
    if (!user || (user.role !== "admin" && user.role !== "owner")) {
      toast.error("Access denied. Admin/Owner only.");
      navigate("/");
    }
  }, [user, navigate]);

  // Fetch users
  const fetchUsers = async () => {
    setLoading((prev) => ({ ...prev, users: true }));
    try {
      const result = await axiosClient.get("/api/admin/users");
      setUsers(result.data.users || []);
    } catch (error) {
      console.log(error);
      toast.error("Failed to load users");
    } finally {
      setLoading((prev) => ({ ...prev, users: false }));
    }
  };

  // Fetch posts
  const fetchPosts = async () => {
    setLoading((prev) => ({ ...prev, posts: true }));
    try {
      const result = await axiosClient.get("/api/posts/getAll");
      setPosts(result.data.posts || []);
    } catch (error) {
      console.log(error);
      toast.error("Failed to load posts");
    } finally {
      setLoading((prev) => ({ ...prev, posts: false }));
    }
  };

  // Fetch admins (Owner only)
  const fetchAdmins = async () => {
    if (user?.role !== "owner") return;
    setLoading((prev) => ({ ...prev, admins: true }));
    try {
      const result = await axiosClient.get("/api/admin/getAll");
      setAdmins(result.data.admins || []);
    } catch (error) {
      console.log(error);
      toast.error("Failed to load admins");
    } finally {
      setLoading((prev) => ({ ...prev, admins: false }));
    }
  };

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    } else if (activeTab === "posts") {
      fetchPosts();
    } else if (activeTab === "admins" && user?.role === "owner") {
      fetchAdmins();
    }
  }, [activeTab, user?.role]);

  // Delete user
  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"?`)) {
      return;
    }

    setDeleting((prev) => ({ ...prev, [`user-${userId}`]: true }));
    try {
      await axiosClient.delete(`/api/users/${userId}`);
      toast.success("User deleted successfully");
      fetchUsers();
      dispatch(authenticateUser()); // Refresh user data
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Failed to delete user");
    } finally {
      setDeleting((prev) => ({ ...prev, [`user-${userId}`]: false }));
    }
  };

  // Delete post
  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }

    setDeleting((prev) => ({ ...prev, [`post-${postId}`]: true }));
    try {
      await axiosClient.delete(`/api/posts/${postId}`);
      toast.success("Post deleted successfully");
      fetchPosts();
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Failed to delete post");
    } finally {
      setDeleting((prev) => ({ ...prev, [`post-${postId}`]: false }));
    }
  };

  // Fetch user details for likes
  const fetchLikeUsers = async (likeIds) => {
    if (!likeIds || likeIds.length === 0) return [];
    
    try {
      // Fetch user details for each like ID
      const userPromises = likeIds.map(async (userId) => {
        try {
          const result = await axiosClient.get(`/api/users/${userId}`);
          return {
            _id: userId,
            username: result.data.user.username,
            emailId: result.data.user.emailId,
            profilePicture: result.data.user.profilePicture,
          };
        } catch (error) {
          // If user was deleted or not found, return null
          console.log(`Failed to fetch user ${userId}:`, error);
          return {
            _id: userId,
            username: "Unknown User",
            emailId: "",
            profilePicture: null,
          };
        }
      });
      
      const users = await Promise.all(userPromises);
      return users;
    } catch (error) {
      console.log("Error fetching like users:", error);
      return [];
    }
  };

  // Open likes modal
  const handleOpenLikesModal = async (post) => {
    const modalId = Date.now(); // Unique ID for this modal instance
    setLikesModal({
      open: true,
      postId: post._id,
      postContent: post.content,
      likes: [],
      loading: true,
      modalId, // Track this modal instance
    });

    // Fetch user details for all likes
    if (post.likes && post.likes.length > 0) {
      try {
        const likeUsers = await fetchLikeUsers(post.likes);
        // Only update if modal is still open and it's the same instance
        setLikesModal((prev) => {
          if (prev.open && prev.modalId === modalId && prev.postId === post._id) {
            return {
              ...prev,
              likes: likeUsers,
              loading: false,
            };
          }
          return prev; // Don't update if modal was closed or changed
        });
      } catch (error) {
        console.log("Error fetching like users:", error);
        setLikesModal((prev) => {
          if (prev.open && prev.modalId === modalId) {
            return {
              ...prev,
              loading: false,
            };
          }
          return prev;
        });
      }
    } else {
      setLikesModal((prev) => {
        if (prev.open && prev.modalId === modalId) {
          return {
            ...prev,
            loading: false,
          };
        }
        return prev;
      });
    }
  };

  // Close likes modal
  const handleCloseLikesModal = () => {
    setLikesModal({
      open: false,
      postId: null,
      postContent: "",
      likes: [],
      loading: false,
      modalId: null,
    });
  };

  // Delete like
  const handleDeleteLike = async (postId, userId) => {
    if (!window.confirm("Are you sure you want to remove this like?")) {
      return;
    }

    setDeleting((prev) => ({ ...prev, [`like-${postId}-${userId}`]: true }));
    try {
      await axiosClient.delete(`/api/posts/${postId}/like/${userId}`);
      toast.success("Like removed successfully");
      
      // Update modal if it's open for this post (optimistic update)
      if (likesModal.open && likesModal.postId === postId) {
        setLikesModal((prev) => ({
          ...prev,
          likes: prev.likes.filter((like) => like._id !== userId),
        }));
      }
      
      // Refresh posts list
      fetchPosts();
    } catch (error) {
      console.log(error);
      const errorMessage = error.response?.data?.message || "Failed to remove like";
      toast.error(errorMessage);
      
      // If like was already removed or post was deleted, refresh modal
      if (error.response?.status === 400 || error.response?.status === 404) {
        if (likesModal.open && likesModal.postId === postId) {
          // Refresh the modal data
          const currentPost = posts.find((p) => p._id === postId);
          if (currentPost) {
            handleOpenLikesModal(currentPost);
          } else {
            // Post was deleted, close modal
            handleCloseLikesModal();
            toast.error("Post was deleted");
          }
        }
      }
    } finally {
      setDeleting((prev) => ({ ...prev, [`like-${postId}-${userId}`]: false }));
    }
  };

  // Create admin (Owner only)
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (creatingAdmin) return;

    setCreatingAdmin(true);
    try {
      const result = await axiosClient.post("/api/admin/create", createAdminForm);
      toast.success(result.data.message || "Admin created successfully");
      setCreateAdminForm({ username: "", emailId: "", password: "", bio: "" });
      fetchAdmins();
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Failed to create admin");
    } finally {
      setCreatingAdmin(false);
    }
  };

  // Delete admin (Owner only)
  const handleDeleteAdmin = async (adminId, username) => {
    if (!window.confirm(`Are you sure you want to delete admin "${username}"?`)) {
      return;
    }

    setDeleting((prev) => ({ ...prev, [`admin-${adminId}`]: true }));
    try {
      await axiosClient.delete(`/api/admin/${adminId}`);
      toast.success("Admin deleted successfully");
      fetchAdmins();
      dispatch(authenticateUser()); // Refresh user data
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Failed to delete admin");
    } finally {
      setDeleting((prev) => ({ ...prev, [`admin-${adminId}`]: false }));
    }
  };

  if (!user || (user.role !== "admin" && user.role !== "owner")) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">Admin Panel</h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-300">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === "users"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab("posts")}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === "posts"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Posts
          </button>
          {user.role === "owner" && (
            <button
              onClick={() => setActiveTab("admins")}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === "admins"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Admins
            </button>
          )}
        </div>

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">All Users</h2>
            {loading.users ? (
              <div className="flex justify-center py-8">
                <ClipLoader size={40} color="#3b82f6" />
              </div>
            ) : users.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No users found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-3">Username</th>
                      <th className="text-left p-3">Email</th>
                      <th className="text-left p-3">Role</th>
                      <th className="text-left p-3">Posts</th>
                      <th className="text-left p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((userItem) => (
                      <tr key={userItem._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-3">{userItem.username}</td>
                        <td className="p-3">{userItem.emailId}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-sm ${
                            userItem.role === "owner" ? "bg-purple-100 text-purple-800" :
                            userItem.role === "admin" ? "bg-blue-100 text-blue-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {userItem.role}
                          </span>
                        </td>
                        <td className="p-3">{userItem.postCount || 0}</td>
                        <td className="p-3">
                          {userItem._id !== user._id && 
                           // Admins can only delete regular users, not owners or other admins
                           (user.role === "owner" || 
                            (user.role === "admin" && userItem.role === "user")) && (
                            <button
                              onClick={() => handleDeleteUser(userItem._id, userItem.username)}
                              disabled={deleting[`user-${userItem._id}`]}
                              className="text-red-600 hover:text-red-700 disabled:opacity-50 flex items-center gap-2"
                            >
                              {deleting[`user-${userItem._id}`] ? (
                                <ClipLoader size={16} color="#dc2626" />
                              ) : (
                                <>
                                  <FiTrash2 />
                                  <span>Delete</span>
                                </>
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Posts Tab */}
        {activeTab === "posts" && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">All Posts</h2>
            {loading.posts ? (
              <div className="flex justify-center py-8">
                <ClipLoader size={40} color="#3b82f6" />
              </div>
            ) : posts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No posts found</p>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <div key={post._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold">{post.author?.username || "Unknown"}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(post.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeletePost(post._id)}
                        disabled={deleting[`post-${post._id}`]}
                        className="text-red-600 hover:text-red-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        {deleting[`post-${post._id}`] ? (
                          <ClipLoader size={16} color="#dc2626" />
                        ) : (
                          <>
                            <FiTrash2 />
                            <span>Delete Post</span>
                          </>
                        )}
                      </button>
                    </div>
                    {post.image && (
                      <img
                        src={post.image}
                        alt="Post"
                        className="w-full max-w-md h-48 object-cover rounded-lg mb-3"
                      />
                    )}
                    <p className="text-gray-700 mb-3">
                      {post.content?.substring(0, 100)}
                      {post.content?.length > 100 && "..."}
                    </p>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">
                        ❤️ {post.likesCount || 0} likes
                      </span>
                      {post.likes && post.likes.length > 0 && (
                        <button
                          onClick={() => handleOpenLikesModal(post)}
                          className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 transition-colors"
                        >
                          Manage Likes
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Admins Tab (Owner only) */}
        {activeTab === "admins" && user.role === "owner" && (
          <div className="space-y-6">
            {/* Create Admin Form */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FiUserPlus />
                Create New Admin
              </h2>
              <form onSubmit={handleCreateAdmin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={createAdminForm.username}
                    onChange={(e) =>
                      setCreateAdminForm({ ...createAdminForm, username: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={createAdminForm.emailId}
                    onChange={(e) =>
                      setCreateAdminForm({ ...createAdminForm, emailId: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={createAdminForm.password}
                    onChange={(e) =>
                      setCreateAdminForm({ ...createAdminForm, password: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio (Optional)
                  </label>
                  <textarea
                    value={createAdminForm.bio}
                    onChange={(e) =>
                      setCreateAdminForm({ ...createAdminForm, bio: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                  />
                </div>
                <button
                  type="submit"
                  disabled={creatingAdmin}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creatingAdmin ? (
                    <ClipLoader size={20} color="white" />
                  ) : (
                    <>
                      <FiUserPlus />
                      Create Admin
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Admins List */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">All Admins</h2>
              {loading.admins ? (
                <div className="flex justify-center py-8">
                  <ClipLoader size={40} color="#3b82f6" />
                </div>
              ) : admins.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No admins found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left p-3">Username</th>
                        <th className="text-left p-3">Email</th>
                        <th className="text-left p-3">Created</th>
                        <th className="text-left p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {admins.map((admin) => (
                        <tr
                          key={admin._id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="p-3">{admin.username}</td>
                          <td className="p-3">{admin.emailId}</td>
                          <td className="p-3 text-sm text-gray-500">
                            {new Date(admin.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => handleDeleteAdmin(admin._id, admin.username)}
                              disabled={deleting[`admin-${admin._id}`]}
                              className="text-red-600 hover:text-red-700 disabled:opacity-50 flex items-center gap-2"
                            >
                              {deleting[`admin-${admin._id}`] ? (
                                <ClipLoader size={16} color="#dc2626" />
                              ) : (
                                <>
                                  <FiTrash2 />
                                  <span>Delete</span>
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Likes Management Modal */}
        {likesModal.open && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Manage Likes</h2>
                <button
                  onClick={handleCloseLikesModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              {/* Post Content Preview */}
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Post:</p>
                <p className="text-gray-800 line-clamp-2">
                  {likesModal.postContent || "No content"}
                </p>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6">
                {likesModal.loading ? (
                  <div className="flex justify-center py-8">
                    <ClipLoader size={40} color="#3b82f6" />
                  </div>
                ) : likesModal.likes.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No likes found</p>
                ) : (
                  <div className="space-y-3">
                    {likesModal.likes.map((likeUser) => (
                      <div
                        key={likeUser._id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-300">
                            <img
                              src={
                                likeUser.profilePicture ||
                                "https://via.placeholder.com/150"
                              }
                              alt={likeUser.username}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {likeUser.username}
                            </p>
                            {likeUser.emailId && (
                              <p className="text-sm text-gray-500">{likeUser.emailId}</p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            handleDeleteLike(likesModal.postId, likeUser._id)
                          }
                          disabled={deleting[`like-${likesModal.postId}-${likeUser._id}`]}
                          className="text-red-600 hover:text-red-700 disabled:opacity-50 flex items-center gap-2 px-3 py-1 border border-red-300 rounded hover:bg-red-50 transition-colors"
                        >
                          {deleting[`like-${likesModal.postId}-${likeUser._id}`] ? (
                            <ClipLoader size={14} color="#dc2626" />
                          ) : (
                            <>
                              <FiTrash2 />
                              <span>Remove</span>
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={handleCloseLikesModal}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;

