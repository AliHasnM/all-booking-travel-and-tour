import { Booking } from "../models/booking.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Route } from "../models/routeCompnay.model.js";
import mongoose from "mongoose";
import { Room } from "../models/roomHotel.model.js";

// Create a new booking
// const createBooking = asyncHandler(async (req, res) => {
//   const { userId, serviceType, serviceId, status } = req.body;

//   if (!userId || !serviceType || !serviceId) {
//     throw new ApiError(400, "userId, serviceType, and serviceId are required");
//   }

//   if (!["Bus", "Hotel"].includes(serviceType)) {
//     throw new ApiError(400, "Invalid serviceType. Allowed values: Bus, Hotel");
//   }
//   if (status && !["confirmed", "canceled", "completed"].includes(status)) {
//     throw new ApiError(
//       400,
//       "Invalid status. Allowed values: confirmed, canceled, completed",
//     );
//   }

//   const booking = await Booking.create({
//     userId,
//     serviceType,
//     serviceId,
//     status: status || "confirmed",
//   });

//   return res
//     .status(201)
//     .json(new ApiResponse(201, booking, "Booking created successfully"));
// });
const createBooking = asyncHandler(async (req, res) => {
  // Get parameters from URL
  const { userId, serviceType, serviceId } = req.params;
  const { status } = req.body; // Status can still be in the body as it is optional

  if (!userId || !serviceType || !serviceId) {
    throw new ApiError(400, "userId, serviceType, and serviceId are required");
  }

  if (!["Bus", "Hotel"].includes(serviceType)) {
    throw new ApiError(400, "Invalid serviceType. Allowed values: Bus, Hotel");
  }
  if (status && !["confirmed", "canceled"].includes(status)) {
    throw new ApiError(
      400,
      "Invalid status. Allowed values: confirmed, canceled",
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

// Fetch all travel companies
const getAllTravelCompanies = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query; // Optional pagination parameters

  // Define pagination options
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    select: "-password -refreshToken", // Exclude sensitive fields
    sort: { createdAt: -1 }, // Sort by creation date (latest first)
  };

  // Match condition for travel companies
  const matchConditions = { role: "TravelCompany" }; // Only fetch users with the "TravelCompany" role

  // Fetch travel companies with pagination
  const travelCompanies = (await User.paginate)
    ? await User.paginate(matchConditions, options)
    : await User.find(matchConditions)
        .select(options.select)
        .sort(options.sort);

  if (!travelCompanies || travelCompanies.docs?.length === 0) {
    throw new ApiError(404, "No travel companies found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        travelCompanies.docs || travelCompanies,
        "Travel companies fetched successfully",
      ),
    );
});

const getTravelCompanyById = asyncHandler(async (req, res) => {
  const { companyId } = req.params; // Get hotelId from the request params

  // Find the hotel user by ID and ensure that the role is 'Hotel'
  const user = await User.findOne({
    _id: companyId,
    role: "TravelCompany",
  }).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(404, "TravelCompany not found or invalid ID");
  }

  // Return the hotel user profile
  res
    .status(200)
    .json(new ApiResponse(200, user, "Hotel profile fetched successfully"));
});

// Fetch all hotels
const getAllHotels = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query; // Optional pagination parameters

  // Find users with the "Hotel" role
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    select: "-password -refreshToken", // Exclude sensitive fields
    sort: { createdAt: -1 }, // Sort by creation date (latest first)
  };

  const matchConditions = { role: "Hotel" }; // Only fetch users with the "Hotel" role

  // Use pagination if your User model has pagination plugin, otherwise use simple `find`
  const hotels = (await User.paginate)
    ? await User.paginate(matchConditions, options)
    : await User.find(matchConditions)
        .select(options.select)
        .sort(options.sort);

  if (!hotels || hotels.docs?.length === 0) {
    throw new ApiError(404, "No hotels found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        hotels.docs || hotels,
        "Hotels fetched successfully",
      ),
    );
});

// Controller to fetch hotel user profile by HotelId
const getHotelById = asyncHandler(async (req, res) => {
  const { hotelId } = req.params; // Get hotelId from the request params

  // Find the hotel user by ID and ensure that the role is 'Hotel'
  const user = await User.findOne({ _id: hotelId, role: "Hotel" }).select(
    "-password -refreshToken",
  );

  if (!user) {
    throw new ApiError(404, "Hotel not found or invalid ID");
  }

  // Return the hotel user profile
  res
    .status(200)
    .json(new ApiResponse(200, user, "Hotel profile fetched successfully"));
});

// Controller to fetch all routes for a specific company
const getAllCompanyRoutes = asyncHandler(async (req, res) => {
  const { companyId } = req.params;
  console.log(
    "Raw CompanyId:",
    companyId,
    "IsValid:",
    mongoose.Types.ObjectId.isValid(companyId),
  );

  // Validate companyId
  if (!mongoose.Types.ObjectId.isValid(companyId)) {
    throw new ApiError(400, "Invalid Company ID");
  }

  try {
    // Fetch routes and populate company details
    const routes = await Route.find({ companyId }).populate("companyId");

    console.log("Fetched Routes:", routes);

    // If no routes are found, return a 404 error
    if (!routes || routes.length === 0) {
      throw new ApiError(404, "No routes found for this company");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          routes,
          "Routes fetched successfully for the company",
        ),
      );
  } catch (error) {
    console.error("Error fetching routes:", error.message);
    throw new ApiError(500, "An error occurred while fetching company routes");
  }
});

// Controller to fetch all room for a specific hotel
const getAllHotelRooms = asyncHandler(async (req, res) => {
  const { hotelId } = req.params;
  console.log(
    "Raw HotelId:",
    hotelId,
    "IsValid:",
    mongoose.Types.ObjectId.isValid(hotelId),
  );

  // Validate companyId
  if (!mongoose.Types.ObjectId.isValid(hotelId)) {
    throw new ApiError(400, "Invalid Hotel ID");
  }

  try {
    // Fetch routes and populate company details
    const rooms = await Room.find({ hotelId }).populate("hotelId");

    console.log("Fetched Rooms:", rooms);

    // If no routes are found, return a 404 error
    if (!rooms || rooms.length === 0) {
      throw new ApiError(404, "No rooms found for this hotel");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, rooms, "Rooms fetched successfully for the hotel"),
      );
  } catch (error) {
    console.error("Error fetching rooms:", error.message);
    throw new ApiError(500, "An error occurred while fetching hotel rooms");
  }
});

export {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  deleteBooking,
  getAllTravelCompanies,
  getAllCompanyRoutes,
  getTravelCompanyById,
  getAllHotels,
  getAllHotelRooms,
  getHotelById,
};
