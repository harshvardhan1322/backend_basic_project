import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";//to access cookie from the user browser and apply cred operations on it

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))


app.use(express.json({limit: "16kb" }))//allowing unlimited json data sizes cause exhaution of memory and denial-of-service attacks
app.use(express.urlencoded({extended:true, limit: "16kb"}))//Express intercepts the incoming string, decodes the characters, and maps them into a clean JavaScript object
app.use(express.static("public"))//a built-in middleware function in Express used to serve static files—such as HTML files, CSS stylesheets, JavaScript files, images, and fonts—directly to the browser without you having to write custom route handlers for every single file.
app.use(cookieParser())

//routes import

import userRouter from './routes/user.routes.js' //can import user router like this if export is default but if { } is used then export { } is used


//routes declaration
app.use("/api/v1/users", userRouter)

// global error handler: must come after the routes; catches every thrown/forwarded error
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500 // use the ApiError status, or 500 for unexpected errors
    return res.status(statusCode).json({ // send JSON instead of Express's default HTML error page
        success: false,
        message: err.message || "Internal Server Error",
        errors: err.errors || []
    })
})

export {app}