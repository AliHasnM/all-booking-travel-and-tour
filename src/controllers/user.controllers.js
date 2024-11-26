import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { Booking } from "../models/booking.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// Function to generate access and refresh tokens
const generateTokens = async (userId) => {
  try {
    // Find user by ID
    const user = await User.findById(userId);

    // Generate access and refresh tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Save the refresh token to the user document
    user.refreshToken = refreshToken;
    await user.save({ ValiditeBeforeSave: false });

    // Return the generated tokens
    return { accessToken, refreshToken };
  } catch (error) {
    // Throw an error if something goes wrong
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token",
    );
  }
};
// const generateTokens = async (userId) => {
//   const user = await User.findById(userId);
//   const accessToken = user.generateAccessToken();
//   const refreshToken = user.generateRefreshToken();

//   user.refreshToken = refreshToken;
//   await user.save();

//   return { accessToken, refreshToken };
// };

// Register user (Complete)
// Register user (Complete)
const registerUser = asyncHandler(async (req, res) => {
  const { username, password, role, contactInfo } = req.body;

  if (!username || !password || !role || !contactInfo) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({
    $or: [{ username }, { "contactInfo.email": contactInfo.email }],
  });

  if (existingUser) {
    throw new ApiError(409, "Username or email already exists");
  }

  const user = await User.create({
    username,
    password,
    role,
    contactInfo,
  });

  // Retrieve the created user without the password and refreshToken fields
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // Generate tokens and set refresh token in cookies
  const { accessToken, refreshToken } = await generateTokens(user._id);

  res
    .status(201)
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    })
    .json(
      new ApiResponse(
        201,
        { user: createdUser, accessToken },
        "User registered successfully",
      ),
    );
});

// Login user
// const loginUser = asyncHandler(async (req, res) => {
//   const { username, email, password } = req.body;

//   // Ensure either username or email is provided
//   if (!(username || email)) {
//     throw new ApiError(400, "Username or email is required");
//   }

//   // Find the user by either username or email within contactInfo
//   const user = await User.findOne({
//     $or: [{ username }, { "contactInfo.email": email }],
//   });

//   // If the user is not found, return an error
//   if (!user) {
//     throw new ApiError(404, "User does not exist");
//   }

//   // Validate the provided password
//   const isPasswordValid = await user.isPasswordCorrect(password);
//   if (!isPasswordValid) {
//     throw new ApiError(401, "Invalid credentials");
//   }

//   // Generate access and refresh tokens
//   const { accessToken, refreshToken } = await generateTokens(user._id);

//   // Find the logged-in user and exclude password and refreshToken fields
//   const loggedInUser = await User.findById(user._id).select(
//     "-password -refreshToken",
//   );

//   // Cookie options for storing tokens
//   const cookieOptions = {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === "production", // Secure only in production
//     sameSite: "Strict",
//   };

//   // Send the tokens as cookies and user data as JSON, excluding sensitive fields
//   return res
//     .status(200)
//     .cookie("accessToken", accessToken, cookieOptions)
//     .cookie("refreshToken", refreshToken, cookieOptions)
//     .json(
//       new ApiResponse(
//         200,
//         {
//           user: {
//             ...loggedInUser.toObject(), // Ensure loggedInUser is a plain object
//             role: user.role, // Add the role directly inside the user object
//           },
//           accessToken,
//           refreshToken,
//           id: user._id,
//           username: user.username,
//           email: user.email,
//           role: user.role,
//         },
//         "Login successful",
//       ),
//     );
// });
const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!(username || email) || !password) {
    throw new ApiError(400, "Username or email and password are required");
  }

  // Find the user by either username or email
  const user = await User.findOne({
    $or: [{ username }, { "contactInfo.email": email }],
  });

  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  // Compare passwords
  const isPasswordMatch = await bcrypt.compare(password, user.password);

  if (!isPasswordMatch) {
    throw new ApiError(401, "Invalid credentials");
  }

  // Generate access and refresh tokens
  const accessToken = jwt.sign(
    {
      _id: user._id,
      username: user.username,
      role: user.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "1d" },
  );

  const refreshToken = jwt.sign(
    { _id: user._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" },
  );

  // Update user with the new refresh token in DB (optional)
  user.refreshToken = refreshToken;
  await user.save();

  // Configure cookies
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  };

  // Send response with cookies and accessToken
  res
    .status(200)
    .cookie("accessToken", accessToken, { ...cookieOptions, maxAge: 3600000 }) // 1 hour
    .cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 604800000,
    }) // 7 days
    .json(
      new ApiResponse(
        200,
        {
          user: {
            _id: user._id,
            username: user.username,
            role: user.role,
            contactInfo: user.contactInfo,
            dateJoined: user.dateJoined,
          },
          accessToken, // Include accessToken in response as well
          refreshToken,
        },
        "Login successful",
      ),
    );
});

