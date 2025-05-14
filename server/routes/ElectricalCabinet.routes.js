const ElectricalCabinet = require("../controllers/ElectricalCabinetController");

module.exports = (app) => {

    app.post("/project/:projectId/cabinet/create", ElectricalCabinet.createElectricalCabinet);
    
    // app.post("/cabinets/:cabinetId/materials", ElectricalCabinet.addMaterialsToCabinet);

    app.get("/cabinets/all", ElectricalCabinet.getAllCabinets);

    app.get("/projects/:projectId/cabinet", ElectricalCabinet.getCabinetByProjectId);

    app.get("/cabinets/:cabinetId", ElectricalCabinet.getCabinetByCabinetId);

    app.patch("/cabinets/update/:cabinetId", ElectricalCabinet.updateCabinet);

    app.post("/cabinets/:cabinetId/maintenance", ElectricalCabinet.updateMaintenanceHistory);

    app.post("/generate-qr/:cabinetId", ElectricalCabinet.generateCabinetQRCode);

    app.patch("/:cabinetId/assign-materials", ElectricalCabinet.assignMaterialsToCabinet);

    app.patch("/cabinets/:cabinetId/materials/:materialId", ElectricalCabinet.updateMaterialStatus);

    app.post("/cabinets/:cabinetId/scan", ElectricalCabinet.scanCabinetQRCode);
};