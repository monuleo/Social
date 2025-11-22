import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import axiosClient from "../utils/axios";
import Loading from "../components/Loading";
import { toast } from "react-hot-toast";

function Activities() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const defaultDp = "https://via.placeholder.com/150";

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await axiosClient.get("/api/activities/getAll");
      setActivities(result.data.activities || []);
    } catch (error) {
      console.log(error);
      setError("Failed to load activities");
      toast.error("Failed to load activities");
    } finally {
      setLoading(false);
    }
  };

  // Format timestamp to relative time
  const formatTimestamp = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return "just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? "s" : ""} ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  };

  // Get icon/emoji for activity type
  const getActivityIcon = (actionType) => {
    switch (actionType) {
      case "POST_CREATED":
        return "📝";
      case "POST_LIKED":
        return "❤️";
      case "POST_UNLIKED":
        return "💔";
      case "USER_FOLLOWED":
        return "➕";
      case "USER_UNFOLLOWED":
        return "➖";
      case "POST_DELETED":
        return "🗑️";
      case "USER_DELETED":
        return "👤❌";
      case "ADMIN_CREATED":
        return "👑";
      case "ADMIN_DELETED":
        return "👑❌";
      default:
        return "📌";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">Activity Wall</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {activities.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-gray-500 text-lg">No activities yet</p>
            <p className="text-gray-400 text-sm mt-2">
              Activities will appear here as users interact with the platform
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity._id}
                className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {/* Profile Picture */}
                  <div
                    className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200 cursor-pointer flex-shrink-0"
                    onClick={() => navigate("/profile")}
                  >
                    <img
                      src={
                        activity.actor?.profilePicture ||
                        defaultDp
                      }
                      alt={activity.actor?.username || "User"}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Activity Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{getActivityIcon(activity.actionType)}</span>
                      <p className="text-gray-800 font-medium">
                        {activity.message}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500">
                      {formatTimestamp(activity.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Activities;

