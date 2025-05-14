const mongoose = require("mongoose");

const QRCodeSchema = new mongoose.Schema({
    code: {
    type: String,
    required: true,
    unique: true,
    },
    lastScannedAt: {
        type: Date,
    },
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active",
    },
    data: {
        type: String, 
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: true,
    },
    electricalCabinet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ElectricalCabinet",
    },
}, { timestamps: true });

const QRCode = mongoose.model("QRCode", QRCodeSchema);

module.exports = QRCode;