import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessandRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken , refreshToken}


    } catch (error) {
        console.error("Token generation failed:", error) // log the real error so it isn't hidden behind the generic 500
        throw new ApiError(500 ,"something went wrong while generating access token and refresh token")
    }
}

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

    //validation
    if (
        [fullname, email, username, password ].some((field) => !field || field.trim() === "") // reject a field if it is missing (undefined/null/empty) or only whitespace
    ) {
        throw new ApiError(400, "Details are required")
    }

    //user exists or not
    const existedUser = await User.findOne({
        $or: [{username},{email}]
    })
    if(existedUser){
        throw new ApiError(409, "User already exists")
    }

    //check for images and avatar
    const avatarLocalPath = req.files?.avatar?.[0]?.path; // safely read the avatar path; gives undefined (not a crash) if no avatar was uploaded
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

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
    const user = await User.create({
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
        new ApiResponse(201, createdUser, "User registered Successfully") // 201 = resource created, matches res.status(201)
    )
})

const loginUser = asyncHandler(async(req,res) => {
    /* to-dos
    1. req.body - data
    2. username or email
    3. find the user whether it exists?
    4. password check
    5. access and refresh token generation
    6. send cookies(secure)
    7. response for successfull login
    */

    //extract data
    const {email, username, password} = req.body

    if (!username?.trim() && !email?.trim()) {
        throw new ApiError(400, "username or email is required");
    }

    //user check
    const conditions = [] // only search by the fields the client actually sent
    if (username?.trim()) conditions.push({ username }) // add username to the search only if provided
    if (email?.trim()) conditions.push({ email }) // add email to the search only if provided

    const user = await User.findOne({
        $or: conditions // match a user by username OR email, never by an undefined value
    })

    if(!user){
        throw new ApiError(404 ,"user doesn't exist")
    }

    //password check
    if(!password){
        throw new ApiError(400, "password is required")
    }
    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401 ,"Invalid user credentials")
    }


    //generate token
    const {accessToken , refreshToken} = await generateAccessandRefreshTokens(user._id) // _id (lowercase) is MongoDB's id field; passes this user's id to create the tokens

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    //cookie
    const options = {
        httpOnly: true,//by default cookies are modifiable through frontend but using these 2 methods they can be modifies using server only
        secure: process.env.NODE_ENV === "production" // secure (HTTPS-only) cookies in production; allows them over http://localhost while developing
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken,options)
    .cookie("refreshToken", refreshToken,options)
    .json(
        new ApiResponse(
            200,{
                user:loggedInUser, accessToken, refreshToken
            },
            "User logged In Succesfully"
        )
    )

})

const logoutUser = asyncHandler(async(req,res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // removes the refreshToken field from the document in the database
            },
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production" // must match the login cookie options or the cookies won't be cleared
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200, {}, "User logged out"))
})

const refreshAccessToken = asyncHandler(async(req,res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken,newRefreshToken} = await generateAccessandRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken, refreshToken: newRefreshToken
                },
                "Access Token Refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

export{
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}