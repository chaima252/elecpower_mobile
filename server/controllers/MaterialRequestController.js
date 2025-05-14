const MaterialRequest = require("../models/MaterialRequest");
const e = require("../utils/error");
const mongoose = require('mongoose');

const createRequest = async (req, res) => {
  try {
    const request = await MaterialRequest.create({
      ...req.body,
      status: "pending",
    });
    res.status(200).json(request);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get total requested quantity for a specific material
const getTotalRequestedForMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;

    const totalRequested = await MaterialRequest.aggregate([
      {
        $match: {
          material: new mongoose.Types.ObjectId(materialId),
          status: { $in: ["pending", "approved"] } // Only count active requests
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$requestedQuantity" }
        }
      }
    ]);

    res.status(200).json({
      totalRequested: totalRequested.length > 0 ? totalRequested[0].total : 0
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createRequest,
  getTotalRequestedForMaterial,
};
