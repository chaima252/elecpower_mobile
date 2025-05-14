const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ["not started", "in progress", "completed"],
        default: "not started",
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    destination: {
        type: String,
        required: true,
    },
    employees: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    tasks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
    }],
    electricalCabinetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ElectricalCabinet",
        default: null,
    },
    incidentReports: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "IncidentReport",
    }],
    }, { timestamps: true });

const Project = mongoose.model("Project", ProjectSchema);

module.exports = Project;