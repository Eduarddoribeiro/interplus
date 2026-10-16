import { Router } from "express";
import * as controller from "./conversations.controller.js";

const router = Router();

router.get(
  "/",
  controller.getInbox
);

export default router;