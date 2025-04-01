import { Flame, MoreVertical, PlusCircle, UsersRound, X } from "lucide-react";
import { useAuthStore } from "../global/useAuthStore";
import { useMessageStore } from "../global/useMessageStore";
import { useState } from "react";
import axios from "axios";

const ChatHeader = ({
  generateSummary,
  checkedMessages,
  setCheckedMessages,
  isChecked,
  setIsChecked,
  setAddUsers,
  addUsers,
}) => {
  const {
    users,
    selectedUser,
    setSelectedUser,
    selectedGroup,
    setSelectedGroup,
  } = useMessageStore();
  
  const { onlineUsers, authUser } = useAuthStore();
  const [btnDisable, setBtnDisable] = useState(true);
  
   if (!selectedUser && !selectedGroup) {
    return null;
  }

  let title = "";
  let subtitle = "";
  let avatarSrc = "/avatar.png";

  const handleToggleUser = (user) => {
    setAddUsers((prev) => {
      let updatedUsers;
      if (prev.some((u) => u._id === user._id)) {
        updatedUsers = prev.filter((u) => u._id !== user._id);
        console.log("removeUsers");
      } else {
        updatedUsers = [...prev, user];
        console.log("addUsers");
      }
      setBtnDisable(updatedUsers.length === 0);
  
      return updatedUsers;
    });
  };
  
  const handleAddMembers = async () => {
    if (!selectedGroup || addUsers.length === 0) return;
  
    try {
      const { data } = await axios.post(
        `/api/groups/${selectedGroup._id}/addMembers`,
        {
          userIds: addUsers.map(user => user._id),
        },
        { withCredentials: true }
      );
  
      setSelectedGroup(data);
      setAddUsers([]); 
      document.getElementById("my_modal_2").close();
      setTimeout(() => {
        window.location.reload();
      }, 500);
      console.log("Members added successfully");
  
    } catch (error) {
      console.error("Error adding members:", error);
    }
  };
  

  const handleCheck = () => {
    setIsChecked((prev) => !prev);
    setCheckedMessages([]);
  };

  const handleClose = () => {
    setSelectedUser(null);
    setSelectedGroup(null);
    setIsChecked(false);
    setCheckedMessages([]);
  };

  if (selectedGroup) {
    title = selectedGroup.name;
    const membersCount = selectedGroup.members?.length || 0;
    subtitle = `${membersCount} member${membersCount !== 1 ? "s" : ""}`;
  } else if (selectedUser) {
    title = selectedUser.fullName;
    subtitle = onlineUsers.includes(selectedUser._id) ? "Online" : "Offline";
    avatarSrc = selectedUser.profilePic || "/avatar.png";
  }

  return (
    <div className="p-2 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              {selectedGroup ? (
                <UsersRound className="rounded-full bg-gray-500 bg-opacity-40 w-10 h-auto p-1" />
              ) : (
                <img src={avatarSrc} alt={title} />
              )}
            </div>
          </div>
          <div>
            <h3 className="font-medium">{title}</h3>
            <p className="text-sm text-base-content/70">{subtitle}</p>
          </div>
        </div>
        <div className="flex gap-1">
          {selectedGroup && (
            <button
              onClick={generateSummary}
              disabled={checkedMessages.length < 2}
              className="btn w-12 p-0 btn-warning "
            >
              {checkedMessages.length >= 2 ? <img src="animated_flame.gif" alt="flame" className="w-10 h-10 -translate-y-1.5" /> : <Flame />}
            </button>
          )}
          {selectedGroup && (
            <div className="dropdown dropdown-bottom dropdown-end">
              <div tabIndex={0} role="button" className="btn p-0 w-12">
                <MoreVertical />
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content menu bg-base-100 rounded-box z-[1] max-h-96 border border-gray-600 w-52 overflow-auto p-2 shadow"
              >
                <div className="form-control bg-pink-950 bg-opacity-15 p-0.5 rounded-md">
                  <label className="label cursor-pointer">
                    <span className="font-bold -translate-x-0.5">
                      Select Messages
                    </span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={handleCheck}
                      className="checkbox checkbox-primary"
                    />
                  </label>
                </div>
                <div className="bg-pink-950 bg-opacity-15 p-0.5 rounded-md mt-2">
                  <span className="flex items-center justify-between">
                    <span className="font-semibold">Group Members:</span>
                    <button
                      onClick={() => {
                        document.getElementById("my_modal_2").showModal();
                      }}
                      className="btn-outline -translate-x-1 rounded-full"
                    >
                      <PlusCircle />
                    </button>
                    <dialog
                      id="my_modal_2"
                      className="modal modal-bottom sm:modal-middle"
                    >
                      <div className="modal-box overflow-auto !max-h-1/2 sm:!w-1/3 !w-full text-white">
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-xl">New Members</div>
                          <div>
                            <button
                              className="btn rounded-md px-2 py-3 bg-opacity-40"
                              disabled={btnDisable}
                              onClick={handleAddMembers}
                            >
                              Add
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="py-1 w-full">
                            {([...users, authUser]
                              .filter(
                                (user) =>
                                  !selectedGroup.members
                                    .map((member) => member._id)
                                    .includes(user._id)
                              ).length>0 )?
                              [...users, authUser]
                              .filter(
                                (user) =>
                                  !selectedGroup.members
                                    .map((member) => member._id)
                                    .includes(user._id)
                              ).map((user) => (
                                <div
                                  key={user._id}
                                  className="flex items-center gap-2 py-1 justify-between"
                                >
                                  <span className="text-lg">
                                    ~{user.fullName}
                                  </span>
                                  <div className="form-control">
                                    <label className="label cursor-pointer">
                                      <input
                                        type="checkbox"
                                        className="checkbox checkbox-primary"
                                        checked={addUsers?.some(
                                          (u) => u._id === user._id
                                        )}
                                        onChange={() => handleToggleUser(user)}
                                      />
                                    </label>
                                  </div>
                                </div>
                              )):"No contacts available"}
                          </div>
                        </div>
                      </div>
                      <form method="dialog" className="modal-backdrop">
                        <button>c</button>
                      </form>
                    </dialog>
                  </span>
                  {selectedGroup.members.map((member) => (
                    <p
                      key={member._id}
                      className="whitespace-nowrap btn-outline p-1 rounded-md"
                    >
                      ~{member.fullName}
                    </p>
                  ))}
                </div>
              </ul>
            </div>
          )}
          <button onClick={handleClose} className="btn w-12 p-0">
            <X />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
