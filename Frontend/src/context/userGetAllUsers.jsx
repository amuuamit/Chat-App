import { useState, useEffect } from "react";
import axios from "axios";
import server from "../../environment";

const useGetAllUsers = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${server}/user/getUserProfile`, {
          withCredentials: true, // Include cookies in the request
        });
        console.log("Fetched users:", response.data.filteredUsers);
        setAllUsers(response.data.filteredUsers);
      } catch (error) {
        console.error(
          "Error fetching users:",
          error.response?.data?.message || error.message
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return [allUsers, loading];
};

export default useGetAllUsers;
