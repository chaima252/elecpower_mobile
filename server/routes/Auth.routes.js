const authController = require("../controllers/AuthController");


module.exports = (app) => {
;
    app.post("/signup",authController.signup );
    app.post("/signin",authController.signin );
    app.post("/createuser",authController.createUser );
    app.patch("/change-password",authController.updatePassword );


};
