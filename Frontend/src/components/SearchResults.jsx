import { useAuth } from "../context/authProvider.jsx";
import { useNavigate } from "react-router-dom";
import { useChat } from "../context/chatProvider.jsx";
import { toast } from "react-hot-toast";

const SearchResults = ({ results, onUserSelect }) => {
  const { authUser } = useAuth();
  const navigate = useNavigate();
  const { createChat, chats } = useChat();

  const handleUserClick = async (user) => {
    try {
      // Check if a chat already exists with this user
      const existingChat = chats.find(
        (chat) =>
          !chat.isGroupChat && chat.users.some((u) => u._id === user._id)
      );

      if (existingChat) {
        // If chat exists, notify parent component and show success message
        if (onUserSelect) {
          onUserSelect(existingChat);
        }
        toast.success(`Chatting with ${user.name}`);
      } else {
        // Create a new chat if none exists
        const chat = await createChat(user._id);
        if (onUserSelect) {
          onUserSelect(chat);
        }
        toast.success(`Started chatting with ${user.name}`);
      }
    } catch (error) {
      console.error("Error creating/accessing chat:", error);
      toast.error("Failed to start chat. Please try again.");
    }
  };

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 bg-gray-800 rounded-lg shadow-lg max-h-96 overflow-y-auto">
      {results.map((user) => (
        <div
          key={user._id}
          onClick={() => handleUserClick(user)}
          className="flex items-center p-3 hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden">
            {user.profilePic ? (
              <img
                src={user.profilePic}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white text-lg">
                {user.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-white font-medium truncate">{user.name}</p>
            <p className="text-gray-400 text-sm truncate">{user.email}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SearchResults;
