import * as service from "./contacts.service.js";

export async function markAsRead(req, res) {
  await service.markAsRead(req.params.id);

  res.sendStatus(204);
}