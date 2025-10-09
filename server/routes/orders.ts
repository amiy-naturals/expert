import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";
import { listOrdersForUser } from "../lib/orders";

const router = Router();

router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const rows = await listOrdersForUser(req.authUser.id);
    res.json(rows);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

export default router;
