import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async(req,res) => {

    //register steps
    /*
    1. user details from frontend
    2. validation
    3. check if user already exists or not : username,email
    4. check for images , check for avatar(compulsory)
    5. upload them to cloudinary
    6. create user object - create entry in db 
    7. remove password and refresh token field from response
    8. check for user creation 
    9. return result
    */

    //user details from frontend
    const {fullname, username, email, password, } = req.body
    console.log("email: ", email);

    //validation
    if (
        [fullname, email, username, password ].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "Details are required")
    }

    //user exists or not
    const existedUser = User.findOne({
        $or: [{username},{email}]
    })
    if(existedUser){
        throw new ApiError(409, "User already exists")
    }

    //check for images and avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    //upload them to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"Avatar file is required")
    }

    //create an object and make an entry in the database
    const User = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",//as we didn't check that whether the cover image was uploaded or not
        email,
        password,
        username: username.toLowerCase()
    })
    
    //remove some field from the db
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    //check for the user creation
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the User")
    }

    //return response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )
})

export {registerUser}