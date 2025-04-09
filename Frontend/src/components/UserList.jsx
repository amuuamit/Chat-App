import React, { useState, useEffect } from "react";
import { useAuth } from "../context/authProvider.jsx";
import axios from "axios";
import { server } from "../main.jsx";
import { toast } from "react-hot-toast";

const UserList = ({ onUserSelect }) => {
  const { authUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    if (!authUser?.token) {
      console.log("No auth token available");
      setError("Please login to view users");
      setLoading(false);
      return;
    }

    try {
      console.log("Fetching users with token:", authUser.token);
      setLoading(true);
      setError(null);

      const response = await axios.get(`${server}/user/all`, {
        headers: {
          Authorization: `Bearer ${authUser.token}`,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });

      console.log("Users response:", response.data);

      if (response.data && Array.isArray(response.data)) {
        setUsers(response.data);
      } else {
        console.error("Invalid response format:", response.data);
        throw new Error("Invalid response format from server");
      }
    } catch (error) {
      console.error("Error fetching users:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config,
      });

      if (error.response?.status === 401) {
        setError("Session expired. Please login again.");
        toast.error("Session expired. Please login again.");
      } else if (error.response?.status === 403) {
        setError("You don't have permission to view users.");
        toast.error("You don't have permission to view users.");
      } else if (error.response?.status === 404) {
        setError("Users endpoint not found. Please check the server URL.");
        toast.error("Users endpoint not found.");
      } else if (error.response?.status === 500) {
        setError("Server error. Please try again later.");
        toast.error("Server error. Please try again later.");
      } else {
        const errorMessage =
          error.response?.data?.message ||
          "Failed to fetch users. Please try again.";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authUser?.token) {
      fetchUsers();
    }
  }, [authUser?.token]);

  const filteredUsers = users.filter(
    (user) =>
      user._id !== authUser?._id &&
      (user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={fetchUsers} // Retry fetching users
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-blue-500"
        />
      </div>
      <div className="space-y-2 overflow-y-auto flex-1">
        {filteredUsers.length === 0 ? (
          <p className="text-gray-400 text-center">No users found</p>
        ) : (
          filteredUsers.map((user) => (
            <div
              key={user._id}
              onClick={() => onUserSelect(user)}
              className="flex items-center p-3 hover:bg-gray-800 rounded-lg cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                {user.profilePic ? (
                  <img
                    src={user.profilePic}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                    <span className="text-white font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <p className="font-semibold">{user.name}</p>
                <p className="text-sm text-gray-400">{user.email}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserList;
