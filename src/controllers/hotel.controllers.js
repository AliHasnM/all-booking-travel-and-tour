import { Hotel } from "../models/hotel.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"; // Assuming Cloudinary upload utility
import mongoose from "mongoose";

// Create Hotel
const createHotel = asyncHandler(async (req, res) => {
  const {
    hotelName,
    location,
    description,
    rating,
    priceRange,
    checkInTime,
    checkOutTime,
    amenities,
    rooms,
    website,
    contactInfo, // Ensure it's included
  } = req.body;

  let parsedLocation, parsedContactInfo;

  // Parse location and contactInfo if sent as a stringified JSON
  try {
    if (typeof location === "string") {
      parsedLocation = JSON.parse(location); // Parse location
    } else {
      parsedLocation = location;
    }

    if (typeof contactInfo === "string") {
      parsedContactInfo = JSON.parse(contactInfo); // Parse contactInfo if string
    } else {
      parsedContactInfo = contactInfo;
    }
  } catch (err) {
    throw new ApiError(400, "Invalid format for location or contactInfo");
  }

  // Validate all required fields
  if (
    !hotelName ||
    !parsedLocation?.city ||
    !parsedLocation?.address ||
    !checkInTime ||
    !checkOutTime ||
    !parsedContactInfo?.email ||
    !parsedContactInfo?.phone ||
    !amenities ||
    !req.files?.hotelProfile || // Ensure the file is uploaded
    req.files?.hotelProfile.length === 0 // Ensure there is at least one file
  ) {
    throw new ApiError(400, "All required fields are mandatory");
  }

  // Check if a hotel with the same name already exists
  const existingHotel = await Hotel.findOne({ hotelName });
  if (existingHotel) {
    throw new ApiError(409, "Hotel name already exists");
  }

  // Handle profile image upload (optional)
  const profileImageLocalPath = req.files?.hotelProfile[0]?.path;
  if (!profileImageLocalPath) {
    throw new ApiError(400, "Hotel profile image file is required");
  }

  const uploadedProfileImage = await uploadOnCloudinary(profileImageLocalPath);
  if (!uploadedProfileImage) {
    throw new ApiError(400, "Profile image upload failed");
  }

  // Create a new hotel
  const hotel = await Hotel.create({
    hotelName,
    location: parsedLocation,
    description,
    contactInfo: parsedContactInfo, // Include contactInfo (now parsed as an object)
    rating: rating || 0, // Default rating is 0 if not provided
    amenities: amenities || [], // Default empty array if not provided
    priceRange,
    checkInTime,
    checkOutTime,
    hotelProfile: uploadedProfileImage.url,
    rooms: rooms || [], // Default empty array if not provided
    website: website || "", // Default empty string if not provided
  });

  // Check if the hotel creation was successful
  if (!hotel) {
    throw new ApiError(500, "Something went wrong while creating the hotel");
  }

  // Return a success response
  return res
    .status(201)
    .json(new ApiResponse(201, hotel, "Hotel created successfully"));
});

// Get all Hotels with pagination
const getAllHotels = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, city, minRating, maxPriceRange } = req.query;

  // Pagination and sorting options
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: { createdAt: -1 }, // Sort by creation date (latest first)
    projection: { __v: 0 }, // Exclude MongoDB version key from results
  };

  // Filter based on query parameters
  const matchConditions = {};

  if (city) matchConditions["location.city"] = city;
  if (minRating) matchConditions.rating = { $gte: parseFloat(minRating) };
  if (maxPriceRange) matchConditions.priceRange = { $lte: maxPriceRange };

  // Aggregate pipeline with match, sort, and project stages
  const aggregate = Hotel.aggregate([
    { $match: matchConditions },
    { $sort: { createdAt: -1 } },
    {
      $project: {
        hotelName: 1,
        location: 1,
        rating: 1,
        amenities: 1,
        priceRange: 1,
        hotelProfile: 1,
        checkInTime: 1,
        checkOutTime: 1,
      },
    },
  ]);

  // Paginate results
  const hotels = await Hotel.aggregatePaginate(aggregate, options);

  // Return paginated list of hotels
  return res
    .status(200)
    .json(new ApiResponse(200, hotels, "Hotels fetched successfully"));
});

// Get Hotel by ID
const getHotelById = asyncHandler(async (req, res) => {
  const { hotelId } = req.params;

  // Find hotel by ID
  const hotel = await Hotel.findById(hotelId);
  if (!hotel) {
    throw new ApiError(404, "Hotel not found");
  }

  // Return hotel details
  return res
    .status(200)
    .json(new ApiResponse(200, hotel, "Hotel details fetched successfully"));
});

// Update Hotel
const updateHotel = asyncHandler(async (req, res) => {
  const { hotelId } = req.params;
  const {
    hotelName,
    location,
    contactInfo,
    description,
    rating,
    amenities,
    priceRange,
    checkInTime,
    checkOutTime,
  } = req.body;

  // Parse contactInfo (if it's a stringified JSON)
  let parsedContactInfo = {};
  if (contactInfo) {
    try {
      parsedContactInfo = JSON.parse(contactInfo);
    } catch (error) {
      throw new ApiError(400, "Invalid contactInfo format");
    }
  }

  // Parse location (if it's a stringified JSON)
  let parsedLocation = {};
  if (location) {
    try {
      parsedLocation =
        typeof location === "string" ? JSON.parse(location) : location;
    } catch (error) {
      throw new ApiError(400, "Invalid location format");
    }
  }

  // Find existing hotel data
  const hotel = await Hotel.findById(hotelId);
  if (!hotel) {
    throw new ApiError(404, "Hotel not found");
  }

  // Handle profile image update
  let updatedProfileImage = hotel.hotelProfile; // Default to existing profile image
  if (req.files?.hotelProfile) {
    const profileImageLocalPath = req.files.hotelProfile[0]?.path;
    if (!profileImageLocalPath) {
      throw new ApiError(400, "Invalid profile image file");
    }

    // Upload the new profile image
    const uploadedProfileImage = await uploadOnCloudinary(
      profileImageLocalPath,
    );
    if (!uploadedProfileImage) {
      throw new ApiError(500, "Failed to upload profile image");
    }

    // Set the updated profile image URL
    updatedProfileImage = uploadedProfileImage.url;
  }

  // Update hotel details
  hotel.hotelName = hotelName || hotel.hotelName;
  hotel.location = parsedLocation || hotel.location; // Use parsedLocation
  hotel.contactInfo = parsedContactInfo || hotel.contactInfo;
  hotel.description = description || hotel.description;
  hotel.rating = rating || hotel.rating;
  hotel.amenities = amenities || hotel.amenities;
  hotel.priceRange = priceRange || hotel.priceRange;
  hotel.checkInTime = checkInTime || hotel.checkInTime;
  hotel.checkOutTime = checkOutTime || hotel.checkOutTime;
  hotel.hotelProfile = updatedProfileImage;

  // Save the updated hotel
  await hotel.save();

  return res
    .status(200)
    .json(new ApiResponse(200, hotel, "Hotel updated successfully"));
});

const deleteHotel = asyncHandler(async (req, res) => {
  const { hotelId } = req.params;

  // Validate hotel ID
  if (!mongoose.isValidObjectId(hotelId)) {
    throw new ApiError(400, "Invalid hotel ID");
  }

  // Find and delete the hotel
  const hotel = await Hotel.findByIdAndDelete(hotelId);
  if (!hotel) {
    throw new ApiError(404, "Hotel not found");
  }

  // Return success response
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Hotel deleted successfully"));
});

export { createHotel, getAllHotels, getHotelById, updateHotel, deleteHotel };