// Logout user
const logoutUser = asyncHandler(async (req, res) => {
  // Clear the refresh token of the user
  await User.findByIdAndUpdate(
    req.user._id,
    { $set: { refreshToken: undefined } },
    { new: true },
  );

  // Cookie options for storing tokens
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Secure only in production
    sameSite: "Strict",
  };
  // Send a response indicating the user has logged out
  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

// Refresh access token
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token is Expired or Used");
    }

    // Cookie options for storing tokens
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Secure only in production
      sameSite: "Strict",
    };

    const { accessToken, newRefreshToken } = await generateTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", newRefreshToken, cookieOptions)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access Token Refreshed",
        ),
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh Token");
  }
});

// Change password
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  // Find the user by their ID
  const user = await User.findById(req.user?._id);
  // Check if the old password is correct
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  // If the old password is incorrect, throw an error
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid Old Password");
  }

  // Set the new password
  user.password = newPassword;
  // Save the user without validating the password before save
  await user.save({ ValiditeBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Change Successfully"));
});

// Get user profile
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "-password -refreshToken",
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, user, "User profile fetched successfully"));
});

// Update user profile
const updateUserProfile = asyncHandler(async (req, res) => {
  const { username, contactInfo } = req.body;

  // If username or contactInfo is missing, throw an error
  if (!username || !contactInfo) {
    throw new ApiError(400, "All fields are required");
  }

  // Find the user by their ID and update their details
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        username: username,
        contactInfo: contactInfo,
      },
    },
    { new: true },
  ).select("-password");

  // Return a success response with the updated user details
  return res
    .status(200)
    .json(new ApiResponse(200, user, "User profile updated successfully"));
});

// Controller to handle Admin Dashboard
const adminDashboard = async (req, res) => {
  try {
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Welcome to Admin Dashboard"));
  } catch (error) {
    throw new ApiError(500, "Internal Server Error");
  }
};

// Controller to handle TravelCompany Dashboard
const travelCompanyDashboard = async (req, res) => {
  try {
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Welcome to TravelCompany Dashboard"));
  } catch (error) {
    throw new ApiError(500, "Internal Server Error");
  }
};

// Controller to handle Hotel Dashboard
const hotelDashboard = async (req, res) => {
  try {
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Welcome to Hotel Dashboard"));
  } catch (error) {
    throw new ApiError(500, "Internal Server Error");
  }
};

// Controller to handle Passenger Dashboard
const passengerDashboard = async (req, res) => {
  try {
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Welcome to Passenger Dashboard"));
  } catch (error) {
    throw new ApiError(500, "Internal Server Error");
  }
};
// --------------- Admin Controller for TravelCompany ---------------
// Add a new travel company
const addTravelCompany = asyncHandler(async (req, res) => {
  const { username, password, contactInfo } = req.body;

  if (
    !username ||
    !password ||
    !contactInfo ||
    !contactInfo.email ||
    !contactInfo.phone ||
    !contactInfo.address
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Ensure only Admin can add a TravelCompany
  if (req.user.role !== "Admin") {
    throw new ApiError(403, "Access denied. Admins only.");
  }

  // Check if a user with the same username or email already exists
  const existingUser = await User.findOne({
    $or: [{ username }, { "contactInfo.email": contactInfo.email }],
  });

  if (existingUser) {
    throw new ApiError(409, "Username or email already exists");
  }

  // Create a new TravelCompany user
  const travelCompany = await User.create({
    username,
    password,
    role: "TravelCompany",
    contactInfo,
  });

  // Exclude sensitive fields like password and refreshToken from the response
  const createdTravelCompany = await User.findById(travelCompany._id).select(
    "-password -refreshToken",
  );

  if (!createdTravelCompany) {
    throw new ApiError(500, "Failed to add the Travel Company");
  }

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        createdTravelCompany,
        "Travel Company added successfully",
      ),
    );
});

