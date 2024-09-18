import { auth } from "@clerk/nextjs/server";
import { db } from "./db/firebase";
import { UserSubscription } from "./db/schema";
import { collection, query, where, getDocs } from "firebase/firestore";

const DAY_IN_MS = 1000 * 60 * 60 * 24;
export const checkSubscription = async () => {
  const { userId } = await auth();
  if (!userId) {
    return false;
  }

  const userSubscriptionsRef = collection(db, 'userSubscriptions');
  const q = query(userSubscriptionsRef, where('userId', '==', userId));
  const _userSubscriptions = await getDocs(q);
  

  if (!_userSubscriptions[0]) {
    return false;
  }

  const userSubscription = _userSubscriptions[0];

  const isValid =
    userSubscription.stripePriceId &&
    userSubscription.stripeCurrentPeriodEnd?.getTime()! + DAY_IN_MS >
      Date.now();

  return !!isValid;
};