import React, { useState } from 'react'
import { IoIosEye } from "react-icons/io";
import { IoIosEyeOff } from "react-icons/io";
import { ClipLoader } from "react-spinners";
import { useNavigate } from 'react-router';
import { useDispatch } from 'react-redux';
import { loginUser } from '../store/authSlice';
import { toast } from 'react-hot-toast';

function Login() {
  const [inputClicked, setInputClicked] = useState({
    emailId: false,
    password: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [emailId, setEmailId] = useState("")
  const [password, setPassword] = useState("")
  const [err, setErr] = useState("")
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const handleSignIn = async () => {
    setLoading(true)
    setErr("")
    try {
      const result = await dispatch(loginUser({ emailId, password })).unwrap()
      toast.success("Login successful!")
      navigate("/")
    } catch (error) {
      setErr(error || "Login failed")
      toast.error(error || "Login failed")
      setLoading(false)
    }
  }

  return (
    <div className='w-full h-screen bg-gradient-to-b from-black to-gray-900 flex flex-col justify-center items-center'>
      <div className='w-[90%] lg:max-w-[60%] h-[600px] bg-white rounded-2xl flex justify-center items-center overflow-hidden border-2 border-[#1a1f23]'>
        <div className='w-full lg:w-[50%] h-full bg-white flex flex-col items-center justify-center p-[10px] gap-[20px]'>

          <div className='flex gap-[10px] items-center text-[20px] font-semibold mt-[40px]'>
            <span>Sign In to </span>
            <span className='text-blue-600 font-bold'>Social</span>
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

          {err && <p className='text-red-500'>{err}</p>}

          <button className='w-[70%] px-[20px] py-[10px] bg-black text-white font-semibold h-[50px] cursor-pointer rounded-2xl mt-[30px] disabled:opacity-50' onClick={handleSignIn} disabled={loading}>
            {loading ? <ClipLoader size={30} color='white' /> : "Sign In"}
          </button>
          <p className='cursor-pointer text-gray-800' onClick={() => navigate("/signup")}>
            Want To Create A New Account ? <span className='border-b-2 border-b-black pb-[3px] text-black'>Sign Up</span>
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

export default Login
