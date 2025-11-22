import React from 'react'
import { GoHomeFill } from "react-icons/go";
import { FiPlusSquare } from "react-icons/fi";
import { HiOutlineFire } from "react-icons/hi";
import { HiShieldCheck } from "react-icons/hi";
import { FiLogOut } from "react-icons/fi";
import { useNavigate } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../store/authSlice';
import { toast } from 'react-hot-toast';

function Nav() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.authSlice)
  
  // Default profile picture
  const defaultDp = "https://via.placeholder.com/150"

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      toast.success("Logged out successfully!");
      navigate("/login");
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  return (
    <nav className='w-full h-[70px] bg-white border-b-2 border-gray-200 flex justify-between items-center px-6 shadow-sm fixed top-0 z-50'>
      {/* Left side - Logo/Brand */}
      <div className='flex items-center gap-4'>
        <h1 className='text-2xl font-bold text-blue-600 cursor-pointer' onClick={() => navigate("/")}>
          Social
        </h1>
      </div>

      {/* Center - Navigation Icons */}
      <div className='flex items-center gap-8'>
        <div 
          onClick={() => navigate("/")} 
          className='cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition-colors'
          title="Home"
        >
          <GoHomeFill className='text-gray-700 w-[28px] h-[28px]' />
        </div>
        
        <div 
          onClick={() => navigate("/upload")} 
          className='cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition-colors'
          title="Create Post"
        >
          <FiPlusSquare className='text-gray-700 w-[28px] h-[28px]' />
        </div>
        
        <div 
          onClick={() => navigate("/activities")} 
          className='cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition-colors'
          title="Activity Wall"
        >
          <HiOutlineFire className='text-gray-700 w-[28px] h-[28px]' />
        </div>
      </div>

      {/* Right side - Profile & Admin */}
      <div className='flex items-center gap-4'>
        {/* Admin Panel (only for admin/owner) */}
        {(user?.role === "admin" || user?.role === "owner") && (
          <div 
            onClick={() => navigate("/admin")} 
            className='cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition-colors'
            title="Admin Panel"
          >
            <HiShieldCheck className='text-gray-700 w-[28px] h-[28px]' />
          </div>
        )}
        
        {/* Logout Button */}
        <div 
          onClick={handleLogout} 
          className='cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition-colors'
          title="Logout"
        >
          <FiLogOut className='text-gray-700 w-[28px] h-[28px]' />
        </div>
        
        {/* Profile Picture */}
        <div 
          className='w-[45px] h-[45px] border-2 border-gray-300 rounded-full cursor-pointer overflow-hidden hover:border-blue-600 transition-colors' 
          onClick={() => navigate("/profile")}
          title="Profile"
        >
          <img 
            src={user?.profilePicture || defaultDp} 
            alt="Profile" 
            className='w-full h-full object-cover' 
          />
        </div>
      </div>
    </nav>
  )
}

export default Nav

