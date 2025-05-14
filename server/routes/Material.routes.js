const Material = require("../controllers/MaterialController");

module.exports = (app) => {

    app.post("/materials/create", Material.createMaterial);
    
    app.get("/materials/all", Material.getAllMaterials);
    
    app.get("/materials/:materialId", Material.getMaterialById);

    app.patch("/materials/update/:materialId", Material.updateMaterial);

    app.patch("/materials/update-status/:materialId", Material.updateMaterialStatus);

    app.delete("/materials/delete/:materialId", Material.deleteMaterial);

    app.get("/projects/:projectId/materials", Material.getMaterialsByProjectId);

    app.get("/cabinets/:cabinetId/materials", Material.getMaterialsByCabinetId);





};