import ChatComponent from "@/components/ChatComponent";
import ChatSideBar from "@/components/ChatSideBar";
import PDFViewer from "@/components/PDFViewer";
import { db } from "@/lib/db/firebase";
import { Chat } from "@/lib/db/schema";
import { checkSubscription } from "@/lib/subscription";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { collection , query, where, getDocs} from "firebase/firestore";
import React from "react";

type Props = {
  params: {
    chatId: string;
  };
};

const ChatPage = async ({ params: {chatId}}: Props) => {

    const { userId } = await auth();

    if (!userId) {
        return redirect("/sign-in");
    }

    // Fetch chats for the user from Firestore
    const chatsRef = collection(db, 'chats');
    const q = query( chatsRef, where('userId', '==', userId))
    const snapshot = await getDocs(q);
    
    // Map through the snapshot to get chats
    const _chats = snapshot.docs.map(doc => ({
        id: doc.id,
        pdfName: doc.data().pdfName,
        pdfUrl: doc.data().pdfUrl,
        createdAt: doc.data().createdAt.toDate().toISOString(),
        userId: doc.data().userId,
        fileKey: doc.data().fileKey
    } as Chat));
    // Handle empty snapshot or no matching documents
    if (snapshot.empty) {
        console.log('No matching documents.');
        return redirect("/");
    }
    
    // Check if the chatId exists in the retrieved chats
    if (!_chats || !_chats.find((chat) => chat.id === chatId)) {
        return redirect("/");
    }
    
    const currentChat = _chats.find((chat): chat is Chat => chat.id === chatId);
    const isPro = await checkSubscription();

    return (
        <div className="flex h-screen overflow-hidden">
          {/* chat sidebar */}
          <div className="w-64 h-full flex-shrink-0 overflow-y-auto">
            <ChatSideBar chats={_chats} chatId={parseInt(chatId)} isPro={isPro} />
          </div>
          <div className="flex flex-1 overflow-hidden">
            {/* pdf viewer */}
            <div className="w-1/2 p-4 overflow-y-auto">
              <PDFViewer pdf_url={currentChat?.pdfUrl || ""} />
            </div>
            {/* chat component */}
            <div className="w-1/2 border-l border-gray-200 overflow-y-auto">
              <ChatComponent chatId={chatId} />
            </div>
          </div>
        </div>
    )
};

export default ChatPage;