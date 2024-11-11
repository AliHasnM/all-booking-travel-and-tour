import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

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
const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  // Ensure either username or email is provided
  if (!(username || email)) {
    throw new ApiError(400, "Username or email is required");
  }

  // Find the user by either username or email within contactInfo
  const user = await User.findOne({
    $or: [{ username }, { "contactInfo.email": email }],
  });

  // If the user is not found, return an error
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  // Validate the provided password
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  // Generate access and refresh tokens
  const { accessToken, refreshToken } = await generateTokens(user._id);

  // Find the logged-in user and exclude password and refreshToken fields
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  // Cookie options for storing tokens
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Secure only in production
    sameSite: "Strict",
  };

  // Send the tokens as cookies and user data as JSON, excluding sensitive fields
  res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
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
};
