import { Router } from "express";
import * as controller from "./messages.controller.js";

const router = Router();

router.get(
  "/:jid",
  controller.getMessages
);

router.post("/send", controller.sendMessage);

export default router;