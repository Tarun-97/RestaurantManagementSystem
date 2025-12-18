import express from "express";
import { placeOrder, recommendCombo, recommendTop3 } from "../controller/order.js";

const router = express.Router();

router.post("/", placeOrder);
router.get("/recommend", recommendCombo);
router.get("/recommendTop3", recommendTop3);

export default router;
