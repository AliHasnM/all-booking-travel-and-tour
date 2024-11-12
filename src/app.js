import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/errorHandler.js";
// import Routes
import userRouter from "./routes/user.routes.js";
import travelCompanyRouter from "./routes/travelCompany.routes.js";
import hotelRouter from "./routes/hotel.routes.js";
import routeComapnyRouter from "./routes/routeCompany.routes.js";
import roomHotelRouter from "./routes/roomHotel.routes.js";

const app = express();

// Use environment variable for CORS origin if available
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Middleware to attach `io` to each request
app.use((req, res, next) => {
  const io = app.get("io"); // Retrieve `io` from `app`
  req.io = io;
  next();
});

app.use("/api/v1/users", userRouter);
app.use("/api/v1/travelCompany", travelCompanyRouter);
app.use("/api/v1/routeCompany", routeComapnyRouter);
app.use("/api/v1/hotel", hotelRouter);
app.use("/api/v1/roomHotel", roomHotelRouter);

// Error handling middleware
app.use((req, res, next) => {
  next(new ApiError(404, "Not Found"));
});
app.use(errorHandler);

export default app;
