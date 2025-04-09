import React from "react";
import { TbLogout2 } from "react-icons/tb";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { useAuth } from "../context/authProvider.jsx";

const Logout = () => {
  const { setAuthUser } = useAuth(); // Get the authentication setter
  const navigate = useNavigate(); // Hook for navigation

  const handleLogout = () => {
    // Clear authentication state and storage
    setAuthUser(null);
    localStorage.removeItem("messanger");
    Cookies.remove("jwt");

    // Redirect to login page
    navigate("/login");
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 bg-slate-950 text-white px-4 py-2 rounded hover:bg-red-600 transition duration-200"
      title="Logout"
    >
      <TbLogout2 className="text-2xl" />
      <span className="hidden md:inline">Logout</span>
    </button>
  );
};

export default Logout;
