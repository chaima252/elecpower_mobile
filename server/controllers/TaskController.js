const Task = require("../models/Task");
const Project = require("../models/Project");
const e = require("../utils/error");
const jwt = require("jsonwebtoken");

// Create a new Task
const createTask = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { name, description, status, priority, deadline, notes } = req.body;

    // Validate required fields
    if (!name) {
      return next(e.errorHandler(400, "Name is required"));
    }

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return next(e.errorHandler(404, "Project not found"));
    }

    // Create a new task
    const task = new Task({
      name,
      description: description || "",
      status: status || "not started",
      priority: priority || "medium",
      deadline: deadline ? new Date(deadline) : null, // Fix: Use null for optional Date
      projectId,
      notes: notes || "",
      employeeId: req.body.employeeId || null,
    });

    // Save the task
    await task.save();

    // Add task to project's tasks array
    project.tasks.push(task._id);
    await project.save();

    // Populate task details
    const populatedTask = await Task.findById(task._id)
      .populate("projectId", "name description")
      .populate("employeeId", "firstName email");

    res.status(201).json({ success: true, data: populatedTask });
  } catch (error) {
    next(error);
  }
};

// Get all tasks for a specific project
const getTasksByProjectId = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const tasks = await Task.find({ projectId })
      .populate("projectId", "name description")
      .populate("employeeId", "firstName email");
    res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
};

// Get all tasks
const getAllTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find()
      .populate("projectId", "name description")
      .populate("employeeId", "firstName email");
    res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
};

// Get a task by ID
const getTaskById = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId)
      .populate("projectId", "name description")
      .populate("employeeId", "firstName email");
    if (!task) {
      return next(e.errorHandler(404, "Task not found"));
    }
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

// Update a task by ID
const updateTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { status, name, description, priority, deadline, notes } = req.body;

    // Check if the task exists
    const task = await Task.findById(taskId);
    if (!task) {
      return next(e.errorHandler(404, "Task not found"));
    }

    // Update task
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      {
        status,
        name,
        description,
        priority,
        deadline: deadline ? new Date(deadline) : null,
        notes,
      },
      { new: true }
    )
      .populate("projectId", "name description")
      .populate("employeeId", "firstName email");

    // Update project status based on task status
    if (status) {
      const project = await Project.findById(task.projectId);
      if (!project) {
        return next(e.errorHandler(404, "Project not found"));
      }

      const tasks = await Task.find({ projectId: task.projectId });
      if (status === 'in progress' && project.status === 'not started') {
        project.status = 'in progress';
        await project.save();
      } else if (status === 'completed') {
        const allCompleted = tasks.every(t => t.status === 'completed');
        if (allCompleted && project.status !== 'completed') {
          project.status = 'completed';
          await project.save();
        }
      } else if (status === 'not started') {
        const noProgress = tasks.every(t => t.status === 'not started');
        if (noProgress && project.status !== 'not started') {
          project.status = 'not started';
          await project.save();
        }
      }
    }

    res.status(200).json({ success: true, data: updatedTask });
  } catch (error) {
    next(error);
  }
};

// Delete a task by ID
const deleteTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);
    if (!task) {
      return next(e.errorHandler(404, "Task not found"));
    }

    // Remove task from project's tasks array
    await Project.findByIdAndUpdate(task.projectId, {
      $pull: { tasks: taskId },
    });

    await Task.findByIdAndDelete(taskId);
    res.status(200).json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// Assign an employee to a task
const assignEmployeeToTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { employeeId } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return next(e.errorHandler(404, "Task not found"));
    }

    task.employeeId = employeeId;
    await task.save();

    const populatedTask = await Task.findById(taskId)
      .populate("projectId", "name description")
      .populate("employeeId", "firstName email");

    res.status(200).json({ success: true, data: populatedTask });
  } catch (error) {
    next(error);
  }
};

// Self-assign current employee to a task
// const selfAssignToTask = async (req, res, next) => {
//   try {
//     const { taskId } = req.params;
//     const employeeId = req.user.id; // Assuming auth middleware provides user ID

//     const task = await Task.findById(taskId);
//     if (!task) {
//       return next(e.errorHandler(404, "Task not found"));
//     }

//     // Verify employee is part of the project
//     const project = await Project.findById(task.projectId);
//     if (!project.employees.includes(employeeId)) {
//       return next(e.errorHandler(403, "You are not assigned to this project"));
//     }

//     task.employeeId = employeeId;
//     await task.save();

//     const populatedTask = await Task.findById(taskId)
//       .populate("projectId", "name description")
//       .populate("employeeId", "name email");

//     res.status(200).json({ success: true, data: populatedTask });
//   } catch (error) {
//     next(error);
//   }
// };
const selfAssignToTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const token = req.headers.authorization?.split(' ')[1]; // Extract token from Bearer

    if (!token) {
      return next(e.errorHandler(401, "No token provided"));
    }

    // Decode token to get employeeId
    let employeeId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET); // Replace with your JWT secret
      employeeId = decoded.id || decoded.userId; // Adjust based on your token payload
      if (!employeeId) {
        return next(e.errorHandler(401, "Invalid token: No user ID found"));
      }
    } catch (error) {
      return next(e.errorHandler(401, "Invalid token"));
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return next(e.errorHandler(404, "Task not found"));
    }

    // Verify employee is part of the project
    const project = await Project.findById(task.projectId);
    if (!project.employees.includes(employeeId)) {
      return next(e.errorHandler(403, "You are not assigned to this project"));
    }

    task.employeeId = employeeId;
    await task.save();

    const populatedTask = await Task.findById(taskId)
      .populate("projectId", "name description")
      .populate("employeeId", "firstName email");

    res.status(200).json({ success: true, data: populatedTask });
  } catch (error) {
    next(error);
  }
};
module.exports = {
  createTask,
  getTasksByProjectId,
  assignEmployeeToTask,
  selfAssignToTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
};