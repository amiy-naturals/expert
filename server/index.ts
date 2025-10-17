import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import adminRouter from "./routes/admin";
import reviewsRouter from "./routes/reviews";
import imagesRouter from "./routes/images";
import productsRouter from "./routes/products";
import checkoutRouter from "./routes/checkout";
import ordersRouter from "./routes/orders";
import loyaltyRouter from "./routes/loyalty";
import referralsRouter from "./routes/referrals";
import leaderboardRouter from "./routes/leaderboard";
import usersRouter from "./routes/users";
import doctorsRouter from "./routes/doctors";
import rankRouter from "./routes/rank";
import expertRouter from "./routes/expert";
import authRouter from "./routes/auth";
import enrollRouter from "./routes/enroll";
import webhooksRouter from "./routes/webhooks";
import debugSupabaseRouter from "./routes/debug-supabase";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  // Shopify webhooks require raw body for HMAC verification (must be AFTER general JSON parser)
  app.use('/api/webhooks/shopify', express.raw({ type: '*/*' }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // API routers
  app.use('/api/admin', adminRouter);
  app.use('/api/reviews', reviewsRouter);
  app.use('/api/images', imagesRouter);
  app.use('/api/products', productsRouter);
  app.use('/api/checkout', checkoutRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/loyalty', loyaltyRouter);
  app.use('/api/referrals', referralsRouter);
  app.use('/api/leaderboard', leaderboardRouter);
  app.use('/api/doctors', doctorsRouter);
  app.use('/api/rank', rankRouter);
  app.use('/api/expert', expertRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/enroll', enrollRouter);
  app.use('/api/webhooks', webhooksRouter);
  app.use('/api/users', usersRouter);

  return app;
}
