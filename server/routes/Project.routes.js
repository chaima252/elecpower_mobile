const ProjectController = require("../controllers/ProjectController");

module.exports = (app) => {

    app.post("/projects/create", ProjectController.createProject);

    app.get("/projects/all", ProjectController.getAllProjects);

    app.get("/projects/:projectId", ProjectController.getProjectById);

    app.patch("/projects/update/:projectId", ProjectController.updateProject);

    app.delete("/projects/delete/:projectId", ProjectController.deleteProject);

};