import * as service from "./categories.service.js";

export async function getCategories(req, res) {
  try {
    const data = await service.getCategories();

    res.json(data);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}