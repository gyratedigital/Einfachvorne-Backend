import { Request, Response, Router } from "express";
import { client } from "../config/clients/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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


export { router };
