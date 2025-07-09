import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import { listingsRouter, StripeRouter, userAuthRouter } from "./routes/index.js";
// import { client } from './config/clients/index.js'

const app = express();

// const PORT = parseInt(process.env.PORT || '') || 3000
app.use(
  cors({
    origin: ["http://localhost:4321", 
      "http://localhost:3000",
      "http://j0so08gs8w8cco4gkssw4go0.152.53.178.79.sslip.io",
      "https://api.stripe.com"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, 
  })
);
// app.use('/', stripeRouter)

app.use(bodyParser.urlencoded({ extended: false, limit: "20mb" }));

app.use(bodyParser.json({ limit: "20mb" }));

app.use(cookieParser());

app.use("/auth", userAuthRouter);
app.use("/", listingsRouter);
app.use("/stripe", StripeRouter);

app.get("/", (req: Request, res: Response) => {
  res.send("This is Einfachvorne Backend Server Version 1.0.1");
});

app.listen(3000, () => {
  console.log("server running at port 3000 ");
});
