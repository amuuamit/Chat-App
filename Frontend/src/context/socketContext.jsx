import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import server from "../../environment";
const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(server, {
      withCredentials: true,
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      forceNew: true,
      autoConnect: true,
    });

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
      setIsConnected(true);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
