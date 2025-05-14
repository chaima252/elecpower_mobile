const express = require("express");
const app=express();
const cors=require("cors");
const cookieParser = require('cookie-parser');

app.use(cors({
    origin: ['http://localhost:5173', 'exp://192.168.1.72:8081'], 
    credentials: true,
    exposedHeaders: ['set-cookie']

  }));
app.use(express.json(express.urlencoded({extended: true})))
app.use(cookieParser());

require("dotenv").config()
require("./config/mongoose")

const port=process.env.PORT

//! ROUTES
require("./routes/Project.routes")(app)
require("./routes/Task.routes")(app)
require("./routes/ElectricalCabinet.routes")(app)
require("./routes/Material.routes")(app)
require("./routes/User.routes")(app)
require("./routes/Auth.routes")(app)
require("./routes/MaterialRequest.routes")(app)



app.use((err, req, res, next) => {
    console.error(err.stack);
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal server error';
    res.status(statusCode).json({
        success: false,
        statusCode,
        message
    })
}
)

app.listen(port,()=>console.log(`listening on port: ${port}`))
