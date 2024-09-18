import { Button } from "@/components/ui/button";
import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, LogIn } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import { checkSubscription } from "@/lib/subscription";
import SubscriptionButton from "@/components/SubscriptionButton";
import { db } from "@/lib/db/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default async function Home() {
  const { userId } = await auth();
  const isAuth = !!userId;
  const isPro = await checkSubscription();

  let firstChat = null;

  if (isAuth && userId) {
    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('userId', '==', userId));
    const chatSnapshot = await getDocs(q);

    if (!chatSnapshot.empty) {
      const firstChatDoc = chatSnapshot.docs[0];
      const chatId = firstChatDoc.id;
      const chatData = firstChatDoc.data();

      firstChat = {
        ...chatData,
        chatId, // Store chatId instead of id
        createdAt: chatData.createdAt ? chatData.createdAt.toMillis() : null,
      };
    }
  }

  return (
    <div className="w-screen min-h-screen bg-gradient-to-r from-rose-100 to-teal-100">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center">
            <h1 className="mr-3 text-5xl font-semibold">Chat with any PDF</h1>
            <UserButton afterSignOutUrl="/" />
          </div>

          <div className="flex mt-2">
            {isAuth && firstChat && (
              <>
                <Link href={`/chat/${firstChat.chatId}`}>
                  <Button>
                    Go to Chats <ArrowRight className="ml-2" />
                  </Button>
                </Link>
                <div className="ml-3">
                  <SubscriptionButton isPro={isPro} />
                </div>
              </>
            )}
          </div>

          <p className="max-w-xl mt-1 text-lg text-slate-600">
            Join millions of students, researchers, and professionals to instantly
            answer questions and understand research with AI.
          </p>

          <div className="w-full mt-4">
            {isAuth ? (
              <FileUpload />
            ) : (
              <Link href="/sign-in">
                <Button>
                  Login to get Started!
                  <LogIn className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
