import { TravelCompany } from "../models/travelCompany.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"; // Assuming you have a utility for Cloudinary upload
import mongoose from "mongoose";

// Create Travel Company
const createTravelCompany = asyncHandler(async (req, res) => {
  const { companyName, description } = req.body;
  let contactInfo;

  // Parse contactInfo if sent as JSON string
  try {
    contactInfo =
      typeof req.body.contactInfo === "string"
        ? JSON.parse(req.body.contactInfo)
        : req.body.contactInfo;
  } catch (err) {
    throw new ApiError(400, "Invalid format for contactInfo");
  }

  // Validate that all required fields are provided
  if (
    !companyName ||
    !contactInfo?.email ||
    !contactInfo?.phone ||
    !contactInfo?.address ||
    !description
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Check if a company with the same name already exists
  const existingCompany = await TravelCompany.findOne({ companyName });
  if (existingCompany) {
    throw new ApiError(409, "Company name already exists");
  }

  // Handle profile image upload
  const profileImageLocalPath = req.files?.profileImage[0]?.path;
  if (!profileImageLocalPath) {
    throw new ApiError(400, "Profile image file is required");
  }

  const uploadedProfileImage = await uploadOnCloudinary(profileImageLocalPath);
  if (!uploadedProfileImage) {
    throw new ApiError(400, "Profile image upload failed");
  }

  // Create a new Travel Company with the provided data
  const travelCompany = await TravelCompany.create({
    companyName,
    contactInfo,
    description,
    profileImage: uploadedProfileImage.url,
    routes: [], // Routes will be added separately later
    rating: 0, // Default rating set to 0
  });

  // Check if creation was successful
  if (!travelCompany) {
    throw new ApiError(
      500,
      "Something went wrong while creating the travel company",
    );
  }

  // Send a success response with all company data
  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        travelCompany,
        "Travel Company created successfully",
      ),
    );
});

// Get all Travel Companies with pagination
const getAllTravelCompanies = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  // Parsing page and limit to integers for pagination
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: { createdAt: -1 }, // Sort by creation date in descending order
  };

  // Aggregate pipeline to fetch travel companies
  const aggregate = TravelCompany.aggregate([
    { $sort: { createdAt: -1 } }, // Sorting within the aggregate pipeline
  ]);

  // Paginate the aggregate result
  const travelCompanies = await TravelCompany.aggregatePaginate(
    aggregate,
    options,
  );

  // Return paginated list of travel companies
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        travelCompanies,
        "Travel Companies fetched successfully",
      ),
    );
});
// Get a Travel Company by ID
const getTravelCompanyById = asyncHandler(async (req, res) => {
  const { companyId } = req.params;

  const travelCompany = await TravelCompany.findById(companyId);
  if (!travelCompany) {
    throw new ApiError(404, "Travel Company not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        travelCompany,
        "Travel Company details fetched successfully",
      ),
    );
});

// Update Travel Company details
const updateTravelCompany = asyncHandler(async (req, res) => {
  const { companyId } = req.params;
  const { companyName, contactInfo, description } = req.body;

  // Parse the contactInfo field (stringified JSON to object)
  let parsedContactInfo = {};
  if (contactInfo) {
    try {
      parsedContactInfo = JSON.parse(contactInfo);
    } catch (error) {
      throw new ApiError(400, "Invalid contactInfo format");
    }
  }

  // Fetch the existing travel company data
  const travelCompany = await TravelCompany.findById(companyId);
  if (!travelCompany) {
    throw new ApiError(404, "Travel Company not found");
  }

  // Handle profile image update
  let updatedProfileImage = travelCompany.profileImage; // Default to existing image
  if (req.files?.profileImage) {
    const profileImageLocalPath = req.files.profileImage[0]?.path;
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

  // Update the travel company with new data
  travelCompany.companyName = companyName || travelCompany.companyName;
  travelCompany.contactInfo = parsedContactInfo || travelCompany.contactInfo;
  travelCompany.description = description || travelCompany.description;
  travelCompany.profileImage = updatedProfileImage;

  // Save the updated company
  await travelCompany.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        travelCompany,
        "Travel Company updated successfully",
      ),
    );
});

// Delete Travel Company
const deleteTravelCompany = asyncHandler(async (req, res) => {
  const { companyId } = req.params;

  // Validate the company ID using mongoose's isValidObjectId method
  if (!mongoose.isValidObjectId(companyId)) {
    throw new ApiError(400, "Invalid company ID");
  }

  // Find and delete the travel company
  const travelCompany = await TravelCompany.findByIdAndDelete(companyId);
  if (!travelCompany) {
    throw new ApiError(404, "Travel Company not found");
  }

  // Return success response
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Travel Company deleted successfully"));
});

export {
  createTravelCompany,
  getAllTravelCompanies,
  getTravelCompanyById,
  updateTravelCompany,
  deleteTravelCompany,
};
