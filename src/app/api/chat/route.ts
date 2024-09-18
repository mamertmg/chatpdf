import { OpenAI } from "openai";
import { Message } from "@/lib/db/schema";
import { getContext } from "@/lib/context";
import { collection, doc, getDoc, addDoc } from "firebase/firestore"; // Firestore methods
import { db } from "@/lib/db/firebase"; // Firebase setup
import { NextResponse } from "next/server";


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


export async function POST(req: Request) {
  try {

    const { messages, chatId } = await req.json();
    
    // Firestore document reference for chat
    const chatRef = doc(db, 'chats', chatId);
    
    // Fetch chat document
    const chatDoc = await getDoc(chatRef);
    
    if (!chatDoc.exists()) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }
    
    const chatData = chatDoc.data();
    const fileKey = chatData?.fileKey;
    const lastMessage = messages[messages.length - 1];

    const context = await getContext(lastMessage.content, fileKey);

    // Only proceed if we have a context
    if (context) {
      const prompt = {
        role: "system",
        content: `AI assistant is a brand new, powerful, human-like artificial intelligence.
        The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
        AI is a well-behaved and well-mannered individual.
        AI is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful responses to the user.
        AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in conversation.
        AI assistant is a big fan of Pinecone and Vercel.
        START CONTEXT BLOCK
        ${context}
        END OF CONTEXT BLOCK
        AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.
        If the context does not provide the answer to the question, the AI assistant will say, "I'm sorry, but I don't know the answer to that question".
        AI assistant will not apologize for previous responses, but instead will indicate new information was gained.
        AI assistant will not invent anything that is not drawn directly from the context.`,
      };

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          prompt,
          ...messages.filter((message: Message) => message.role === "user"),
        ],
        stream: true,
      });

      let aiMessage = "";

      for await (const chunk of response) {
        const content = chunk.choices[0]?.delta?.content;
        if (content != null) {
          aiMessage += content;
        }
      }

      // Save the user message and AI response to Firestore
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        chatId,
        content: lastMessage.content,
        role: "user",
        createdAt: new Date(),
      });

      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        chatId,
        content: aiMessage,
        role: "system",
        createdAt: new Date(),
      });

      return NextResponse.json({ message: aiMessage });
    } else {
      return NextResponse.json({ error: "Unable to generate context" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
