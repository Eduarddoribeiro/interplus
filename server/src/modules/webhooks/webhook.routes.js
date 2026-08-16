import { Router } from "express";

import * as webhookController from "./webhook.controller.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Webhook funcionando.",
  });
});

router.post(
  "/evolution",
  webhookController.evolution
);

export default router;