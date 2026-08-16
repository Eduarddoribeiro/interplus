import * as service from "./messages.service.js";

export async function getMessages(req, res) {

  try {

    const data =
      await service.getMessages(
        req.params.jid
      );

    res.json(data);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }

}

export async function sendMessage(req, res) {
  try {
    const { jid, message } = req.body;

    const result = await service.sendMessage({
      jid,
      message,
    });

    res.json(result);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}