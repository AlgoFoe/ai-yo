import { useEffect, useState } from "react";
import { useMessageStore } from "../global/useMessageStore";
import { useAuthStore } from "../global/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import {
  MoreVertical,
  PlusSquare,
  Users,
  UsersRound,
  XSquare,
} from "lucide-react";
import axios from "axios";

const Sidebar = () => {
  const {
    getUsers,
    getGroups,
    users,
    groups,
    selectedUser,
    setSelectedUser,
    selectedGroup,
    setSelectedGroup,
    isUsersLoading,
  } = useMessageStore();

  const { onlineUsers, authUser } = useAuthStore();

  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  const [groupName, setGroupName] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState([authUser._id]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  useEffect(() => {
    getUsers();
    getGroups();
  }, [getUsers, getGroups]);

  const filteredUsers = showOnlineOnly
    ? users.filter((user) => onlineUsers.includes(user._id))
    : users;

  const handleCheckboxChange = (userId, isChecked) => {
    if (isChecked) {
      setSelectedUserIds((prev) => [...prev, userId]);
    } else {
      setSelectedUserIds((prev) => prev.filter((id) => id !== userId));
    }
  };

  const handleDeleteGroupId = async () => {
    try {
      const { data } = await axios.delete(
        `/api/groups/${selectedGroupId}`,
      );

      console.log("Group deleted:", data);

      document.getElementById("my_modal_4").close();
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("Error deleting group:", error);
    }
  };

  const handleCreateGroup = async () => {
    try {
      const { data } = await axios.post(
        "/api/groups",
        {
          name: groupName,
          members: selectedUserIds,
        },
        { withCredentials: true }
      );

      console.log("Group created:", data);

      setGroupName("");
      setSelectedUserIds([authUser._id]);

      document.getElementById("my_modal_5").close();
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("Error creating group:", error);
    }
  };

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-14 sm:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full py-[1.12rem] px-2 sm:p-[1.12rem] flex justify-between">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Contacts</span>
        </div>

        <div className="dropdown dropdown-bottom md:dropdown-end">
          <div
            tabIndex={0}
            role="button"
            className="btn-outline hover:rounded-full"
          >
            <MoreVertical />
          </div>
          <ul
            tabIndex={0}
            className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
          >
            <li>
              <div className="mt-3 lg:flex items-center gap-2">
                <label className="cursor-pointer flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showOnlineOnly}
                    onChange={(e) => setShowOnlineOnly(e.target.checked)}
                    className="checkbox checkbox-sm"
                  />
                  <span className="text-sm">Now online</span>
                </label>
                <span className="text-xs text-zinc-500">
                  ({onlineUsers.length - 1} online)
                </span>
              </div>
            </li>
            <li>
              <button
                className="btn-outline p-2 text-white"
                onClick={() =>
                  document.getElementById("my_modal_5").showModal()
                }
              >
                <span className="flex gap-1 items-center justify-between text-white translate-x-1.5">
                  <span>
                    <PlusSquare className="" />
                  </span>
                  <span>Create Group</span>
                </span>
              </button>
              <dialog
                id="my_modal_5"
                className="modal modal-top sm:modal-middle"
              >
                <div className="modal-box">
                  <input
                    className="input w-full"
                    placeholder="Group Name"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                  />
                  <span className="p-6 flex-col">
                    <h2 className="font-bold text-xl whitespace-nowrap p-1 mt-3 bg-gray-500 rounded-md bg-opacity-5">
                      Add Contacts
                    </h2>
                    <div className="overflow-auto h-40 sm:h-60">
                      {users.map((user) => (
                        <div key={user._id}>
                          <div className="form-control">
                            <label className="label cursor-pointer">
                              <span className="label-text font-bold">
                                {user.fullName}
                              </span>
                              <input
                                type="checkbox"
                                className="checkbox"
                                checked={selectedUserIds.includes(user._id)}
                                onChange={(e) =>
                                  handleCheckboxChange(
                                    user._id,
                                    e.target.checked
                                  )
                                }
                              />
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </span>
                  <div className="modal-action">
                    <button
                      className="btn"
                      disabled={!(groupName && selectedUserIds.length > 1)}
                      onClick={handleCreateGroup}
                    >
                      Create
                    </button>
                    <form method="dialog">
                      <button className="btn">Close</button>
                    </form>
                  </div>
                </div>
              </dialog>
            </li>
            <li>
              <button
                className="btn-outline p-2 text-white"
                onClick={() =>
                  document.getElementById("my_modal_4").showModal()
                }
              >
                <span className="flex gap-1 items-center justify-between text-white translate-x-1.5">
                  <span>
                    <XSquare />
                  </span>
                  <span>Delete Group</span>
                </span>
              </button>
              <dialog
                id="my_modal_4"
                className="modal modal-top sm:modal-middle"
              >
                <div className="modal-box !w-[110%] !h-2/3 pt-3 overflow-y-auto">
                  <span className="p-2 flex-col">
                    <h2 className="font-bold text-xl whitespace-nowrap p-1 mt-3 bg-gray-500 rounded-md bg-opacity-5">
                      Groups available
                    </h2>
                    <div className="overflow-y-auto w-60 h-40">
                      {groups.map((group) => (
                        <div key={group._id} className="form-control">
                          <label className="label cursor-pointer">
                            <span className="label-text font-bold">
                              {group.name}
                            </span>
                            <input
                              type="radio"
                              name="group-selection"
                              className="radio checked:bg-red-500"
                              checked={selectedGroupId === group._id}
                              onChange={() => setSelectedGroupId(group._id)}
                            />
                          </label>
                        </div>
                      ))}
                    </div>
                  </span>
                  <div className="modal-action ">
                    <button
                      className="btn"
                      disabled={!selectedGroupId}
                      onClick={handleDeleteGroupId}
                    >
                      Delete
                    </button>
                    <form method="dialog">
                      <button className="btn" onClick={()=>setSelectedGroupId(null)}>Close</button>
                    </form>
                  </div>
                </div>
              </dialog>
            </li>
          </ul>
        </div>
      </div>

      <div className="overflow-y-auto w-full py-2">
        <h3 className="hidden sm:block pl-3 py-2 font-semibold text-sm text-zinc-600">
          Groups
        </h3>
        {groups.length === 0 && (
          <div className="hidden sm:block text-center text-zinc-500 py-2">
            No groups yet
          </div>
        )}
        {groups.map((group) => (
          <button
            key={group._id}
            onClick={() => setSelectedGroup(group)}
            className={`
              w-full p-2 flex items-center gap-2
              hover:bg-base-300 transition-colors
              ${
                selectedGroup?._id === group._id
                  ? "bg-base-300 ring-1 ring-base-300"
                  : ""
              }
            `}
          >
            <div className="size-10 flex items-center justify-center bg-gray-300 rounded-full text-black text-sm">
              <UsersRound className="rounded-full bg-gray-500 bg-opacity-40 w-10 h-auto p-1" />
            </div>
            <div className="hidden sm:block text-left min-w-0">
              <div className="font-medium truncate">{group.name}</div>
              <div className="text-xs text-zinc-400">
                {group.members?.length || 0} members
              </div>
            </div>
          </button>
        ))}

        <h3 className="hidden sm:block pl-3 py-2 mt-4 font-semibold text-sm text-zinc-600">
          Direct Messages
        </h3>
        {filteredUsers.map((user) => (
          <button
            key={user._id}
            onClick={() => setSelectedUser(user)}
            className={`
              w-full p-2 flex items-center gap-1
              hover:bg-base-300 transition-colors
              ${
                selectedUser?._id === user._id
                  ? "bg-base-300 ring-1 ring-base-300"
                  : ""
              }
            `}
          >
            <div className="relative mx-auto sm:mx-0">
              <img
                src={user.profilePic || "/avatar.png"}
                alt={user.name}
                className="size-10 object-cover rounded-full"
              />
              {onlineUsers.includes(user._id) && (
                <span
                  className="absolute bottom-0 right-0 size-3 bg-green-500 
                  rounded-full ring-2 ring-zinc-900"
                />
              )}
            </div>
            <div className="hidden sm:block text-left min-w-0">
              <div className="font-medium truncate">{user.fullName}</div>
              <div className="text-sm text-zinc-400">
                {onlineUsers.includes(user._id) ? "Online" : "Offline"}
              </div>
            </div>
          </button>
        ))}

        {filteredUsers.length === 0 && (
          <div className="text-center text-zinc-500 py-4">No online users</div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
