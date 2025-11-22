import React, { useState } from 'react'
import { IoIosEye } from "react-icons/io";
import { IoIosEyeOff } from "react-icons/io";
import { ClipLoader } from "react-spinners";
import { useNavigate } from 'react-router';
import { useDispatch } from 'react-redux';
import { registerUser } from '../store/authSlice';
import { toast } from 'react-hot-toast';

function SignUp() {
  const [inputClicked, setInputClicked] = useState({
    username: false,
    emailId: false,
    password: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [username, setUsername] = useState("")
  const [err, setErr] = useState("")
  const [emailId, setEmailId] = useState("")
  const [password, setPassword] = useState("")
  const [bio, setBio] = useState("")
  const [role, setRole] = useState("user")
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const handleSignUp = async () => {
    setLoading(true)
    setErr("")

    try {
      const userData = {
        emailId,
        username,
        password,
        bio: bio || undefined,
        role: role
      }
      const result = await dispatch(registerUser(userData)).unwrap()
      toast.success("Account created successfully!")
      navigate("/")
    } catch (error) {
      setErr(error || "Sign up failed")
      toast.error(error || "Sign up failed")
      setLoading(false)
    }
  }

  return (
    <div className='w-full h-screen bg-gradient-to-b from-black to-gray-900 flex flex-col justify-center items-center'>
      <div className='w-[90%] lg:max-w-[60%] h-[600px] bg-white rounded-2xl flex justify-center items-center overflow-hidden border-2 border-[#1a1f23]'>
        <div className='w-full lg:w-[50%] h-full bg-white flex flex-col items-center p-[10px] gap-[20px] overflow-y-auto'>

          <div className='flex gap-[10px] items-center text-[20px] font-semibold mt-[40px]'>
            <span>Sign Up to </span>
            <span className='text-blue-600 font-bold'>Social</span>
          </div>

          <div className='relative flex items-center justify-start w-[90%] h-[50px] rounded-2xl mt-[30px] border-2 border-black' onClick={() => setInputClicked({ ...inputClicked, username: true })}>
            <label htmlFor='username' className={`text-gray-700 absolute left-[20px] p-[5px] bg-white text-[15px] transition-all ${inputClicked.username ? "top-[-15px]" : ""}`}> Enter Username</label>
            <input type="text" id='username' className='w-[100%] h-[100%] rounded-2xl px-[20px] outline-none border-0' required onChange={(e) => setUsername(e.target.value)} value={username} />
          </div>

          <div className='relative flex items-center justify-start w-[90%] h-[50px] rounded-2xl border-2 border-black' onClick={() => setInputClicked({ ...inputClicked, emailId: true })}>
            <label htmlFor='emailId' className={`text-gray-700 absolute left-[20px] p-[5px] bg-white text-[15px] transition-all ${inputClicked.emailId ? "top-[-15px]" : ""}`}> Enter Email</label>
            <input type="email" id='emailId' className='w-[100%] h-[100%] rounded-2xl px-[20px] outline-none border-0' required onChange={(e) => setEmailId(e.target.value)} value={emailId} />
          </div>

          <div className='relative flex items-center justify-start w-[90%] h-[50px] rounded-2xl border-2 border-black' onClick={() => setInputClicked({ ...inputClicked, password: true })}>
            <label htmlFor='password' className={`text-gray-700 absolute left-[20px] p-[5px] bg-white text-[15px] transition-all ${inputClicked.password ? "top-[-15px]" : ""}`}> Enter password</label>
            <input type={showPassword ? "text" : "password"} id='password' className='w-[100%] h-[100%] rounded-2xl px-[20px] outline-none border-0' required onChange={(e) => setPassword(e.target.value)} value={password} />
            {!showPassword ? <IoIosEye className='absolute cursor-pointer right-[20px] w-[25px] h-[25px]' onClick={() => setShowPassword(true)} /> : <IoIosEyeOff className='absolute cursor-pointer right-[20px] w-[25px] h-[25px]' onClick={() => setShowPassword(false)} />}
          </div>

          <div className='relative flex items-center justify-start w-[90%] h-[50px] rounded-2xl border-2 border-black'>
            <label htmlFor='role' className='text-gray-700 absolute left-[20px] p-[5px] bg-white text-[15px] top-[-15px]'> Select Role</label>
            <select 
              id='role' 
              className='w-[100%] h-[100%] rounded-2xl px-[20px] outline-none border-0 bg-white cursor-pointer' 
              value={role} 
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className='relative flex items-center justify-start w-[90%] min-h-[50px] rounded-2xl border-2 border-black'>
            <label htmlFor='bio' className='text-gray-700 absolute left-[20px] p-[5px] bg-white text-[15px] top-[-15px]'> Bio (Optional)</label>
            <textarea id='bio' className='w-[100%] min-h-[50px] rounded-2xl px-[20px] py-[10px] outline-none border-0 resize-none' placeholder='Tell us about yourself' onChange={(e) => setBio(e.target.value)} value={bio} maxLength={200} />
          </div>

          {err && <p className='text-red-500'>{err}</p>}

          <button className='w-[70%] px-[20px] py-[10px] bg-black text-white font-semibold h-[50px] cursor-pointer rounded-2xl mt-[30px] disabled:opacity-50' onClick={handleSignUp} disabled={loading}>
            {loading ? <ClipLoader size={30} color='white' /> : "Sign Up"}
          </button>
          <p className='cursor-pointer text-gray-800 mb-4' onClick={() => navigate("/login")}>
            Already Have An Account ? <span className='border-b-2 border-b-black pb-[3px] text-black'>Sign In</span>
          </p>
        </div>
        <div className='md:w-[50%] h-full hidden lg:flex justify-center items-center bg-[#000000] flex-col gap-[10px] text-white text-[16px] font-semibold rounded-l-[30px] shadow-2xl shadow-black'>
          <div className='text-6xl font-bold mb-4'>Social</div>
          <p>Connect, Share, Engage</p>
        </div>
      </div>
    </div>
  )
}

export default SignUp
