import { Route, Routes, Navigate } from "react-router";
import { Toaster } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { authenticateUser } from "./store/authSlice";
import Loading from "./components/Loading";
import Layout from "./pages/Layout";
import Home from "./pages/Home";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Upload from "./pages/Upload";
import Admin from "./pages/Admin";
import Activities from "./pages/Activities";

export default function App() {
  const { isAuthenticated, loading, user } = useSelector(
    (state) => state.authSlice
  );
  const dispatch = useDispatch();

  useEffect(() => {
    // Check authentication on app load/refresh
    dispatch(authenticateUser());
  }, [dispatch]);

  return (
    <>
      <Toaster position="top-right" />
      <div>
        {loading ? (
          <Loading />
        ) : (
          <Routes>
            {/* Public routes */}
            <Route
              path="/signup"
              element={
                isAuthenticated ? <Navigate to="/" /> : <SignUp />
              }
            />
            <Route
              path="/login"
              element={
                isAuthenticated ? <Navigate to="/" /> : <Login />
              }
            />
            
            {/* Protected routes with Layout (Nav) */}
            <Route
              path="/"
              element={
                isAuthenticated ? <Layout /> : <Navigate to="/login" />
              }
            >
              <Route index element={<Home />} />
              <Route path="profile" element={<Profile />} />
              <Route path="users/:id" element={<Profile />} />
              <Route path="editprofile" element={<EditProfile />} />
              <Route path="upload" element={<Upload />} />
              <Route path="activities" element={<Activities />} />
              <Route 
                path="admin" 
                element={
                  (user?.role === "admin" || user?.role === "owner") ? (
                    <Admin />
                  ) : (
                    <Navigate to="/" />
                  )
                } 
              />
            </Route>
          </Routes>
        )}
      </div>
    </>
  );
}
