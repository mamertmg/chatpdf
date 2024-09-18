import { Timestamp } from "firebase/firestore";

// Enum-like structure for role
export type UserRole = "system" | "user";

// Interface for the Chats collection
export interface Chat {
  id: string; // Firestore will automatically generate this ID
  pdfName: string;
  pdfUrl: string;
  createdAt: Timestamp;
  userId: string; // max length 256
  fileKey: string;
}

// Interface for the Messages collection
export interface Message {
  id: string; // Firestore will automatically generate this ID
  chatId: string; // Reference to a chat document
  content: string;
  createdAt: Timestamp;
  role: UserRole; // "system" or "user"
}

// Interface for the UserSubscriptions collection
export interface UserSubscription {
  id: string; // Firestore will automatically generate this ID
  userId: string; // max length 256, should be unique
  stripeCustomerId: string; // max length 256, should be unique
  stripeSubscriptionId?: string; // max length 256, optional and unique
  stripePriceId?: string; // max length 256, optional
  stripeCurrentPeriodEnd?: Timestamp; // optional
}
