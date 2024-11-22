import { Route } from "../models/routeCompnay.model.js";
import { ApiError } from "../utils/ApiError.js";

import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
// Create a new route
const createRoute = asyncHandler(async (req, res) => {
  const { companyId } = req.params;

  const { departure, arrival, price, seats } = req.body;

  // Validate companyId
  if (!companyId) {
    throw new ApiError(400, "Company ID is required");
  }

  // Validate departure object
  if (!departure || !departure.location || !departure.date || !departure.time) {
    throw new ApiError(400, "Departure must include location, date, and time");
  }

  // Validate arrival object
  if (!arrival || !arrival.location || !arrival.date || !arrival.time) {
    throw new ApiError(400, "Arrival must include location, date, and time");
  }

  // Validate price
  if (!price || price < 0) {
    throw new ApiError(400, "Price must be a positive number");
  }

  // Validate seats array
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

  // Create route
  const route = await Route.create({
    companyId,
    departure,
    arrival,
    price,
    seats,
  });

  if (!route) {
    throw new ApiError(500, "Something went wrong while creating the route");
  }

  return res.status(201).json({
    success: true,
    statusCode: 201,
    data: route,
    message: "Route created successfully",
  });
});

const getAllRoutes = asyncHandler(async (req, res, next) => {
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
});

// Get a specific route by ID
const getRouteById = asyncHandler(async (req, res, next) => {
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
});

// Update Route details
const updateRoute = asyncHandler(async (req, res, next) => {
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
});

// const updateRoute = asyncHandler(async (req, res, next) => {
//   const { companyId, routeId } = req.params;
//   const { departure, arrival, price, seats } = req.body;

//   console.log("Company ID from params:", companyId);
//   console.log("Route ID from params:", routeId);

//   // Validate companyId
//   if (!companyId) {
//     throw new ApiError(400, "Company ID is required");
//   }

//   // Validate routeId
//   if (!routeId) {
//     throw new ApiError(400, "Route ID is required");
//   }

//   // Validate departure object
//   if (!departure || !departure.location || !departure.date || !departure.time) {
//     throw new ApiError(400, "Departure must include location, date, and time");
//   }

//   // Validate arrival object
//   if (!arrival || !arrival.location || !arrival.date || !arrival.time) {
//     throw new ApiError(400, "Arrival must include location, date, and time");
//   }

//   // Validate price
//   if (!price || price < 0) {
//     throw new ApiError(400, "Price must be a positive number");
//   }

//   // Validate seats array
//   if (
//     !Array.isArray(seats) ||
//     seats.some(
//       (seat) => !seat.seatNumber || typeof seat.availability !== "boolean",
//     )
//   ) {
//     throw new ApiError(
//       400,
//       "Seats must be an array with seatNumber and availability properties",
//     );
//   }

//   // Find the route by companyId and routeId and update it
//   const route = await Route.findOneAndUpdate(
//     { _id: routeId, companyId }, // Ensure the companyId matches
//     { departure, arrival, price, seats },
//     { new: true },
//   );

//   if (!route) {
//     throw new ApiError(404, "Route not found or companyId mismatch");
//   }

//   return res.status(200).json({
//     success: true,
//     statusCode: 200,
//     message: "Route updated successfully",
//   });
// });

// Delete a Route
const deleteRoute = asyncHandler(async (req, res, next) => {
  try {
    const route = await Route.findByIdAndDelete(req.params.routeId);
    if (!route) {
      throw new ApiError(404, "Route not found");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Route deleted successfully"));
  } catch (error) {
    next(error);
  }
});

export { createRoute, getAllRoutes, getRouteById, updateRoute, deleteRoute };
