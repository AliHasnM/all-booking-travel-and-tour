import { Room } from "../models/roomHotel.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Create a new room
// const createRoom = asyncHandler(async (req, res) => {
//   const {hotelId} = req.params
//   const { type, pricePerNight, availability } = req.body;

//   // Validate that all required fields are provided
//   if (!hotelId || !type || pricePerNight === undefined || !availability) {
//     throw new ApiError(
//       400,
//       "All fields (hotelId, type, pricePerNight, availability) are required",
//     );
//   }

//   // Validate price
//   if (pricePerNight < 0) {
//     throw new ApiError(400, "Price per night cannot be negative");
//   }

//   // Validate availability dates
//   if (!availability.from || !availability.to) {
//     throw new ApiError(400, "Availability must include 'from' and 'to' dates");
//   }

//   // Create a new room from the request body
//   const room = await Room.create({
//     hotelId,
//     type,
//     pricePerNight,
//     availability,
//   });

//   // Send a success response with the created room
//   return res
//     .status(201)
//     .json(new ApiResponse(201, room, "Room created successfully"));
// });
const createRoom = asyncHandler(async (req, res) => {
  const { hotelId } = req.params;
  const { type, pricePerNight, availability } = req.body;

  // Validate hotelId
  if (!hotelId) {
    throw new ApiError(400, "Hotel ID is required");
  }

  // Validate type
  if (!type || typeof type !== "string") {
    throw new ApiError(400, "Room type is required and must be a string");
  }

  // Validate price
  if (pricePerNight === undefined || pricePerNight < 0) {
    throw new ApiError(
      400,
      "Price per night is required and cannot be negative",
    );
  }

  // Validate availability
  if (!availability || !availability.from || !availability.to) {
    throw new ApiError(
      400,
      "Availability must include 'from' and 'to' dates in the format 'YYYY-MM-DD'",
    );
  }

  // Create room
  const room = await Room.create({
    hotelId,
    type,
    pricePerNight,
    availability,
  });

  if (!room) {
    throw new ApiError(500, "Something went wrong while creating the room");
  }

  // Return success response
  return res.status(201).json({
    success: true,
    statusCode: 201,
    data: room,
    message: "Room created successfully",
  });
});

// Get all rooms with optional pagination
const getAllRooms = asyncHandler(async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Aggregate query to get all rooms with pagination
    const rooms = await Room.aggregate([
      { $match: {} }, // Match all rooms (you can add filters if needed)
      { $skip: (page - 1) * limit },
      { $limit: parseInt(limit) },
    ]).option({ allowDiskUse: true });

    // Get total count of rooms for pagination metadata
    const totalRooms = await Room.countDocuments();

    // Create pagination response
    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalRooms / limit),
      totalRooms,
    };

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { rooms, pagination },
          "Rooms retrieved successfully",
        ),
      );
  } catch (error) {
    next(error);
  }
});

// Get a specific room by ID
const getRoomById = asyncHandler(async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.roomId);
    if (!room) {
      throw new ApiError(404, "Room not found");
    }
    res
      .status(200)
      .json(new ApiResponse(200, room, "Room retrieved successfully"));
  } catch (error) {
    next(error);
  }
});

// Update room details
const updateRoom = asyncHandler(async (req, res, next) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.roomId, req.body, {
      new: true,
    });
    if (!room) {
      throw new ApiError(404, "Room not found");
    }
    res
      .status(200)
      .json(new ApiResponse(200, room, "Room updated successfully"));
  } catch (error) {
    next(error);
  }
});

// Delete a room
const deleteRoom = asyncHandler(async (req, res, next) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.roomId);
    if (!room) {
      throw new ApiError(404, "Room not found");
    }
    res
      .status(200)
      .json(new ApiResponse(200, null, "Room deleted successfully"));
  } catch (error) {
    next(error);
  }
});

export { createRoom, getAllRooms, getRoomById, updateRoom, deleteRoom };
