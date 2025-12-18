import express from "express";
import controller from "../controller/reservation.js";

const router = express.Router();

router.get("/seats", controller.getSeats);
router.post("/hold", controller.holdSeat);
router.post("/cancel", controller.cancelReservation);
router.get("/slots", controller.getSlots);
router.post("/book", controller.bookSlot);
router.post("/bookSeatSlot", controller.bookSeatSlot);

// New: raw reservations for time-aware seat grid
router.get("/rawWeek", controller.getRawWeekReservations);

export default router;
