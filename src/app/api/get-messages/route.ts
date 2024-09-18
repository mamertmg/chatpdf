import { db } from "@/lib/db/firebase";
import { NextResponse } from "next/server";
import { collection, doc, getDocs } from "firebase/firestore";

export const POST = async (req: Request) => {
    const { chatId } = await req.json();

    const messagesRef = collection(doc(db, 'chats', chatId), 'messages');

    const snapshot = await getDocs(messagesRef);
  
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return NextResponse.json(messages);
};