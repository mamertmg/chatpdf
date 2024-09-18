import { db } from "@/lib/db/firebase";
import { Chat } from "@/lib/db/schema";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { loadS3IntoPinecone } from "@/lib/pinecone";
import { getS3Url } from "@/lib/s3";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// /api/create-chat 
export async function POST(req: Request, res: Response) {

  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    
    const body = await req.json();
    const { file_key, file_name } = body;
    console.log(file_key, file_name);

    await loadS3IntoPinecone(file_key);

    // Create the chat data according to your schema
    const chatData: Omit<Chat, 'id'> = {
      pdfName: file_name,
      pdfUrl: getS3Url(file_key),
      createdAt: Timestamp.now(),
      userId: userId,
      fileKey: file_key,
    };

    console.log("Attempting to add document to Firestore");
    console.log("Chat data:", chatData);

    // Insert into Firestore
    const docRef = await addDoc(collection(db, "chats"), chatData);

    return NextResponse.json(
      {
        chat_id: docRef.id, // Firestore generates the document ID
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "internal server error" },
      { status: 500 }
    );
  }
}