import React, { useState, useRef } from 'react'
import { MdOutlineKeyboardBackspace } from "react-icons/md";
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { ClipLoader } from 'react-spinners';
import axiosClient from '../utils/axios';
import { updateUserProfile } from '../store/authSlice';
import { toast } from 'react-hot-toast';

function EditProfile() {
  const { user } = useSelector((state) => state.authSlice)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const imageInput = useRef()
  
  const [frontendImage, setFrontendImage] = useState(user?.profilePicture || "https://via.placeholder.com/150")
  const [backendImage, setBackendImage] = useState(null)
  const [bio, setBio] = useState(user?.bio || "")
  const [loading, setLoading] = useState(false)

  const handleImage = (e) => {
    const file = e.target.files[0]
    if (file) {
      setBackendImage(file)
      setFrontendImage(URL.createObjectURL(file))
    }
  }

  const handleEditProfile = async () => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("bio", bio)
      
      if (backendImage) {
        formData.append("profilePicture", backendImage)
      }

      const result = await axiosClient.put("/api/auth/profile", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      // Update Redux state
      dispatch(updateUserProfile({
        bio: result.data.user.bio,
        profilePicture: result.data.user.profilePicture
      }))

      toast.success("Profile updated successfully!")
      setLoading(false)
      navigate("/profile")
    } catch (error) {
      console.log(error)
      toast.error(error.response?.data?.message || "Failed to update profile")
      setLoading(false)
    }
  }

  return (
    <div className='w-full min-h-[100vh] bg-black flex items-center flex-col gap-[20px]'>
      {/* Header */}
      <div className='w-full h-[80px] flex items-center gap-[20px] px-[20px]'>
        <MdOutlineKeyboardBackspace 
          className='text-white cursor-pointer w-[25px] h-[25px]' 
          onClick={() => navigate("/profile")} 
        />
        <h1 className='text-white text-[20px] font-semibold'>Edit Profile</h1>
      </div>

      {/* Profile Picture */}
      <div 
        className='w-[80px] h-[80px] md:w-[100px] md:h-[100px] border-2 border-gray-700 rounded-full cursor-pointer overflow-hidden' 
        onClick={() => imageInput.current.click()}
      >
        <input 
          type='file' 
          accept='image/*' 
          ref={imageInput} 
          hidden 
          onChange={handleImage} 
        />
        <img src={frontendImage} alt="Profile" className='w-full h-full object-cover' />
      </div>

      <div 
        className='text-blue-500 text-center text-[18px] font-semibold cursor-pointer' 
        onClick={() => imageInput.current.click()}
      >
        Change Your Profile Picture
      </div>

      {/* Bio Input */}
      <textarea 
        className='w-[90%] max-w-[600px] min-h-[100px] bg-[#0a1010] border-2 border-gray-700 rounded-2xl text-white font-semibold px-[20px] py-[15px] outline-none resize-none' 
        placeholder='Bio (max 200 characters)' 
        onChange={(e) => setBio(e.target.value)} 
        value={bio}
        maxLength={200}
      />

      {/* Save Button */}
      <button 
        className='px-[10px] w-[60%] max-w-[400px] py-[5px] h-[50px] bg-[white] cursor-pointer rounded-2xl font-semibold disabled:opacity-50' 
        onClick={handleEditProfile}
        disabled={loading}
      >
        {loading ? <ClipLoader size={30} color='black' /> : "Save Profile"}
      </button>
    </div>
  )
}

export default EditProfile

