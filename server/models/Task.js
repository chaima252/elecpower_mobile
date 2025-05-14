const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
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
        enum: ["not started", "in progress", "completed"],
        default: "not started",
    },
    priority: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium",
    },
    deadline: {
        type: Date,
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: true,
    },
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    notes: {
        type: String,
        required: false,
    },
}, { timestamps: true });

const Task = mongoose.model("Task", TaskSchema);

module.exports = Task;