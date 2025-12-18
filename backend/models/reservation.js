import mongoose from "mongoose";
import validator from "validator";

const reservationSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    minLength: [3, "First name must be of at least 3 characters."],
    maxLength: [30, "First name cannot exceed 30 characters."],
  },
  lastName: {
    type: String,
    required: true,
    minLength: [1, "Last name must be at least 1 character."],
    maxLength: [30, "Last name cannot exceed 30 characters."],
  },
  email: {
    type: String,
    required: false,
    validate: {
      validator: (v) => (v ? validator.isEmail(v) : true),
      message: "Provide a valid email",
    },
  },
  phone: {
    type: String,
    required: true,
    validate: {
      validator: (v) => /^\d{10,}$/.test(v),
      message: "Phone must contain at least 10 digits.",
    },
  },
  seatId: {
    type: String,
    required: true,
  },
  // Live seat-hold (now) mode
  reservedUntil: {
    type: Date,
    required: true,
  },
  // Weekly calendar mode
  date: { type: String },       // "YYYY-MM-DD"
  startTime: { type: String },  // "HH:mm"
  endTime: { type: String },    // "HH:mm"
  status: {
    type: String,
    enum: ["held", "confirmed", "canceled"],
    default: "held",
  },
}, { timestamps: true });

reservationSchema.index({ seatId: 1, status: 1, reservedUntil: 1 });
reservationSchema.index({ seatId: 1, date: 1, startTime: 1, endTime: 1, status: 1 });

const Reservation =
  mongoose.models.Reservation || mongoose.model("Reservation", reservationSchema);
export default Reservation;
