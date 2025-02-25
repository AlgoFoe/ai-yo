import { useEffect, useRef, useState } from "react";
import { useMessageStore } from "../global/useMessageStore";
import { useAuthStore } from "../global/useAuthStore";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { formattedTime } from "../lib/utils";

import grayTick from "../../public/grayTick.svg";
import blueTick from "../../public/blueTick.svg";
import { Loader2, X } from "lucide-react";

const ChatBox = () => {
  const {
    messages,
    isMessagesLoading,
    selectedUser,
    selectedGroup,
    getMessages,
    getGroupMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
    subscribeToGroupMessages,
    unsubscribeFromGroupMessages,
  } = useMessageStore();

  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const [checkedMessages, setCheckedMessages] = useState([]);
  const [isChecked, setIsChecked] = useState(false);
  const [generating, setIsGenerating] = useState(false);
  const [response, setResponse] = useState("");
  const [addUsers, setAddUsers] = useState([]);

  useEffect(() => {
    if (!selectedUser && !selectedGroup) return;

    if (selectedUser) {
      getMessages(selectedUser._id);
      subscribeToMessages();
      return () => {
        unsubscribeFromMessages();
      };
    }

    if (selectedGroup) {
      getGroupMessages(selectedGroup._id);
      subscribeToGroupMessages(selectedGroup._id);
      return () => {
        unsubscribeFromGroupMessages(selectedGroup._id);
      };
    }
  }, [
    selectedUser,
    selectedGroup,
    getMessages,
    getGroupMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
    subscribeToGroupMessages,
    unsubscribeFromGroupMessages,
  ]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleMessageChecked = (message) => {
    setCheckedMessages((prev) => {
      const exists = prev.some((msg) => msg._id === message._id);
      let newCheckedMessages = [];

      if (exists) {
        newCheckedMessages = prev.filter((msg) => msg._id !== message._id);
      } else {
        if (prev.length > 0) {
          const messagesIds = messages.map((msg) => msg._id);
          const firstSelectedIndex = messagesIds.indexOf(prev[0]._id);
          const lastSelectedIndex = messagesIds.indexOf(
            prev[prev.length - 1]._id
          );
          const currentIndex = messagesIds.indexOf(message._id);

          if (firstSelectedIndex !== -1 && currentIndex !== -1) {
            const minIndex = Math.min(firstSelectedIndex, currentIndex);
            const maxIndex = Math.max(lastSelectedIndex, currentIndex);
            newCheckedMessages = messages
              .slice(minIndex, maxIndex + 1)
              .map((msg) => ({
                _id: msg._id,
                text: msg.text,
                time: msg.createdAt,
                senderName: selectedGroup.members.find(
                  (member) => msg.senderId === member._id
                ).fullName,
                receiver: selectedGroup._id,
                image: msg.image,
                group: selectedGroup._id,
              }));
          }
        } else {
          newCheckedMessages = [
            {
              _id: message._id,
              text: message.text,
              time: message.createdAt,
              senderName: selectedGroup.members.find(
                (member) => message.senderId === member._id
              ).fullName,
              receiver: selectedGroup._id,
              image: message.image,
              group: selectedGroup._id,
            },
          ];
        }
      }
      return newCheckedMessages;
    });
  };

  const generateSummary = async () => {
    setIsGenerating(true);
    setResponse("");
    try {
      const encodedMessages = encodeURIComponent(
        JSON.stringify(checkedMessages)
      );
      const eventSource = new EventSource(
        `http://localhost:4000/api/groups/generate?messages=${encodedMessages}`
      );

      console.log(
        "ENCODED MSG and JSON STRINGIFY CHECKED MSG:",
        encodedMessages,
        JSON.stringify(checkedMessages)
      );

      eventSource.onmessage = (event) => {
        setResponse((prev) => prev + event.data);
      };
      eventSource.onerror = (error) => {
        console.error("Error in SSE:", error);
        eventSource.close();
      };
    } catch (error) {
      console.error("Error fetching response:", error);
      alert("Error generating response.");
    }

    setIsGenerating(false);

    setIsChecked(false);
    setCheckedMessages([]);
  };

  const handleClose = () => {
    setResponse("");
    setIsGenerating(false);
  };

  if (!selectedUser && !selectedGroup) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
        <p>Select a user or group to start chatting</p>
      </div>
    );
  }

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader
          generateSummary={generateSummary}
          checkedMessages={checkedMessages}
          setCheckedMessages={setCheckedMessages}
          isChecked={isChecked}
          setIsChecked={setIsChecked}
          setAddUsers={setAddUsers}
          addUsers={addUsers}
        />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader
        generateSummary={generateSummary}
        checkedMessages={checkedMessages}
        setCheckedMessages={setCheckedMessages}
        isChecked={isChecked}
        setIsChecked={setIsChecked}
        setAddUsers={setAddUsers}
        addUsers={addUsers}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isMine = message.senderId === authUser._id;

          let avatarSrc = "/avatar.png";
          if (selectedGroup) {
            avatarSrc = isMine
              ? authUser.profilePic || "/avatar.png"
              : "/group-avatar.png";
          } else if (selectedUser) {
            avatarSrc = isMine
              ? authUser.profilePic || "/avatar.png"
              : selectedUser.profilePic || "/avatar.png";
          }

          return (
            <div
              key={message._id}
              className={`chat ${isMine ? "chat-end" : "chat-start"}`}
            >
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={
                      selectedGroup
                        ? selectedGroup.members.find(
                            (member) => message.senderId === member._id
                          )?.profilePic
                        : avatarSrc
                    }
                    alt="profile pic"
                  />
                </div>
              </div>
              <div
                className={`flex items-center justify-between w-full ${
                  checkedMessages.some((msg) => msg._id === message._id)
                    ? "bg-gray-900 bg-opacity-40 rounded-xl px-1"
                    : ""
                }`}
              >
                {isMine && (
                  <div
                    className={`form-control ${
                      isChecked && selectedGroup ? "" : "invisible"
                    }`}
                  >
                    <label className="label cursor-pointer">
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={checkedMessages.some(
                          (msg) => msg._id === message._id
                        )}
                        onChange={() => handleMessageChecked(message)}
                      />
                    </label>
                  </div>
                )}
                <div className="chat-bubble flex flex-col">
                  {message.image && (
                    <img
                      src={message.image}
                      alt="Attachment"
                      className="sm:max-w-[200px] rounded-md mb-2"
                    />
                  )}

                  {message.text && <p>{message.text}</p>}

                  <div className="flex gap-1 items-center justify-between mt-1">
                    <div className="flex items-center justify-between gap-1 w-full">
                      <span className="text-sm font-semibold opacity-50">
                        ~
                        {authUser._id === message.senderId
                          ? "You"
                          : selectedGroup
                          ? selectedGroup.members.find(
                              (member) => message.senderId === member._id
                            )?.fullName
                          : selectedUser.fullName}
                      </span>
                      <span>
                        <time className="text-xs opacity-50">
                          {formattedTime(message.createdAt)}
                        </time>
                      </span>
                    </div>
                    {isMine && !selectedGroup && (
                      <span>
                        <img
                          src={grayTick}
                          alt="tick"
                          className={`w-4 h-4 ${message.seen ? "hidden" : ""}`}
                        />
                        <img
                          src={blueTick}
                          alt="tick"
                          className={`w-4 h-4 ${message.seen ? "" : "hidden"}`}
                        />
                      </span>
                    )}
                  </div>
                </div>
                {!isMine && (
                  <div
                    className={`form-control ${
                      isChecked && selectedGroup ? "" : "invisible"
                    }`}
                  >
                    <label className="label cursor-pointer">
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={checkedMessages.some(
                          (msg) => msg._id === message._id
                        )}
                        onChange={() => handleMessageChecked(message)}
                      />
                    </label>
                  </div>
                )}
              </div>
              <div ref={messageEndRef} />
            </div>
          );
        })}
      </div>
      {response.length>1 && (
        <div className="px-5 border-t border-t-gray-950 border-opacity-50">
        {generating ? (
          <div className="flex items-center gap-2 animate-pulse">
            <Loader2 className="size-6 animate-spin" />
            <button
              onClick={handleClose}
              className="btn-outline w-6 p-0 rounded-full"
            >
              <X />
            </button>
            <p className="font-semibold">{response || "Summarizing..."}</p>
          </div>
        ) : (
          response.length > 1 && (
            <div className="flex-col items-center gap-2">
              <div className="flex items-center gap-2 justify-between">
                <p className="text-xl font-semibold">Summary</p>
                <button
                  onClick={handleClose}
                  className="btn-outline w-6 p-0 rounded-full translate-y-0.5"
                >
                  <X />
                </button>
              </div>
              <p className="font-semibold opacity-70">{response}</p>
            </div>
          )
        )}
      </div>
      )}
      <MessageInput />
    </div>
  );
};

export default ChatBox;
