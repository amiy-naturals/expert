import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";
import { listOrdersForUser } from "../lib/orders";
import { sendError } from '../lib/error';

const router = Router();

router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const rows = await listOrdersForUser(req.authUser.id);
    res.json(rows);
  } catch (err) {
    return sendError(res, err, 500);
  }
});

export default router;
