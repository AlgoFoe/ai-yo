// import { create } from "zustand";
// import toast from "react-hot-toast";
// import { useAuthStore } from "./useAuthStore";
// import axios from "axios";

// const axiosCall = axios.create({
//   baseURL: import.meta.env.MODE === "development" ? "http://localhost:4000/api" : "/api",
//   withCredentials: true,
// });

// export const useMessageStore = create((set, get) => ({
//   messages: [],
//   users: [],
//   groups: [],
//   selectedUser: null,
//   isUsersLoading: false,
//   isMessagesLoading: false,

//   getUsers: async () => {
//     set({ isUsersLoading: true });
//     try {
//       const res = await axiosCall.get("/messages/users");
//       set({ users: res.data });
//     } catch (error) {
//       toast.error(error.response.data.message);
//     } finally {
//       set({ isUsersLoading: false });
//     }
//   },

//   getGroups: async () => {
//     set({ isUsersLoading: true });
//     try {
//       const res = await axiosCall.get("/groups");
//       set({ groups: res.data });
//     } catch (error) {
//       toast.error(error.response.data.message);
//     } finally {
//       set({ isUsersLoading: false });
//     }
//   },

//   getMessages: async (userId) => {
//     set({ isMessagesLoading: true });
//     try {
//       const res = await axiosCall.get(`/messages/${userId}`);
//       set({ messages: res.data });
//     } catch (error) {
//       toast.error(error.response.data.message);
//     } finally {
//       set({ isMessagesLoading: false });
//     }
//   },
//   sendMessage: async (messageData) => {
//     const { selectedUser, messages } = get();
//     try {
//       const res = await axiosCall.post(`/messages/send/${selectedUser._id}`, messageData);
//       set({ messages: [...messages, res.data] });
//     } catch (error) {
//       toast.error(error.response.data.message);
//     }
//   },

//   subscribeToMessages: () => {
//     const { selectedUser } = get();
//     if (!selectedUser) return;

//     const socket = useAuthStore.getState().socket;

//     socket.on("newMessage", (newMessage) => {
//       const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
//       if (!isMessageSentFromSelectedUser) return;

//       set({
//         messages: [...get().messages, newMessage],
//       });
//     });
//   },

//   unsubscribeFromMessages: () => {
//     const socket = useAuthStore.getState().socket;
//     socket.off("newMessage");
//   },

//   // For group chat
//   getGroupMessages: async (groupId) => {
//     // fetch from /groups/:groupId or a dedicated /groups/:groupId/messages
//   },
//   subscribeToGroupMessages: (groupId) => { /* socket.emit("joinGroup", groupId) etc. */ },
//   unsubscribeFromGroupMessages: (groupId) => { /* socket.emit("leaveGroup", groupId) etc. */ },

//   setSelectedUser: (selectedUser) => set({ selectedUser }),
//   selectedGroup: null,
//   setSelectedGroup: (group) => set({ selectedGroup: group }),
// }));


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
  // ───────────── STATE ─────────────
  messages: [],                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           
  users: [],
  groups: [],
  selectedUser: null,
  selectedGroup: null,

  isUsersLoading: false,
  isMessagesLoading: false,

  // ───────────── 1) DIRECT CHAT ─────────────
  // Fetch user list
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

  // Fetch 1-to-1 messages
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

  // Send a 1-to-1 message
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

  // Socket subscription for new 1-to-1 messages
  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    // Listen for "newMessage" events
    socket.on("newMessage", (newMessage) => {
      // Only add message if it matches the currently selected user
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

  // ───────────── 2) GROUP CHAT ─────────────
  // Fetch groups the user is in
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

  // Fetch messages for a specific group
  getGroupMessages: async (groupId) => {
    set({ isMessagesLoading: true, messages: [] });
    try {
      // You can either fetch from GET /groups/:groupId 
      // (where group contains its "messages" field)
      const res = await axiosCall.get(`/groups/${groupId}`);
      // Assuming res.data = { _id, name, members, messages: [...] }
      // We only need messages
      set({ messages: res.data.messages || [] });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch group messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // Send a message to a group
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

  // Join group room in Socket.io & listen for "groupMessage" event
  subscribeToGroupMessages: (groupId) => {
    const socket = useAuthStore.getState().socket;
    if (!socket || !groupId) return;

    // Ask server to join the group room
    socket.emit("joinGroup", groupId);

    // Listen for new group messages
    socket.on("groupMessage", (newMessage) => {
      // Only add the message if it belongs to the selected group
      const { selectedGroup, messages } = get();
      if (!selectedGroup || selectedGroup._id !== newMessage.group) return;

      set({ messages: [...messages, newMessage] });
    });
  },

  // Leave group room & stop listening
  unsubscribeFromGroupMessages: (groupId) => {
    const socket = useAuthStore.getState().socket;
    if (!socket || !groupId) return;

    socket.emit("leaveGroup", groupId);
    socket.off("groupMessage");
  },

  // ───────────── SETTERS ─────────────
  setSelectedUser: (user) => {
    set({
      selectedUser: user,
      // Optional: clear out any selected group
      selectedGroup: null,
      messages: [],
    });
  },

  setSelectedGroup: (group) => {
    set({
      selectedGroup: group,
      // Optional: clear out any selected user
      selectedUser: null,
      messages: [],
    });
  },
}));
