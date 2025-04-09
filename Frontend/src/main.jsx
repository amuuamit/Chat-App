import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { AuthProvider } from "./context/authProvider.jsx";
import { ChatProvider } from "./context/chatProvider.jsx";
import { SocketProvider } from "./context/socketContext.jsx";

// Server URL configuration
export const server =
  import.meta.env.VITE_SERVER_URL || "http://localhost:5002";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <ChatProvider>
        <SocketProvider>
          <App />
        </SocketProvider>
      </ChatProvider>
    </AuthProvider>
  </BrowserRouter>
);
