import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from '../utils/ApiError.js' 
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler( async (req, res) => {
    //  :: Steps ::
    // get user details from frontend
    // validation - not empty
    // check if user exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation 
    // return res

    const {fullName, email, username, passsword} = req.body
    console.log("email :", email);

    // if(fullName === ""){
    //     throw new ApiError(400, "fullname is required", )
    // }

    if([fullName, email, username, passsword].some((field)=> field ?.trim() === "")){
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = User.findOne({ // returns true or false value
        $or: [{ username }, { email }]
    })

    if(existedUser){ // if user present in database
        throw new ApiError(409, "User with email or username already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path; 
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar file is required");
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        passsword,
        username: username.toLowrCase()
    })

    const createdUser = User.findById(user._id).select(
        "-password -refreshToken" // fields we donot want
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully!!!")
    )

})

export {registerUser}