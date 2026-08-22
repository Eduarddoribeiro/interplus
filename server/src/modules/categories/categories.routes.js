import { Router } from "express";

import * as controller from "./categories.controller.js";

const router = Router();

router.get("/", controller.getCategories);

export default router;