// Get all travel companies
const getAllTravelCompanies = asyncHandler(async (req, res) => {
  // Ensure only Admin can fetch TravelCompany data
  if (req.user.role !== "Admin") {
    throw new ApiError(403, "Access denied. Admins only.");
  }

  // Fetch all users with the role of TravelCompany
  const travelCompanies = await User.find({ role: "TravelCompany" }).select(
    "-password -refreshToken",
  );

  if (!travelCompanies || travelCompanies.length === 0) {
    throw new ApiError(404, "No Travel Companies found");
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        travelCompanies,
        "Travel Companies retrieved successfully",
      ),
    );
});

// Update a travel company by ID
const updateTravelCompany = asyncHandler(async (req, res) => {
  const { companyId } = req.params;
  const { username, contactInfo } = req.body;

  if (!companyId) {
    throw new ApiError(400, "Travel Company ID is required");
  }

  // Ensure only Admin can update a TravelCompany
  if (req.user.role !== "Admin") {
    throw new ApiError(403, "Access denied. Admins only.");
  }

  // Find the TravelCompany by ID
  const travelCompany = await User.findOne({
    _id: companyId,
    role: "TravelCompany",
  });

  if (!travelCompany) {
    throw new ApiError(404, "Travel Company not found");
  }

  // Update the fields provided in the request
  if (username) travelCompany.username = username;
  if (contactInfo) {
    if (contactInfo.email) travelCompany.contactInfo.email = contactInfo.email;
    if (contactInfo.phone) travelCompany.contactInfo.phone = contactInfo.phone;
    if (contactInfo.address)
      travelCompany.contactInfo.address = contactInfo.address;
  }

  // Save the updated document
  const updatedTravelCompany = await travelCompany.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedTravelCompany,
        "Travel Company updated successfully",
      ),
    );
});

// Delete a travel company by ID
const deleteTravelCompany = asyncHandler(async (req, res) => {
  const { companyId } = req.params;

  if (!companyId) {
    throw new ApiError(400, "Travel Company ID is required");
  }

  // Ensure only Admin can delete a TravelCompany
  if (req.user.role !== "Admin") {
    throw new ApiError(403, "Access denied. Admins only.");
  }

  // Find and delete the TravelCompany by ID
  const travelCompany = await User.findOneAndDelete({
    _id: companyId,
    role: "TravelCompany",
  });

  if (!travelCompany) {
    throw new ApiError(404, "Travel Company not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Travel Company deleted successfully"));
});

// --------------- Admin Controller for Hotel ---------------
// Add a new hotel
const addHotel = asyncHandler(async (req, res) => {
  const { username, password, contactInfo } = req.body;

  if (
    !username ||
    !password ||
    !contactInfo ||
    !contactInfo.email ||
    !contactInfo.phone ||
    !contactInfo.address
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Ensure only Admin can add a Hotel
  if (req.user.role !== "Admin") {
    throw new ApiError(403, "Access denied. Admins only.");
  }

  // Check if a user with the same username or email already exists
  const existingUser = await User.findOne({
    $or: [{ username }, { "contactInfo.email": contactInfo.email }],
  });

  if (existingUser) {
    throw new ApiError(409, "Username or email already exists");
  }

  // Create a new Hotel user
  const hotel = await User.create({
    username,
    password,
    role: "Hotel",
    contactInfo,
  });

  // Exclude sensitive fields like password and refreshToken from the response
  const createdHotel = await User.findById(hotel._id).select(
    "-password -refreshToken",
  );

  if (!createdHotel) {
    throw new ApiError(500, "Failed to add the Hotel");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdHotel, "Hotel added successfully"));
});

