import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import reservationRouter from "./routes/reservationRoute.js";
import { dbConnection } from "./database/dbConnection.js";
import { errorMiddleware } from "./middlewares/error.js";
import orderRouter from "./routes/orderRoute.js";

dotenv.config({ path: "./config.env" });

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://restaurantmanagementsystem-z8za.onrender.com"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        return callback(new Error("CORS policy does not allow this origin."), false);
      }
      return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/reservations", reservationRouter);
app.use("/api/orders", orderRouter);

app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "HELLO WORLD AGAIN",
  });
});

dbConnection();
app.use(errorMiddleware);

export default app;
