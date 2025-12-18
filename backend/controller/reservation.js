import ErrorHandler from "../middlewares/error.js";
import Reservation from "../models/reservation.js";

// utility: 1 hour ahead (live hold)
const oneHourFromNow = () => new Date(Date.now() + 60 * 60 * 1000);

// Build a 7-day window starting from any provided date (YYYY-MM-DD) or today
const buildWeekDays = (startIso, days = 7) => {
  const base = startIso ? new Date(startIso) : new Date();
  base.setHours(0,0,0,0);
  const out = [];
  for (let i = 0; i < Number(days); i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const dayName = d.toLocaleDateString(undefined, { weekday: "long" }); // Sunday..Saturday
    out.push({ date: dateStr, dayName });
  }
  return out;
};

const buildHourSlots = (startHour = 9, endHour = 21) => {
  const slots = [];
  for (let h = startHour; h < endHour; h++) {
    const s = `${String(h).padStart(2, "0")}:00`;
    const e = `${String(h + 1).padStart(2, "0")}:00`;
    slots.push({ startTime: s, endTime: e });
  }
  return slots;
};

const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;

// Live holds for the pentagon grid "now"
export const getSeats = async (req, res, next) => {
  try {
    const active = await Reservation.find({
      status: { $in: ["held", "confirmed"] },
      reservedUntil: { $gt: new Date() },
    }).lean();

    const map = {};
    for (const r of active) {
      const k = r.seatId;
      if (!map[k] || map[k].reservedUntil < r.reservedUntil) {
        map[k] = { seatId: r.seatId, status: r.status, reservedUntil: r.reservedUntil };
      }
    }

    const seats = Object.values(map);
    return res.status(200).json({ success: true, seats });
  } catch (e) {
    return next(e);
  }
};

// Hold 1 hour (now)
export const holdSeat = async (req, res, next) => {
  const { seatId, firstName, lastName, phone, email } = req.body;
  if (!seatId || !firstName || !lastName || !phone) {
    return next(new ErrorHandler("seatId, firstName, lastName, phone are required", 400));
  }
  if (!/^\d{10,}$/.test(String(phone))) {
    return next(new ErrorHandler("Phone must be at least 10 digits.", 400));
  }
  if (String(lastName).trim().length < 1) {
    return next(new ErrorHandler("Last name must be at least 1 character.", 400));
  }

  try {
    const existing = await Reservation.findOne({
      seatId,
      status: { $in: ["held", "confirmed"] },
      reservedUntil: { $gt: new Date() },
    });

    if (existing) {
      return next(new ErrorHandler("Seat is already reserved.", 409));
    }

    const doc = await Reservation.create({
      seatId,
      firstName,
      lastName,
      phone,
      email: email || undefined,
      reservedUntil: oneHourFromNow(),
      status: "held",
    });

    return res.status(201).json({ success: true, message: "Seat reserved for 1 hour.", reservation: doc });
  } catch (e) {
    return next(e);
  }
};

// Cancel a live hold/confirmed by seatId+phone
export const cancelReservation = async (req, res, next) => {
  const { seatId, phone } = req.body;
  if (!seatId || !phone) {
    return next(new ErrorHandler("seatId and phone are required", 400));
  }
  if (!/^\d{10,}$/.test(String(phone))) {
    return next(new ErrorHandler("Phone must be at least 10 digits.", 400));
  }

  try {
    const active = await Reservation.findOne({
      seatId,
      phone,
      status: { $in: ["held", "confirmed"] },
      reservedUntil: { $gt: new Date() },
    });

    if (!active) {
      return next(new ErrorHandler("No active reservation found for this seat and phone.", 404));
    }

    active.status = "canceled";
    await active.save();

    return res.status(200).json({ success: true, message: "Reservation canceled." });
  } catch (e) {
    return next(e);
  }
};

