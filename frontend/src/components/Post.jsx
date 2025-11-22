import React, { useState } from 'react'
import { GoHeart, GoHeartFill } from "react-icons/go";
import { useNavigate } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import axiosClient from '../utils/axios';
import { toast } from 'react-hot-toast';
import { FiTrash2 } from "react-icons/fi";
import { ClipLoader } from 'react-spinners';
import { authenticateUser } from '../store/authSlice';

function Post({ post, onPostUpdate, onPostDelete }) {
  const { user } = useSelector((state) => state.authSlice)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [liking, setLiking] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [following, setFollowing] = useState(false)
  
  const defaultDp = "https://via.placeholder.com/150"
  const isOwnPost = user?._id === post.author?._id
  const isLiked = post.likes?.some(id => id.toString() === user?._id?.toString()) || false
  const isFollowing = user?.following?.some(id => id.toString() === post.author?._id?.toString()) || false
  const canDelete = isOwnPost || user?.role === "admin" || user?.role === "owner"

  const handleLike = async () => {
    if (liking) return
    setLiking(true)
    try {
      const result = await axiosClient.get(`/api/posts/like/${post._id}`)
      if (onPostUpdate) {
        onPostUpdate(result.data.post)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.response?.data?.message || "Failed to like post")
    } finally {
      setLiking(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return
    }
    
    if (deleting) return
    setDeleting(true)
    try {
      await axiosClient.delete(`/api/posts/${post._id}`)
      toast.success("Post deleted successfully")
      if (onPostDelete) {
        onPostDelete(post._id)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.response?.data?.message || "Failed to delete post")
    } finally {
      setDeleting(false)
    }
  }

  const handleFollow = async () => {
    if (following) return
    setFollowing(true)
    try {
      if (isFollowing) {
        await axiosClient.delete(`/api/users/${post.author._id}/unfollow`)
        toast.success("Unfollowed successfully")
      } else {
        await axiosClient.post(`/api/users/${post.author._id}/follow`)
        toast.success("Followed successfully")
      }
      // Refresh user data to update following list
      dispatch(authenticateUser())
    } catch (error) {
      console.log(error)
      toast.error(error.response?.data?.message || "Failed to follow/unfollow")
    } finally {
      setFollowing(false)
    }
  }

  const handleProfileClick = () => {
    // Navigate to user's profile
    if (post.author?._id) {
      navigate(`/users/${post.author._id}`)
    }
  }

  return (
    <div className='w-[90%] flex flex-col gap-[10px] bg-white items-center shadow-2xl shadow-[#00000058] rounded-2xl pb-[20px]'>
      {/* Header: Profile + Follow Button */}
      <div className='w-full h-[80px] flex justify-between items-center px-[10px]'>
        <div 
          className='flex justify-center items-center md:gap-[20px] gap-[10px] cursor-pointer' 
          onClick={handleProfileClick}
        >
          <div className='w-[40px] h-[40px] md:w-[60px] md:h-[60px] border-2 border-black rounded-full overflow-hidden'>
            <img 
              src={post.author?.profilePicture || defaultDp} 
              alt="" 
              className='w-full h-full object-cover' 
            />
          </div>
          <div className='w-[150px] font-semibold truncate'>{post.author?.username}</div>
        </div>
        
        {!isOwnPost && (
          <button
            onClick={handleFollow}
            disabled={following}
            className='px-[10px] min-w-[60px] md:min-w-[100px] py-[5px] h-[30px] md:h-[40px] bg-[black] text-white rounded-2xl text-[14px] md:text-[16px] font-semibold disabled:opacity-50'
          >
            {following ? (
              <ClipLoader size={12} color="white" />
            ) : isFollowing ? (
              "Following"
            ) : (
              "Follow"
            )}
          </button>
        )}
      </div>

      {/* Post Image */}
      {post.image && (
        <div className='w-[90%] flex items-center justify-center'>
          <img 
            src={post.image} 
            alt="Post" 
            className='w-[80%] rounded-2xl object-cover' 
          />
        </div>
      )}

      {/* Action Bar: Like + Delete */}
      <div className='w-full h-[60px] flex justify-between items-center px-[20px] mt-[10px]'>
        <div className='flex justify-center items-center gap-[10px]'>
          <div className='flex justify-center items-center gap-[5px]'>
            {liking ? (
              <ClipLoader size={20} color="#000" />
            ) : isLiked ? (
              <GoHeartFill 
                className='w-[25px] cursor-pointer h-[25px] text-red-600' 
                onClick={handleLike}
              />
            ) : (
              <GoHeart 
                className='w-[25px] cursor-pointer h-[25px]' 
                onClick={handleLike}
              />
            )}
            <span>{post.likesCount || 0}</span>
          </div>
        </div>
        
        {canDelete && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className='flex items-center gap-2 text-red-600 hover:text-red-700 disabled:opacity-50'
          >
            {deleting ? (
              <ClipLoader size={16} color="#dc2626" />
            ) : (
              <>
                <FiTrash2 className='w-[20px] h-[20px]' />
                <span className='text-sm'>Delete</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Post Content */}
      {post.content && (
        <div className='w-full px-[20px] gap-[10px] flex justify-start items-center'>
          <h1 className='font-semibold mr-2'>{post.author?.username}</h1>
          <div className='flex-1'>{post.content}</div>
        </div>
      )}

      {/* Post Date */}
      <div className='w-full px-[20px] text-gray-500 text-sm'>
        {new Date(post.createdAt).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </div>
    </div>
  )
}

export default Post

