const mongoose = require("mongoose");

const ElectricalCabinetSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: false,
    },
    status: {
        type: String,
        enum: ["installed", "under maintenance", "decommissioned"],
        default: "installed",
    },
    installationDate: {
        type: Date,
    },
    qrCodeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "QRCode",
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: true,
    },
    materials: [{
        material: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Material",
        },
        quantity: {
          type: Number,
          required: true,
        },
             checked: {
            type: Boolean,
            default: false,
        },
        missing: {
            type: Number,
            default: 0,
        }
      }],
    maintenanceHistory: [{
        date: {
        type: Date,
        },
        description: {
        type: String,
        },
    }],
}, { timestamps: true });

const ElectricalCabinet = mongoose.model("ElectricalCabinet", ElectricalCabinetSchema);

module.exports = ElectricalCabinet;