// Calendar: return 7-day window from any start=YYYY-MM-DD (default today)
export const getSlots = async (req, res, next) => {
  try {
    const { start, days = 7 } = req.query;
    const week = buildWeekDays(start, Number(days));
    const slots = buildHourSlots(9, 21);

    const dates = week.map((d) => d.date);
    const existing = await Reservation.find({
      date: { $in: dates },
      status: { $in: ["held", "confirmed"] },
    }).lean();

    const byDate = existing.reduce((acc, r) => {
      (acc[r.date] ||= []).push(r);
      return acc;
    }, {});

    const result = week.map((d) => {
      const dayReservations = byDate[d.date] || [];
      const slotStatuses = slots.map((slot) => {
        const taken = dayReservations.some((r) =>
          overlaps(slot.startTime, slot.endTime, r.startTime, r.endTime)
        );
        return { startTime: slot.startTime, endTime: slot.endTime, reserved: taken };
      });
      return { date: d.date, dayName: d.dayName, slots: slotStatuses };
    });

    return res.status(200).json({ success: true, week: result });
  } catch (e) {
    return next(e);
  }
};

// Book a specific day/time slot for a seat
export const bookSlot = async (req, res, next) => {
  try {
    const { seatId, firstName, lastName, phone, email, date, startTime, endTime } = req.body;

    if (!seatId || !firstName || !lastName || !phone || !date || !startTime || !endTime) {
      return next(new ErrorHandler("Missing required fields.", 400));
    }
    if (!/^\d{10,}$/.test(String(phone))) {
      return next(new ErrorHandler("Phone must be at least 10 digits.", 400));
    }

    const conflict = await Reservation.findOne({
      seatId,
      date,
      status: { $in: ["held", "confirmed"] },
      $expr: {
        $and: [
          { $lt: ["$startTime", endTime] },
          { $lt: [startTime, "$endTime"] },
        ],
      },
    });

    if (conflict) {
      return next(new ErrorHandler("Slot already reserved for this seat.", 409));
    }

    const doc = await Reservation.create({
      seatId,
      firstName,
      lastName,
      phone,
      email: email || undefined,
      date,
      startTime,
      endTime,
      reservedUntil: new Date(new Date(date + "T" + endTime + ":00Z")),
      status: "held",
    });

    return res.status(201).json({ success: true, message: "Slot reserved.", reservation: doc });
  } catch (e) {
    return next(e);
  }
};

// Unified: book seat + slot atomically
export const bookSeatSlot = async (req, res, next) => {
  try {
    const { seatId, firstName, lastName, phone, email, date, startTime, endTime } = req.body;

    if (!seatId || !firstName || !lastName || !phone || !date || !startTime || !endTime) {
      return next(new ErrorHandler("Missing required fields.", 400));
    }
    if (!/^\d{10,}$/.test(String(phone))) {
      return next(new ErrorHandler("Phone must be at least 10 digits.", 400));
    }

    const conflict = await Reservation.findOne({
      seatId,
      date,
      status: { $in: ["held", "confirmed"] },
      $expr: {
        $and: [
          { $lt: ["$startTime", endTime] },
          { $lt: [startTime, "$endTime"] },
        ],
      },
    });

    if (conflict) {
      return next(new ErrorHandler("This seat is already reserved for the selected slot.", 409));
    }

    const doc = await Reservation.create({
      seatId,
      firstName,
      lastName,
      phone,
      email: email || undefined,
      date,
      startTime,
      endTime,
      reservedUntil: new Date(new Date(date + "T" + endTime + ":00Z")),
      status: "held",
    });

    return res.status(201).json({
      success: true,
      message: "Seat and slot reserved.",
      reservation: doc,
    });
  } catch (e) {
    return next(e);
  }
};

// Raw reservations for the selected week window (start + 7 days)
export const getRawWeekReservations = async (req, res, next) => {
  try {
    const { start, days = 7 } = req.query;
    const week = buildWeekDays(start, Number(days));
    const dates = week.map(d => d.date);

    const reservations = await Reservation.find({
      date: { $in: dates },
      status: { $in: ["held", "confirmed"] },
    }).select("seatId date startTime endTime status").lean();

    return res.status(200).json({ success: true, reservations });
  } catch (e) {
    return next(e);
  }
};

export default {
  getSeats,
  holdSeat,
  cancelReservation,
  getSlots,
  bookSlot,
  bookSeatSlot,
  getRawWeekReservations,
};
