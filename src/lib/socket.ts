import { io, Socket } from "socket.io-client";
import { useHRMStore } from "@/stores/hrmStore";
import { useAppStore } from "@/stores/appStore";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

let socket: Socket | null = null;

export const getSocket = (): Socket | null => socket;

export const initSocket = () => {
  if (socket) return socket;
  
  const token = localStorage.getItem("token");
  const user = useAuthStore.getState().user;
  
  if (!token || !user) return null;

  socket = io("http://localhost:5000", {
    auth: { token },
  });

  socket.on("connect", () => {
    console.log("Socket.io connected to server.");
    // Join targeted user room for notification deliveries
    socket?.emit("join", user.id);
  });

  socket.on("disconnect", () => {
    console.log("Socket.io disconnected.");
  });

  // Real-time Kanban board updates
  socket.on("task:updated", () => {
    useHRMStore.getState().fetchData();
  });

  // Real-time leave status updates
  socket.on("leave:requested", () => {
    useHRMStore.getState().fetchData();
  });

  socket.on("leave:approved", () => {
    useHRMStore.getState().fetchData();
  });

  socket.on("leave:rejected", () => {
    useHRMStore.getState().fetchData();
  });

  socket.on("standup:submitted", () => {
    useHRMStore.getState().fetchData();
  });

  // Real-time announcement popups
  socket.on("announcement:created", (announcement: any) => {
    toast.info(`New Announcement: ${announcement.title}`, {
      description: announcement.content.slice(0, 80) + "..."
    });
  });

  // Targeted notification listener
  socket.on("notification:received", (notification: any) => {
    const formattedNotification = {
      id: notification.id || notification._id,
      module: notification.module || "HRM",
      color: notification.type === "success" ? "kcyan" : notification.type === "error" ? "korange" : "kgold",
      title: notification.title,
      message: notification.message,
      time: "Just now",
      read: notification.read ?? false,
      group: "today" as const,
    };
    
    // Add to notifications sidebar list in appStore
    useAppStore.setState((state) => ({
      notifications: [formattedNotification, ...state.notifications]
    }));

    // Trigger toast alert
    toast(notification.title, {
      description: notification.message,
    });
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
