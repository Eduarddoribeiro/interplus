import express from "express";
import * as controller from "./contacts.controller.js";

const router = express.Router();

router.patch("/:id/read", controller.markAsRead);

export default router;