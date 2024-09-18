// /api/stripe
import { db } from "@/lib/db/firebase";
import { stripe } from "@/lib/stripe";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { collection, getDocs, query, where } from "firebase/firestore";

const return_url = process.env.NEXT_BASE_URL + "/";

export async function GET() {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId) {
      return new NextResponse("unauthorized", { status: 401 });
    }

    const userSubscriptionsRef = collection(db, 'userSubscriptions');
    const snapshot = await getDocs(query(userSubscriptionsRef, where('userId', '==', userId)));
    
    if (!snapshot.empty) {
      const _userSubscriptions = snapshot.docs.map(doc => doc.data());
      if (_userSubscriptions[0].stripeCustomerId) {
        // trying to cancel at the billing portal
        const stripeSession = await stripe.billingPortal.sessions.create({
          customer: _userSubscriptions[0].stripeCustomerId,
          return_url,
        });
        return NextResponse.json({ url: stripeSession.url });
      }
    }

    // user's first time trying to subscribe
    const stripeSession = await stripe.checkout.sessions.create({
      success_url: return_url,
      cancel_url: return_url,
      payment_method_types: ["card"],
      mode: "subscription",
      billing_address_collection: "auto",
      customer_email: user?.emailAddresses[0].emailAddress,
      line_items: [
        {
          price_data: {
            currency: "USD",
            product_data: {
              name: "ChatPDF Pro",
              description: "Unlimited PDF sessions!",
            },
            unit_amount: 2000,
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
      },
    });
    return NextResponse.json({ url: stripeSession.url });
  } catch (error) {
    console.log("stripe error", error);
    return new NextResponse("internal server error", { status: 500 });
  }
}