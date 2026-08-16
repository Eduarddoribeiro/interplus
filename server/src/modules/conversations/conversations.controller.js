import * as service from "./conversations.service.js";

export async function getInbox(req, res) {
  

  try {

    const data =
      await service.getInbox();

    res.json(data);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }

}