import { Route } from "../models/routeCompnay.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Create a new route
const createRoute = asyncHandler(async (req, res) => {
  const { companyId, departure, arrival, price, seats } = req.body;

  // Validate that all required fields are provided
  if (!companyId || !departure || !arrival || !price || !seats) {
    throw new ApiError(
      400,
      "All fields (companyId, departure, arrival, price, seats) are required",
    );
  }

  // Validate price
  if (price < 0) {
    throw new ApiError(400, "Price cannot be negative");
  }

  // Check if seats are in the correct format and availability is a boolean
  if (
    !Array.isArray(seats) ||
    seats.some(
      (seat) => !seat.seatNumber || typeof seat.availability !== "boolean",
    )
  ) {
    throw new ApiError(
      400,
      "Seats must be an array with seatNumber and availability properties",
    );
  }

  // Create a new route from the request body
  const route = await Route.create({
    companyId,
    departure,
    arrival,
    price,
    seats,
  });

  // Check if the route creation was successful
  if (!route) {
    throw new ApiError(500, "Something went wrong while creating the route");
  }

  // Send a success response with the created route
  return res
    .status(201)
    .json(new ApiResponse(201, route, "Route created successfully"));
});

// Get all routes with optional pagination
// export const getAllRoutes = async (req, res, next) => {
//   try {
//     const { page = 1, limit = 10 } = req.query;
//     const routes = await Route.paginate({}, { page, limit });
//     res
//       .status(200)
//       .json(new ApiResponse(200, routes, "Routes retrieved successfully"));
//   } catch (error) {
//     next(error);
//   }
// };
const getAllRoutes = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Aggregate query to get all routes
    const routes = await Route.aggregate([
      { $match: {} }, // Match all routes (you can add conditions here if needed)
      { $skip: (page - 1) * limit }, // Skip based on the page number
      { $limit: parseInt(limit) }, // Limit the results to the specified number
    ]).option({ allowDiskUse: true }); // Enable disk usage if necessary for large datasets

    // Get total count of routes for pagination metadata
    const totalRoutes = await Route.countDocuments();

    // Create the paginated response
    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(totalRoutes / limit),
      totalRoutes,
    };

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { routes, pagination },
          "Routes retrieved successfully",
        ),
      );
  } catch (error) {
    next(error);
  }
};

// Get a specific route by ID
export const getRouteById = async (req, res, next) => {
  try {
    const route = await Route.findById(req.params.routeId);
    if (!route) {
      throw new ApiError(404, "Route not found");
    }
    res
      .status(200)
      .json(new ApiResponse(200, route, "Route retrieved successfully"));
  } catch (error) {
    next(error);
  }
};

// Update Route details
export const updateRoute = async (req, res, next) => {
  try {
    const route = await Route.findByIdAndUpdate(req.params.routeId, req.body, {
      new: true,
    });
    if (!route) {
      throw new ApiError(404, "Route not found");
    }
    res
      .status(200)
      .json(new ApiResponse(200, route, "Route updated successfully"));
  } catch (error) {
    next(error);
  }
};

// Delete a Route
export const deleteRoute = async (req, res, next) => {
  try {
    const route = await Route.findByIdAndDelete(req.params.routeId);
    if (!route) {
      throw new ApiError(404, "Route not found");
    }
    res
      .status(200)
      .json(new ApiResponse(200, null, "Route deleted successfully"));
  } catch (error) {
    next(error);
  }
};

export { createRoute, getAllRoutes };
