import { Booking } from "../models/booking.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Create a new booking
const createBooking = asyncHandler(async (req, res) => {
  const { userId, serviceType, serviceId, status } = req.body;

  if (!userId || !serviceType || !serviceId) {
    throw new ApiError(400, "userId, serviceType, and serviceId are required");
  }

  if (!["Bus", "Hotel"].includes(serviceType)) {
    throw new ApiError(400, "Invalid serviceType. Allowed values: Bus, Hotel");
  }
  if (status && !["confirmed", "canceled", "completed"].includes(status)) {
    throw new ApiError(
      400,
      "Invalid status. Allowed values: confirmed, canceled, completed",
    );
  }

  const booking = await Booking.create({
    userId,
    serviceType,
    serviceId,
    status: status || "confirmed",
  });

  return res
    .status(201)
    .json(new ApiResponse(201, booking, "Booking created successfully"));
});

// Get all bookings with optional pagination
const getAllBookings = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const bookings = await Booking.find()
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate("userId")
    .populate("serviceId");

  const totalBookings = await Booking.countDocuments();
  const pagination = {
    currentPage: page,
    totalPages: Math.ceil(totalBookings / limit),
    totalBookings,
  };

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { bookings, pagination },
        "Bookings retrieved successfully",
      ),
    );
});

// Get a specific booking by ID
const getBookingById = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const booking = await Booking.findById(bookingId)
    .populate("userId")
    .populate("serviceId");

  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, booking, "Booking retrieved successfully"));
});

// Update the status of a booking
const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!["confirmed", "canceled", "completed"].includes(status)) {
    throw new ApiError(
      400,
      "Invalid status. Allowed values: confirmed, canceled, completed",
    );
  }

  const booking = await Booking.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true },
  );

  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, booking, "Booking status updated successfully"));
});

// Delete a booking by ID
const deleteBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findByIdAndDelete(req.params.bookingId);

  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Booking deleted successfully"));
});

export {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  deleteBooking,
};
