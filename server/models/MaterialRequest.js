const mongoose = require("mongoose");

const MaterialRequestSchema = new mongoose.Schema(
  {
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Material",
      required: true,
    },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    cabinet: { type: mongoose.Schema.Types.ObjectId, ref: "ElectricalCabinet" },
    requestedQuantity: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "fulfilled"],
      default: "pending",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    fulfilledAt: Date,
  },
  { timestamps: true }
);

const MaterialRequest = mongoose.model(
  "MaterialRequest",
  MaterialRequestSchema
);

module.exports = MaterialRequest;
