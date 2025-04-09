import React, { useState } from "react";
import server from "../../environment.js";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const [formdata, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
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
    setSuccess("");
    setLoading(true);

    try {
      const response = await axios.post(`${server}/user/signup`, formdata, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.status === 201 || response.status === 200) {
        setSuccess("Signup successful! 🎉 Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (error) {
      console.error("Registration failed:", error);
      setError(
        error.response?.data?.message ||
          "An unexpected error occurred. Please try again."
      );
    } finally {
      setLoading(false);
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
          Create An Account
        </h2>

        {/* Error Message */}
        {error && (
          <div className="mb-4 text-red-500 bg-red-100 p-2 rounded text-center">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-4 text-green-500 bg-green-100 p-2 rounded text-center">
            {success}
          </div>
        )}

        {/* Name */}
        <label className="block mb-4">
          <span className="text-gray-300">Name</span>
          <input
            type="text"
            name="name"
            required
            placeholder="John Doe"
            minLength="3"
            maxLength="30"
            className="w-full px-3 py-2 mt-1 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={handleChange}
          />
        </label>

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
          disabled={loading}
          className="w-full px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating Account..." : "Sign Up"}
        </button>

        <p className="mt-4 text-center text-gray-400">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-blue-500 cursor-pointer hover:underline"
          >
            Log in
          </span>
        </p>
      </form>
    </div>
  );
};

export default Signup;
