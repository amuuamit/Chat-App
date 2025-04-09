import React from "react";
import UserList from "./UserList.jsx";
import { useAuth } from "../context/authProvider.jsx";
import { Link } from "react-router-dom";
import { TbLogout2 } from "react-icons/tb";

const ChatSidebar = ({ onUserSelect }) => {
  const { authUser, setAuthUser } = useAuth();

  const handleLogout = () => {
    setAuthUser(null);
    localStorage.removeItem("messanger");
    document.cookie = "jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = "/login";
  };

  return (
    <div className="w-full border-r border-gray-700 p-4">
      <h2 className="text-2xl font-semibold text-white mb-4">
        What's<span className="text-blue-500">Chat</span>
      </h2>
      {/* Profile and Logout Section */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700">
            {authUser?.profilePic ? (
              <img
                src={authUser.profilePic}
                alt={authUser.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full text-white font-bold">
                {authUser?.name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{authUser?.name}</p>
            <p className="text-xs text-gray-400">{authUser?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700"
        >
          <TbLogout2 size={20} />
          Logout
        </button>
      </div>
      <UserList onUserSelect={onUserSelect} />
    </div>
  );
};

export default ChatSidebar;
