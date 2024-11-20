import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

// Middleware to verify JWT
// const verifyJWT = asyncHandler(async (req, _, next) => {
//   try {
//     const token =
//       req.cookies?.accessToken ||
//       req.header("Authorization")?.replace("Bearer ", "");

//     if (!token) {
//       throw new ApiError(401, "Unauthorized Request: Token missing");
//     }

//     // Decode the token to get user details
//     const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

//     if (!decodedToken?._id) {
//       throw new ApiError(401, "Unauthorized Request: Invalid token structure");
//     }

//     // Find user by decoded ID
//     const user = await User.findById(decodedToken._id).select(
//       "-password -refreshToken",
//     );

//     if (!user) {
//       throw new ApiError(401, "Invalid Access Token: User not found");
//     }

//     // Attach user information to the request object
//     req.user = user;
//     next();
//   } catch (error) {
//     console.error("Error in verifyJWT:", error);
//     throw new ApiError(401, error?.message || "Invalid Access Token");
//   }
// });
const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    // Extract the token from cookies or Authorization header
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    // Check if token is missing
    if (!token) {
      console.error("No token found in request."); // Log if token is missing
      throw new ApiError(401, "Unauthorized Request: Token missing");
    }

    // Decode the token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Ensure the token contains a valid user ID
    if (!decodedToken?._id) {
      console.error("Decoded token structure is invalid:", decodedToken);
      throw new ApiError(401, "Unauthorized Request: Invalid token structure");
    }

    // Find user by decoded ID
    const user = await User.findById(decodedToken._id).select(
      "-password -refreshToken",
    );

    // If user is not found
    if (!user) {
      console.error("User not found for ID:", decodedToken._id);
      throw new ApiError(401, "Invalid Access Token: User not found");
    }

    // Attach user info to the request object for next middleware
    req.user = user;
    next();
  } catch (error) {
    console.error("Error in verifyJWT:", error.message || error); // Log the error message
    throw new ApiError(401, error?.message || "Invalid Access Token");
  }
});

// Middleware to check user role
const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(403, "Forbidden: You do not have access to this resource"),
      );
    }
    next();
  };
};

export { verifyJWT, checkRole };
