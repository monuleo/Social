import React, { useState, useRef } from 'react'
import { MdOutlineKeyboardBackspace } from "react-icons/md";
import { FiPlusSquare } from "react-icons/fi";
import { useNavigate } from 'react-router';
import axiosClient from '../utils/axios';
import { ClipLoader } from 'react-spinners';
import { toast } from 'react-hot-toast';

function Upload() {
  const navigate = useNavigate()
  const [frontendImage, setFrontendImage] = useState(null)
  const [backendImage, setBackendImage] = useState(null)
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)
  const imageInput = useRef()

  const handleImage = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type (only images)
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file")
        return
      }
      setBackendImage(file)
      setFrontendImage(URL.createObjectURL(file))
    }
  }

  const handleUpload = async () => {
    // Validate content
    if (!content || content.trim().length === 0) {
      toast.error("Post content is required")
      return
    }

    if (content.length > 5000) {
      toast.error("Post content cannot exceed 5000 characters")
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("content", content.trim())
      
      if (backendImage) {
        formData.append("image", backendImage)
      }

      const result = await axiosClient.post("/api/posts/upload", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      toast.success("Post created successfully!")
      setLoading(false)
      navigate("/")
    } catch (error) {
      console.log(error)
      const errorMessage = error.response?.data?.message || "Failed to create post"
      toast.error(errorMessage)
      setLoading(false)
    }
  }

  return (
    <div className='w-full h-[100vh] bg-black flex flex-col items-center'>
      {/* Header */}
      <div className='w-full h-[80px] flex items-center gap-[20px] px-[20px]'>
        <MdOutlineKeyboardBackspace 
          className='text-white cursor-pointer w-[25px] h-[25px]' 
          onClick={() => navigate("/")} 
        />
        <h1 className='text-white text-[20px] font-semibold'>Upload Media</h1>
      </div>

      {/* Tab Selector (simplified - only Post) */}
      <div className='w-[90%] max-w-[600px] h-[80px] bg-[white] rounded-full flex justify-center items-center gap-[10px]'>
        <div className='bg-black text-white shadow-2xl shadow-black w-[28%] h-[80%] flex justify-center items-center text-[19px] font-semibold rounded-full'>
          Post
        </div>
      </div>

      {/* Upload Area - when no image selected */}
      {!frontendImage && (
        <>
          <div 
            className='w-[80%] max-w-[500px] h-[250px] bg-[#0e1316] border-gray-800 border-2 flex flex-col items-center justify-center gap-[8px] mt-[15vh] rounded-2xl cursor-pointer hover:bg-[#353a3d] transition-colors' 
            onClick={() => imageInput.current.click()}
          >
            <input 
              type="file" 
              accept="image/*" 
              hidden 
              ref={imageInput} 
              onChange={handleImage} 
            />
            <FiPlusSquare className='text-white cursor-pointer w-[25px] h-[25px]' />
            <div className='text-white text-[19px] font-semibold'>Upload Image (Optional)</div>
          </div>
          
          {/* Content Input - when no image */}
          <input 
            type='text' 
            className='w-[80%] max-w-[500px] border-b-gray-400 border-b-2 outline-none px-[10px] py-[5px] text-white mt-[30px] bg-transparent placeholder-gray-500' 
            placeholder='write caption' 
            onChange={(e) => setContent(e.target.value)} 
            value={content}
            maxLength={5000}
          />
        </>
      )}

      {/* Preview and Caption Input - when image is selected */}
      {frontendImage && (
        <div className='w-[80%] max-w-[500px] h-[250px] flex flex-col items-center justify-center mt-[15vh]'>
          <div className='w-[80%] max-w-[500px] h-[250px] flex flex-col items-center justify-center mt-[5vh]'>
            <img 
              src={frontendImage} 
              alt="" 
              className='h-[60%] rounded-2xl object-contain'
            />
            <input 
              type='text' 
              className='w-full border-b-gray-400 border-b-2 outline-none px-[10px] py-[5px] text-white mt-[20px] bg-transparent placeholder-gray-500' 
              placeholder='write caption' 
              onChange={(e) => setContent(e.target.value)} 
              value={content}
              maxLength={5000}
            />
          </div>
        </div>
      )}

      {/* Upload Button - shows when content is entered */}
      {(content.trim().length > 0 || frontendImage) && (
        <button 
          className='px-[10px] w-[60%] max-w-[400px] py-[5px] h-[50px] bg-[white] mt-[50px] cursor-pointer rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed' 
          onClick={handleUpload}
          disabled={loading || !content.trim()}
        >
          {loading ? <ClipLoader size={30} color='black' /> : "Upload Post"}
        </button>
      )}
    </div>
  )
}

export default Upload

