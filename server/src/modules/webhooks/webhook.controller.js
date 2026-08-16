import * as webhookService from "./webhook.service.js";

export async function evolution(req, res) {
  try {
    await webhookService.processEvolutionWebhook(req.body);

    return res.status(200).json({
      success: true,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}