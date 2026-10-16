import express from "express";
import cors from "cors";

import webhookRoutes from "./modules/webhooks/webhook.routes.js";
import conversationsRoutes from "./modules/conversations/conversations.routes.js";
import messagesRoutes from "./modules/messages/messages.routes.js";
import contactsRoutes from "./modules/contacts/contacts.routes.js";
import categoriesRoutes from "./modules/categories/categories.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Inter Club API",
  });
});

app.use("/webhooks", webhookRoutes);
app.use("/api/conversations", conversationsRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/contacts", contactsRoutes);
app.use("/api/categories", categoriesRoutes);

export default app;