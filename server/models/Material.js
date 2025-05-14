const mongoose = require("mongoose");

const MaterialSchema = new mongoose.Schema({

    reference: {
        type: String,
        required: true,
        unique: true,
    },

    designation: {
        type: String,
        required: true,
    },

      totalInStock: { 
        type: Number,
        required: true,
      },

    status: { 
        type: String, 
        enum: ["available", "out of stock", "reserved"], 
        default: "available" 
    },

    // projectId: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Project",
    //     required: true,
    // },
}, { timestamps: true });



const Material = mongoose.model("Material", MaterialSchema);

module.exports = Material;