const mongoose = require("mongoose");

const VerificationSchema = new mongoose.Schema(
  {
    cabinetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ElectricalCabinet",
      required: true,
    },
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Material",
      required: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    verified: { type: Boolean, default: false },
    missingQuantity: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Verification", VerificationSchema);
