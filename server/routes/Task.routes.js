const TaskController = require("../controllers/TaskController");

module.exports = (app) => {
  app.post("/projects/:projectId/createtask", TaskController.createTask);

  app.get("/projects/:projectId/tasks", TaskController.getTasksByProjectId);

  app.get("/tasks/:taskId", TaskController.getTaskById);

  app.get("/tasks/all", TaskController.getAllTasks);

  app.patch("/tasks/:taskId/assign", TaskController.assignEmployeeToTask);

  app.patch("/tasks/:taskId/self-assign", TaskController.selfAssignToTask);

  app.patch("/tasks/update/:taskId", TaskController.updateTask);

  app.delete("/tasks/delete/:taskId", TaskController.deleteTask);

  
};
