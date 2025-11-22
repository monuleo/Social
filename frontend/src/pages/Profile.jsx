import React, { useState, useEffect } from 'react'
import { MdOutlineKeyboardBackspace } from "react-icons/md";
import { useNavigate, useParams } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import axiosClient from '../utils/axios';
import { ClipLoader } from 'react-spinners';
import { toast } from 'react-hot-toast';
import { authenticateUser } from '../store/authSlice';

function Profile() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { id } = useParams() // Get user ID from route
  const { user } = useSelector((state) => state.authSlice)
  const [profileData, setProfileData] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [postType, setPostType] = useState("posts")
  const [isFollowing, setIsFollowing] = useState(false)
  const [followingLoading, setFollowingLoading] = useState(false)
  const [blocking, setBlocking] = useState(false)
  const [blockedUsers, setBlockedUsers] = useState([])
  const [loadingBlockedUsers, setLoadingBlockedUsers] = useState(false)
  const defaultDp = "https://via.placeholder.com/150"

  const isOwnProfile = !id || user?._id === id

  // Fetch profile (own or other user's)
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        let profileResult
        
        if (isOwnProfile) {
          // Get current user profile
          profileResult = await axiosClient.get("/api/auth/profile")
        } else {
          // Get other user's profile
          profileResult = await axiosClient.get(`/api/users/${id}`)
        }
        
        setProfileData(profileResult.data.user)
        
        // Get user's posts
        const userId = profileResult.data.user?._id
        if (userId) {
          const postsResult = await axiosClient.get(`/api/users/${userId}/posts`)
          setPosts(postsResult.data.posts || [])
        }
        
        // Check if following (for other users' profiles)
        if (!isOwnProfile && user) {
          const isFollowingUser = user.following?.some(
            (followingId) => followingId.toString() === userId
          )
          setIsFollowing(isFollowingUser || false)
        }
        
        // Fetch blocked users if viewing own profile
        if (isOwnProfile) {
          fetchBlockedUsers()
        }
        
        setLoading(false)
      } catch (error) {
        console.log(error)
        if (error.response?.status === 404) {
          toast.error("User not found")
          navigate("/")
        } else if (error.response?.status === 403) {
          toast.error("Cannot view this profile")
          navigate("/")
        } else {
          toast.error("Failed to load profile")
        }
        setLoading(false)
      }
    }
    fetchProfile()
  }, [id, user, isOwnProfile, navigate])

  // Handle Follow/Unfollow
  const handleFollow = async () => {
    if (!profileData || blocking || followingLoading) return
    
    const currentlyFollowing = isFollowing
    setFollowingLoading(true)
    try {
      if (currentlyFollowing) {
        await axiosClient.delete(`/api/users/${profileData._id}/unfollow`)
        toast.success("Unfollowed successfully")
        setIsFollowing(false)
      } else {
        await axiosClient.post(`/api/users/${profileData._id}/follow`)
        toast.success("Followed successfully")
        setIsFollowing(true)
      }
      // Refresh user data and profile
      dispatch(authenticateUser())
      // Refetch profile to update follower count
      const profileResult = await axiosClient.get(`/api/users/${profileData._id}`)
      setProfileData(profileResult.data.user)
    } catch (error) {
      console.log(error)
      toast.error(error.response?.data?.message || "Failed to follow/unfollow")
      setIsFollowing(currentlyFollowing) // Revert on error
    } finally {
      setFollowingLoading(false)
    }
  }

  // Handle Block/Unblock
  const handleBlock = async () => {
    if (!profileData || blocking || followingLoading) return
    
    const isCurrentlyBlocked = user?.blockedUsers?.some(
      (blockedId) => blockedId.toString() === profileData._id
    )
    
    if (!isCurrentlyBlocked && !window.confirm(`Are you sure you want to block ${profileData.username}?`)) {
      return
    }
    
    setBlocking(true)
    try {
      if (isCurrentlyBlocked) {
        await axiosClient.delete(`/api/users/${profileData._id}/unblock`)
        toast.success("User unblocked successfully")
      } else {
        await axiosClient.post(`/api/users/${profileData._id}/block`)
        toast.success("User blocked successfully")
      }
      // Refresh user data
      dispatch(authenticateUser())
      // Navigate away if blocking
      if (!isCurrentlyBlocked) {
        navigate("/")
      } else {
        // Refetch profile after unblocking
        const profileResult = await axiosClient.get(`/api/users/${profileData._id}`)
        setProfileData(profileResult.data.user)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.response?.data?.message || "Failed to block/unblock")
    } finally {
      setBlocking(false)
    }
  }

  // Fetch blocked users details
  const fetchBlockedUsers = async () => {
    setLoadingBlockedUsers(true)
    try {
      const result = await axiosClient.get("/api/users/blocked")
      setBlockedUsers(result.data.blockedUsers || [])
    } catch (error) {
      console.log(error)
      toast.error("Failed to load blocked users")
      setBlockedUsers([])
    } finally {
      setLoadingBlockedUsers(false)
    }
  }

  // Handle unblock user
  const handleUnblock = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to unblock ${username}?`)) {
      return
    }
    
    try {
      await axiosClient.delete(`/api/users/${userId}/unblock`)
      toast.success("User unblocked successfully")
      // Refresh user data
      dispatch(authenticateUser())
      // Refresh blocked users list
      fetchBlockedUsers()
    } catch (error) {
      console.log(error)
      toast.error(error.response?.data?.message || "Failed to unblock user")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <ClipLoader size={50} color="white" />
      </div>
    )
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <p>Profile not found</p>
      </div>
    )
  }

  return (
    <div className='w-full min-h-screen bg-black'>
      {/* Header */}
      <div className='w-full h-[80px] flex justify-between items-center px-[30px] text-white'>
        <div onClick={() => navigate("/")}>
          <MdOutlineKeyboardBackspace className='text-white cursor-pointer w-[25px] h-[25px]' />
        </div>
        <div className='font-semibold text-[20px]'>{profileData?.username}</div>
        <div></div>
      </div>

      {/* Profile Info Section */}
      <div className='w-full h-[150px] flex items-start gap-[20px] lg:gap-[50px] pt-[20px] px-[10px] justify-center'>
        <div className='w-[80px] h-[80px] md:w-[140px] md:h-[140px] border-2 border-black rounded-full cursor-pointer overflow-hidden'>
          <img src={profileData?.profilePicture || defaultDp} alt="" className='w-full h-full object-cover' />
        </div>
        <div>
          <div className='font-semibold text-[22px] text-white'>{profileData?.username}</div>
          <div className='text-[17px] text-[#ffffffe8]'>{profileData?.emailId}</div>
          <div className='text-[17px] text-[#ffffffe8]'>{profileData?.bio || "No bio yet"}</div>
        </div>
      </div>

      {/* Stats Section */}
      <div className='w-full h-[100px] flex items-center justify-center gap-[40px] md:gap-[60px] px-[20%] pt-[30px] text-white'>
        <div>
          <div className='text-white text-[22px] md:text-[30px] font-semibold'>{posts.length}</div>
          <div className='text-[18px] md:text-[22px] text-[#ffffffc7]'>Posts</div>
        </div>
        <div>
          <div className='flex items-center justify-center gap-[20px]'>
            <div className='text-white text-[22px] md:text-[30px] font-semibold'>
              {profileData?.followers?.length || 0}
            </div>
          </div>
          <div className='text-[18px] md:text-[22px] text-[#ffffffc7]'>Followers</div>
        </div>
        <div>
          <div className='flex items-center justify-center gap-[20px]'>
            <div className='text-white text-[22px] md:text-[30px] font-semibold'>
              {profileData?.following?.length || 0}
            </div>
          </div>
          <div className='text-[18px] md:text-[22px] text-[#ffffffc7]'>Following</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className='w-full h-[80px] flex justify-center items-center gap-[20px] mt-[10px]'>
        {isOwnProfile ? (
          <button 
            className='px-[10px] min-w-[150px] py-[5px] h-[40px] bg-[white] cursor-pointer rounded-2xl font-semibold' 
            onClick={() => navigate("/editprofile")}
          >
            Edit Profile
          </button>
        ) : (
          <>
            <button
              onClick={handleFollow}
              disabled={followingLoading || blocking}
              className='px-[10px] min-w-[150px] py-[5px] h-[40px] bg-[white] cursor-pointer rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {followingLoading ? (
                <ClipLoader size={16} color="black" />
              ) : isFollowing ? (
                "Following"
              ) : (
                "Follow"
              )}
            </button>
            <button
              onClick={handleBlock}
              disabled={blocking || followingLoading}
              className='px-[10px] min-w-[150px] py-[5px] h-[40px] bg-red-600 text-white cursor-pointer rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {blocking ? (
                <ClipLoader size={16} color="white" />
              ) : user?.blockedUsers?.some(
                (blockedId) => blockedId.toString() === profileData?._id
              ) ? (
                "Unblock"
              ) : (
                "Block"
              )}
            </button>
          </>
        )}
      </div>

      {/* Posts Section */}
      <div className='w-full min-h-[100vh] flex justify-center'>
        <div className='w-full max-w-[900px] flex flex-col items-center rounded-t-[30px] bg-white relative gap-[20px] pt-[30px] pb-[100px]'>
          {isOwnProfile && (
            <div className='w-[90%] max-w-[500px] h-[80px] bg-[white] rounded-full flex justify-center items-center gap-[10px]'>
              <div 
                className={`${postType == "posts" ? "bg-black text-white shadow-2xl shadow-black" : ""} w-[50%] h-[80%] flex justify-center items-center text-[19px] font-semibold hover:bg-black rounded-full hover:text-white cursor-pointer hover:shadow-2xl hover:shadow-black transition-all`} 
                onClick={() => setPostType("posts")}
              >
                Posts
              </div>
              <div 
                className={`${postType == "blocked" ? "bg-black text-white shadow-2xl shadow-black" : ""} w-[50%] h-[80%] flex justify-center items-center text-[19px] font-semibold hover:bg-black rounded-full hover:text-white cursor-pointer hover:shadow-2xl hover:shadow-black transition-all`} 
                onClick={() => setPostType("blocked")}
              >
                Blocked Users
              </div>
            </div>
          )}

          {/* Posts List or Blocked Users List */}
          {postType === "posts" ? (
            <div className='w-full flex flex-col items-center gap-4'>
              {posts.length === 0 ? (
                <p className='text-gray-500 text-lg'>No posts yet</p>
              ) : (
                posts.map((post) => (
                  <div key={post._id} className='w-[90%] max-w-[600px] bg-white border-2 border-gray-200 rounded-2xl p-4'>
                    {post.image && (
                      <img src={post.image} alt="Post" className='w-full rounded-lg mb-3' />
                    )}
                    <p className='text-gray-800'>{post.content}</p>
                    <div className='mt-3 flex items-center gap-4 text-gray-600'>
                      <span>❤️ {post.likesCount || 0}</span>
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className='w-full flex flex-col items-center gap-4'>
              {loadingBlockedUsers ? (
                <div className='flex justify-center py-8'>
                  <ClipLoader size={40} color="#3b82f6" />
                </div>
              ) : blockedUsers.length === 0 ? (
                <p className='text-gray-500 text-lg'>No blocked users</p>
              ) : (
                blockedUsers.map((blockedUser) => (
                  <div key={blockedUser._id} className='w-[90%] max-w-[600px] bg-white border-2 border-gray-200 rounded-2xl p-4 flex items-center justify-between'>
                    <div className='flex items-center gap-4'>
                      <div className='w-12 h-12 rounded-full overflow-hidden border-2 border-gray-300'>
                        <img
                          src={blockedUser.profilePicture || defaultDp}
                          alt={blockedUser.username}
                          className='w-full h-full object-cover'
                        />
                      </div>
                      <div>
                        <p className='font-semibold text-gray-800'>{blockedUser.username}</p>
                        <p className='text-sm text-gray-500'>{blockedUser.emailId}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnblock(blockedUser._id, blockedUser.username)}
                      className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold'
                    >
                      Unblock
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile

