const MaterialRequest = require("../controllers/MaterialRequestController");

module.exports = (app) =>{
    app.post("/material-request", MaterialRequest.createRequest);
    app.get("/material-requests/total/:materialId", MaterialRequest.getTotalRequestedForMaterial);
    
}