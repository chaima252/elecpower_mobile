const mongoose = require("mongoose");

const IncidentReportSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["minor", "major", "critical"],
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ["open", "in review", "resolved"],
        default: "open",
    },
    date: {
        type: Date,
        default: Date.now,
        required: true,
    },
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: true,
    },
    images: [{
        type: String, 
    }],
    
    resolutionNotes: {
        type: String,
        required: false, 
    },
}, { timestamps: true });

const IncidentReport = mongoose.model("IncidentReport", IncidentReportSchema);

module.exports = IncidentReport;