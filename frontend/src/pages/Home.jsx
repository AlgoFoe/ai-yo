import { useMessageStore } from "../global/useMessageStore";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatBox from "../components/ChatBox";

const Home = () => {
  const { selectedUser, selectedGroup } = useMessageStore();

  return (
    <div className="h-screen w-screen bg-base-200">
      <div className="flex items-center justify-center pt-16">
        <div className="bg-base-100 shadow-cl w-full h-[calc(100vh-4rem)]">
          <div className="flex h-full rounded-lg overflow-hidden">
            <Sidebar />

            {!(selectedUser || selectedGroup) ? <NoChatSelected /> : <ChatBox />}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Home;
