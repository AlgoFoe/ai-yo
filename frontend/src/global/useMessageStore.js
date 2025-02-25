import { create } from "zustand";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";
import axios from "axios";

// Create an axios instance
const axiosCall = axios.create({
  baseURL:
    import.meta.env.MODE === "development"
      ? "http://localhost:4000/api"
      : "/api",
  withCredentials: true,
});

export const useMessageStore = create((set, get) => ({
  messages: [],                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           
  users: [],
  groups: [],
  selectedUser: null,
  selectedGroup: null,

  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosCall.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true, messages: [] });
    try {
      const res = await axiosCall.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    if (!selectedUser) return;
    try {
      const res = await axiosCall.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to send message");
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
      const isMessageFromSelectedUser = newMessage.senderId === selectedUser._id
        || newMessage.receiverId === selectedUser._id; 
      if (!isMessageFromSelectedUser) return;

      set({ messages: [...get().messages, newMessage] });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newMessage");
    }
  },

  getGroups: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosCall.get("/groups");
      set({ groups: res.data });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch groups");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getGroupMessages: async (groupId) => {
    set({ isMessagesLoading: true, messages: [] });
    try {
      const res = await axiosCall.get(`/groups/${groupId}`);
      set({ messages: res.data.messages || [] });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch group messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendGroupMessage: async ({ groupId, text, image }) => {
    const { messages } = get();
    try {
      const res = await axiosCall.post(`/groups/${groupId}/messages`, {
        text,
        image,
      });
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to send group message (image size too large)");
    }
  },

  subscribeToGroupMessages: (groupId) => {
    const socket = useAuthStore.getState().socket;
    if (!socket || !groupId) return;

    socket.emit("joinGroup", groupId);

    socket.on("groupMessage", (newMessage) => {
      const { selectedGroup, messages } = get();
      if (!selectedGroup || selectedGroup._id !== newMessage.group) return;

      set({ messages: [...messages, newMessage] });
    });
  },

  unsubscribeFromGroupMessages: (groupId) => {
    const socket = useAuthStore.getState().socket;
    if (!socket || !groupId) return;

    socket.emit("leaveGroup", groupId);
    socket.off("groupMessage");
  },

  setSelectedUser: (user) => {
    set({
      selectedUser: user,
      selectedGroup: null,
      messages: [],
    });
  },

  setSelectedGroup: (group) => {
    set({
      selectedGroup: group,
      selectedUser: null,
      messages: [],
    });
  },
}));
