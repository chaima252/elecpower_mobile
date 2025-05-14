const userController = require("../controllers/UserController");
const verifyToken =require("../utils/verifyUser")

module.exports = (app) => {
;
    app.post("/signout", userController.signout);
    app.patch('/updateuser/:userId',userController.updateUser)
    app.delete('/delete/:userId', userController.deleteUser);
    app.get('/getusers', userController.getUsers);
    app.get('/getemployees', userController.getEmployees);
    app.get('/getuser/:userId', userController.getUser);
    app.patch('/update-role/:userId', userController.updateAdminRole);
    
};
