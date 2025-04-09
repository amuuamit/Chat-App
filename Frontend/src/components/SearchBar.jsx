import { useState, useEffect } from "react";
import { useAuth } from "../context/authProvider.jsx";
import axios from "axios";
import { server } from "../main.jsx";
import { toast } from "react-hot-toast";
import SearchResults from "./SearchResults.jsx";

const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const { authUser } = useAuth();

  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const { data } = await axios.get(
          `${server}/user/search?query=${encodeURIComponent(searchQuery)}`,
          {
            headers: {
              Authorization: `Bearer ${authUser?.token}`,
            },
          }
        );
        setResults(data);
      } catch (error) {
        console.error("Error searching users:", error);
        toast.error("Failed to search users");
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, authUser?.token]);

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="relative z-10">
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          </div>
        )}
      </div>
      <div className="absolute w-full">
        <SearchResults results={results} />
      </div>
    </div>
  );
};

export default SearchBar;
