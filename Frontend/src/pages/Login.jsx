import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/authProvider.jsx";
import server from "../../environment.js";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [formdata, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const { setAuthUser } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formdata,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // console.log("Attempting login...");
      const response = await axios.post(`${server}/user/login`, formdata, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Login response:", response.data);

      if (response.status === 200 || response.status === 201) {
        const { user, token } = response.data;
        // console.log("User data:", user);
        // console.log("Token:", token);

        const authData = {
          ...user,
          token,
        };

        console.log("Auth data to be stored:", authData);

        // Save to localStorage
        localStorage.setItem("messanger", JSON.stringify(authData));

        // Update auth context
        setAuthUser(authData);

        // Redirect to home
        navigate("/");
      }
    } catch (error) {
      console.error("Login failed", error);
      setError(error.response?.data?.message || "Invalid email or password.");
    }
  };

  return (
    <div className="w-full flex h-screen items-center justify-center bg-gray-900">
      <form
        className="p-6 bg-gray-800 text-white rounded-lg shadow-lg w-96"
        onSubmit={handleSubmit}
      >
        <h1 className="text-3xl font-semibold text-center mb-4">What's Chat</h1>
        <h2 className="text-xl font-semibold text-center mb-4">
          Login to Your Account
        </h2>

        {/* Error Message */}
        {error && (
          <div className="mb-4 text-red-500 text-center bg-red-100 p-2 rounded">
            {error}
          </div>
        )}

        {/* Email */}
        <label className="block mb-4">
          <span className="text-gray-300">Email</span>
          <input
            type="email"
            name="email"
            required
            placeholder="mail@site.com"
            className="w-full px-3 py-2 mt-1 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={handleChange}
          />
        </label>

        {/* Password */}
        <label className="block mb-4">
          <span className="text-gray-300">Password</span>
          <input
            type="password"
            name="password"
            required
            placeholder="••••••••"
            minLength="8"
            pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
            title="Must include a number, lowercase, and uppercase letter."
            className="w-full px-3 py-2 mt-1 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={handleChange}
          />
        </label>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 transition duration-200"
        >
          Log In
        </button>

        <p className="p-6 flex justify-center">
          Don't have an account?{" "}
          <span
            onClick={() => navigate("/signup")}
            className="text-blue-500 underline cursor-pointer ml-1"
          >
            Register
          </span>
        </p>
      </form>
    </div>
  );
};

export default Login;