// Get all Hotels
const getAllHotel = asyncHandler(async (req, res) => {
  // Ensure only Admin can fetch Hotel data
  if (req.user.role !== "Admin") {
    throw new ApiError(403, "Access denied. Admins only.");
  }

  // Fetch all users with the role of Hotel
  const hotels = await User.find({ role: "Hotel" }).select(
    "-password -refreshToken",
  );

  if (!hotels || hotels.length === 0) {
    throw new ApiError(404, "No Hotel found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, hotels, "Hotels retrieved successfully"));
});

// Update a Hotel by ID
const updateHotel = asyncHandler(async (req, res) => {
  const { hotelId } = req.params;
  const { username, contactInfo } = req.body;

  if (!hotelId) {
    throw new ApiError(400, "Hotel ID is required");
  }

  // Ensure only Admin can update a Hotel
  if (req.user.role !== "Admin") {
    throw new ApiError(403, "Access denied. Admins only.");
  }

  // Find the Hotel by ID
  const hotel = await User.findOne({
    _id: hotelId,
    role: "Hotel",
  });

  if (!hotel) {
    throw new ApiError(404, "Hotel not found");
  }

  // Update the fields provided in the request
  if (username) hotel.username = username;
  if (contactInfo) {
    if (contactInfo.email) hotel.contactInfo.email = contactInfo.email;
    if (contactInfo.phone) hotel.contactInfo.phone = contactInfo.phone;
    if (contactInfo.address) hotel.contactInfo.address = contactInfo.address;
  }

  // Save the updated document
  const updatedHotel = await hotel.save();

  return res
    .status(200)
    .json(new ApiResponse(200, updatedHotel, "Hotel updated successfully"));
});

// Delete a Hotel by ID
const deleteHotel = asyncHandler(async (req, res) => {
  const { hotelId } = req.params;

  if (!hotelId) {
    throw new ApiError(400, "Hotel ID is required");
  }

  // Ensure only Admin can delete a Hotel
  if (req.user.role !== "Admin") {
    throw new ApiError(403, "Access denied. Admins only.");
  }

  // Find and delete the Hotel by ID
  const hotel = await User.findOneAndDelete({
    _id: hotelId,
    role: "Hotel",
  });

  if (!hotelId) {
    throw new ApiError(404, "Hotel not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Hotel deleted successfully"));
});

// --------------- Admin Controller for Hotel ---------------
// Get all Hotels
const getAllPassenger = asyncHandler(async (req, res) => {
  // Ensure only Admin can fetch Hotel data
  if (req.user.role !== "Admin") {
    throw new ApiError(403, "Access denied. Admins only.");
  }

  // Fetch all users with the role of Passenger
  const passenger = await User.find({ role: "Passenger" }).select(
    "-password -refreshToken",
  );

  if (!passenger || passenger.length === 0) {
    throw new ApiError(404, "No Passenger found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, passenger, "Passenger retrieved successfully"));
});

// Delete a Passenger by ID
const deletePassenger = asyncHandler(async (req, res) => {
  const { passengerId } = req.params;

  if (!passengerId) {
    throw new ApiError(400, "Passenger ID is required");
  }

  // Ensure only Admin can delete a Hotel
  if (req.user.role !== "Admin") {
    throw new ApiError(403, "Access denied. Admins only.");
  }

  // Find and delete the Passenger by ID
  const passenger = await User.findOneAndDelete({
    _id: passengerId,
    role: "Passenger",
  });

  if (!passengerId) {
    throw new ApiError(404, "Passenger not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Passenger deleted successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getUserProfile,
  updateUserProfile,
  adminDashboard,
  travelCompanyDashboard,
  hotelDashboard,
  passengerDashboard,
  addTravelCompany,
  deleteTravelCompany,
  updateTravelCompany,
  getAllTravelCompanies,
  addHotel,
  getAllHotel,
  updateHotel,
  deleteHotel,
  getAllPassenger,
  deletePassenger,
};
