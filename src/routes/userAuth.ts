import { Request, Response, Router } from "express";
import { client } from "../config/clients/index.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authenticateToken } from "../middleware/auth.js";
import { AuthRequest } from "../utils/types.js";
import Stripe from "stripe";
import { formatGermanDate } from "../utils/functions.js";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const router = Router();

router.post("/create-account", async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    res
      .status(400)
      .send({ data: null, error: "Missing required fields", user: null });
    return;
  }

  try {
    const existing = await client.users.findFirst({
      where: { email },
    });
    if (existing) {
      res
        .status(400)
        .send({ data: null, error: "User already exists", user: null });
      return;
    }
    const hashed = await bcrypt.hash(password, 10);
    const newUser = await client.users.create({
      data: { email, password: hashed, name, role: "user" },
    });

    const token = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET!, {
      expiresIn: "3d",
    });
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 3);
    await client.user_sessions.create({
      data: {
        user_id: newUser.id,
        token: token,
        expires_at: expiresAt,
      },
    });
    res.status(200).send({
      data: token,
      error: null,
      user: {
        name: newUser.name,
        email: newUser.email,
        type: newUser.role,
      },
    });
    return;
  } catch (error) {
    console.error("Error creating account:", error);
    res
      .status(500)
      .send({ data: null, error: "Internal Server Error", user: null });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).send({
      data: null,
      error: "Missing required fields",
      user: null,
    });
    return;
  }

  try {
    const user = await client.users.findFirst({ where: { email } });

    if (!user) {
      res.status(400).send({
        data: null,
        error: "Invalid Email or Password",
        user: null,
      });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      res.status(400).send({
        data: null,
        error: "Invalid Email or Password",
        user: null,
      });
      return;
    }

    const existingSession = await client.user_sessions.findFirst({
      where: { user_id: user.id },
    });

    const now = new Date();
    let token: string;
    let expiresAt: Date;

    if (existingSession) {
      const sessionExpired = new Date(existingSession.expires_at) < now;

      if (sessionExpired) {
        token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
          expiresIn: "3d",
        });

        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 3);

        await client.user_sessions.update({
          where: { user_id: existingSession.user_id },
          data: {
            token,
            expires_at: expiresAt,
          },
        });
      } else {
        token = existingSession.token;
      }
    } else {
      token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
        expiresIn: "3d",
      });

      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 3);

      await client.user_sessions.create({
        data: {
          user_id: user.id,
          token,
          expires_at: expiresAt,
        },
      });
    }

    res.status(200).send({
      data: token,
      error: null,
      user: {
        name: user.name,
        email: user.email,
        type: user.role,
      },
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).send({
      data: null,
      error: "Internal Server Error",
      user: null,
    });
  }
});

router.post(
  "/logout",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).send({ data: null, error: "Unauthorized user" });
        return;
      }

      await client.user_sessions.delete({
        where: {
          user_id: userId,
        },
      });
      res.status(200).send({ data: "Successfully logged out.", error: null });
      return;
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error while logging out", error.message);
      }

      res.status(500).send({ data: null, error: "Internal Server Error" });
    }
  }
);

router.get("/user-info", authenticateToken, async (req: any, res: any) => {
  try {
    console.log("➡️ Fetching user with ID:", req.userId);

    const user = await client.users.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        stripe_customer_id: true,
      },
    });

    if (!user) {
      console.log("❌ User not found");
      return res.status(404).json({ error: "User not found", user: null });
    }

    console.log("✅ User found:", user);

    let subscriptionInfo = null;
   

    if (user.stripe_customer_id) {
      console.log(
        "➡️ Fetching Stripe subscriptions for customer:",
        user.stripe_customer_id
      );

      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripe_customer_id,
        status: "all",
        expand: ["data.items.data.price"],
        limit: 1,
      });

      const subscription = subscriptions.data[0] as Stripe.Subscription;
   

      if (
        subscription &&
        (subscription.status === "past_due" || subscription.status === "active")
      ) {
        const item = subscription.items.data[0];
        const price = item?.price;
        const start = item?.current_period_start;
        const end = item?.current_period_end;

        let productName: string | undefined = undefined;
        if (price?.product && typeof price.product === "string") {
          try {
            const product = await stripe.products.retrieve(price.product);
            productName = product.name;
          } catch (productErr: any) {
            console.warn(
              "⚠️ Failed to fetch product name:",
              productErr.message
            );
          }
        }

        subscriptionInfo = {
          id: subscription.id,
          status: subscription.status,
          cancel_at_period_end: subscription.cancel_at_period_end,
          current_period_start: formatGermanDate(start) ,
          current_period_end:formatGermanDate(end),

          created: subscription.created
            ? new Date(subscription.created * 1000)
            : null,
          price: {
            id: price?.id,
            amount: price?.unit_amount ? price.unit_amount / 100 : null,
            currency: price?.currency?.toUpperCase(),
            interval: price?.recurring?.interval,
            product_name: productName,
          },
          payment_method: subscription.default_payment_method,
          customer: subscription.customer,
        };
      } else {
        console.log("ℹ️ No active or past subscriptions found.");
      }
    } else {
      console.log("ℹ️ User does not have a Stripe customer ID.");
    }

    const { stripe_customer_id, ...userData } = user;

    return res.status(200).json({
      user: userData,
      subscription: subscriptionInfo,
      error: null,
    });
  } catch (err: any) {
    console.error("🔥 Error in /user-info route:", err);
    return res.status(500).json({ error: "Internal server error", user: null });
  }
});

router.put(
  "/update-user-info",
  authenticateToken,
  async (req: any, res: any) => {
    const { name, email } = req.body;

    if (!name && !email) {
      return res.status(400).json({ error: "No data to update" });
    }

    try {
      const updated = await client.users.update({
        where: { id: req.userId },
        data: {
          ...(name && { name }),
          ...(email && { email }),
        },
      });

      res.status(200).json({
        message: "User updated successfully",
        user: {
          name: updated.name,
          email: updated.email,
          role: updated.role,
        },
      });
    } catch (err) {
      console.error("Error updating user:", err);
      res.status(500).json({ error: "Failed to update user" });
    }
  }
);

export { router };
