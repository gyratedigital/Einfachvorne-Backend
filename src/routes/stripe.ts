import Stripe from "stripe";
import { Request, Response, Router } from "express";
import { client } from "../config/clients/index.js";
import { authenticateToken } from "../middleware/auth.js";
import { AuthRequest } from "../utils/types.js";

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

router.get("/products", async (req: Request, res: Response) => {
  try {
    const products = await stripe.products.list({
      limit: 10,
      expand: ["data.default_price"],
    });

    const formattedProducts = products.data.map((product) => {
      const price = product.default_price as Stripe.Price;

      const amount = price?.unit_amount ?? 0;
      const currency = 'EUR' ;

      const formattedPrice = `${amount / 100} ${currency}`;

      return {
        productId: product.id,
        name: product.name,
        description: product.description,
        features: (product as any)?.marketing_features || null,
        price: formattedPrice,
        priceId: price?.id,
      };
    });

    res.json({ success: true, data: formattedProducts });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});


router.post("/subscribe", authenticateToken, async (req: any, res: any) => {
  try {

    const { priceId } = req.body;

    if (!priceId || typeof priceId !== "string") {
      return res.status(400).json({ error: "Missing or invalid priceId" });
    }

    const userId = req.userId;
    if (!userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const user = await client.users.findUnique({ where: { id: userId } });
    console.log("Fetched user from DB:", user);

    if (!user || !user.email) {
      return res.status(403).json({ error: "Unauthorized or missing email" });
    }

    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: { userId },
      });

      customerId = customer.id;

      await client.users.update({
        where: { id: userId },
        data: { stripe_customer_id: customerId },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { userId },
      success_url: `${process.env.CLIENT_URL}/payment-success`,
      cancel_url: `${process.env.CLIENT_URL}/payment-cancelled`,
    });

    res.json({ success: true, url: session.url });

  } catch (error) {
    console.error("Subscription error:", error);
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
    }
    res.status(500).json({ error: "Internal server error" });
  }
});




export { router };
