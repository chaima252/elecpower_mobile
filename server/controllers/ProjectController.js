const Project = require("../models/Project");
const e = require("../utils/error");
const User = require("../models/User");


//! Create a new project
const createProject = async (req, res) => {
  try {
    const { name, description, startDate, endDate, destination, employees } =
      req.body;

    // Validate required fields
    if (!name || !description || !startDate || !endDate || !destination) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Create a new project
    const project = new Project({
      name,
      description,
      startDate,
      endDate,
      destination,
      employees: employees || [], // Optional field
    });
      // Update all assigned users
      if (employees && employees.length > 0) {
        await User.updateMany(
          { _id: { $in: employees } },
          { $addToSet: { projects: project._id } }
        );
      }

    // Save the project to the database
    await project.save();

    // Return the created project
    res.status(201).json({ message: "Project created successfully", project });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//! get all projects

const getAllProjects = async (req, res) => {
  try {
    // Fetch all projects from the database
    const projects = await Project.find()
      .populate("employees", "firstName email") // Populate employee details
      // .populate("tasks") // Populate tasks
      // .populate("electricalCabinetId") // Populate armoire details
      // .populate("incidentReports"); // Populate incident reports

    // Return the list of projects
    res.status(200).json({ projects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//! get a project by ID
const getProjectById = async (req, res) => {
    try {
        const { projectId } = req.params;

        // Find the project by ID
        const project = await Project.findById(projectId)
        .populate("employees", "firstName email") // Populate employee details
        // .populate("tasks") // Populate tasks
        .populate("electricalCabinetId") // Populate armoire details
        // .populate("incidentReports"); // Populate incident reports

        // Check if the project exists
        if (!project) {
        return res.status(404).json({ message: "Project not found" });
        }

        // Return the project
        res.status(200).json({ project });
    } catch (error) {
        console.error("Error fetching project:", error);
        res.status(500).json({ message: "Server error" });
    }
};


// const updateProject = async (req, res, next) => {

//   const { projectId } = req.params;
//   const { employees, ...updatedFields } = req.body;
  
//   try {
//       // Check if project exists
//       const project = await Project.findById(projectId);
//       if (!project) {
//           return next(e.errorHandler(404, "Project not found"));
//       }

//       // Get current employees before update
//       const currentEmployees = project.employees || [];

//       // Update project
//       const updatedProject = await Project.findByIdAndUpdate(
//           projectId,
//           { ...updatedFields, employees },
//           { new: true }
//       );

//       // Find employees that were added
//       const addedEmployees = employees?.filter(emp => 
//           !currentEmployees.includes(emp)
//       ) || [];

//       // Find employees that were removed
//       const removedEmployees = currentEmployees.filter(emp => 
//           !employees?.includes(emp)
//       );

//       // Update users' projects arrays
//       if (addedEmployees.length > 0) {
//           await User.updateMany(
//               { _id: { $in: addedEmployees } },
//               { $addToSet: { projects: projectId } }
//           );
//       }

//       if (removedEmployees.length > 0) {
//           await User.updateMany(
//               { _id: { $in: removedEmployees } },
//               { $pull: { projects: projectId } }
//           );
//       }

//       res.status(200).json(updatedProject);
//   } catch (error) {
//       next(error);
//   }
// };

// const updateProject = async (req, res, next) => {
//   const { projectId } = req.params;
//   const { employees, ...updatedFields } = req.body;
  
//   try {
//       // Check if project exists
//       const project = await Project.findById(projectId);
//       if (!project) {
//           return next(e.errorHandler(404, "Project not found"));
//       }

//       // Get current employees before update
//       const currentEmployees = project.employees || [];

//       // Only include employees in update if it was provided in the request
//       const updateData = employees !== undefined 
//           ? { ...updatedFields, employees } 
//           : updatedFields;

//       // Update project
//       const updatedProject = await Project.findByIdAndUpdate(
//           projectId,
//           updateData,
//           { new: true }
//       );

//       // Only process employee changes if employees array was provided
//       if (employees !== undefined) {
//           // Find employees that were added
//           const addedEmployees = employees.filter(emp => 
//               !currentEmployees.includes(emp)
//           ) || [];

//           // Find employees that were removed
//           const removedEmployees = currentEmployees.filter(emp => 
//               !employees.includes(emp)
//           );

//           // Update users' projects arrays
//           if (addedEmployees.length > 0) {
//               await User.updateMany(
//                   { _id: { $in: addedEmployees } },
//                   { $addToSet: { projects: projectId } }
//               );
//           }

//           if (removedEmployees.length > 0) {
//               await User.updateMany(
//                   { _id: { $in: removedEmployees } },
//                   { $pull: { projects: projectId } }
//               );
//           }
//       }

//       res.status(200).json(updatedProject);
//   } catch (error) {
//       next(error);
//   }
// };


const updateProject = async (req, res, next) => {
  const { projectId } = req.params;
  const { employees, ...updatedFields } = req.body;
  
  try {
      // Check if project exists
      const project = await Project.findById(projectId);
      if (!project) {
          return next(e.errorHandler(404, "Project not found"));
      }

      // Get current employees before update
      const currentEmployees = project.employees || [];

      // Prepare update data - only update employees if explicitly provided
      const updateData = { ...updatedFields };
      if (employees !== undefined) {
          updateData.employees = employees;
      }

      // Update project
      const updatedProject = await Project.findByIdAndUpdate(
          projectId,
          updateData,
          { new: true }
      );

      // Only process employee changes if employees array was provided
      if (employees !== undefined) {
          // Convert to strings for comparison
          const currentEmployeesStr = currentEmployees.map(e => e.toString());
          const newEmployeesStr = employees.map(e => e.toString());

          // Find employees that were added
          const addedEmployees = employees.filter(emp => 
              !currentEmployeesStr.includes(emp.toString())
          );

          // Find employees that were removed
          const removedEmployees = currentEmployees.filter(emp => 
              !newEmployeesStr.includes(emp.toString())
          );

          // Update users' projects arrays
          if (addedEmployees.length > 0) {
              await User.updateMany(
                  { _id: { $in: addedEmployees } },
                  { $addToSet: { projects: projectId } }
              );
          }

          if (removedEmployees.length > 0) {
              await User.updateMany(
                  { _id: { $in: removedEmployees } },
                  { $pull: { projects: projectId } }
              );
          }
      }

      res.status(200).json(updatedProject);
  } catch (error) {
      next(error);
  }
};



const deleteProject = async (req, res) => {
  try {
      const { projectId } = req.params;

      // First find the project to get employees list
      const project = await Project.findById(projectId);
      
      if (!project) {
          return res.status(404).json({ message: "Project not found" });
      }

      // Remove project from all assigned users
      if (project.employees?.length > 0) {
          await User.updateMany(
              { _id: { $in: project.employees } },
              { $pull: { projects: projectId } }
          );
      }

      // Then delete the project
      await Project.findByIdAndDelete(projectId);

      res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
