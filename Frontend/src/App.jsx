import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/authProvider.jsx";
import { SocketProvider } from "./context/socketContext.jsx";
import { ChatProvider } from "./context/chatProvider.jsx";
import { Toaster } from "react-hot-toast";
import ChatPage from "./pages/ChatPage.jsx";
import Logout from "./pages/Logout.jsx";
import Signup from "./pages/Signup.jsx";
import Login from "./pages/Login.jsx";
import EditProfile from "./components/EditProfile.jsx";

const PrivateRoute = ({ children }) => {
  const { authUser } = useAuth();
  return authUser ? children : <Navigate to="/login" />;
};

const App = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <AuthProvider>
      <SocketProvider>
        <ChatProvider>
          <Toaster position="top-center" />
          <Routes>
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Navigate to="/chat" />
                </PrivateRoute>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/logout" element={<Logout />} />
            <Route
              path="/chat"
              element={
                <PrivateRoute>
                  <ChatPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/chat/:chatId"
              element={
                <PrivateRoute>
                  <ChatPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile/edit"
              element={
                <PrivateRoute>
                  <EditProfile />
                </PrivateRoute>
              }
            />
          </Routes>
        </ChatProvider>
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;
