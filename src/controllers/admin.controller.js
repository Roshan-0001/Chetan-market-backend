import { ApiError } from "../utills/ApiError.js";
import { ApiResponse } from "../utills/ApiResponse.js";
import { AsyncHandler } from "../utills/Asynchandaler.js";
import { UploadOnCloudinary } from "../utills/Cloudinary.js";
import { User } from "../models/user.model.js";
import { Admin } from "../models/admin.model.js";
//function to delete one admin at a time
const deleteAdmin = async (_id) => {
    try {
        const result = await Admin.deleteMany({ _id });
        return result;
    } catch (error) {
        console.log("error ------", error);
        return null;
    }
}
//function to delete one user at a time
const deleteUser = async (users) => {
    try {
        const result = await User.deleteMany(users);
        return result;
    } catch (error) {
        console.log("error ------", error);
        return null;
    }
}
//function  to view all the user present in db
const viewAllUser = async () => {
    try {
        const users = await User.find({}, { password: 0 });
        return users;
    } catch (error) {
        console.log("error ------", error);
        return null;
    }
}
//functioon to view all available admin
const viewAllAdmin = async () => {
    try {
        const admins = await Admin.find({}, { password: 0 });
        return admins;
    } catch (error) {
        console.log("error ------", error);
        return null;
    }
}
//function  to view a specific user from db
const viewOneUser = async (parsedUserData) => {
    try {
        const user = await User.findOne(parsedUserData);
        return user;
    } catch (error) {
        console.log("error ------", error);
        return null;
    }
}
//function  to delete all the present in the db
const deleteAllUsers = async () => {
    try {
        const result = await User.deleteMany({});
        return result;
    } catch (error) {
        console.log("error ------", error);
        return null;
    }
}
//this function removes the empty fields from a json file
function removeEmptyFields(obj) {
    Object.keys(obj).forEach(key => {
        if (obj[key] === "" || obj[key] === null || obj[key] === undefined) {
            delete obj[key];
        }
    });
    return obj;
}
// delete single admin
const deleteSingleAdmin = AsyncHandler(
    async (req, res) => {
        try {
            const { _id } = req.body;
            if (!_id) {
                return res.status(400).json(new ApiError(400, null, "Failed to delete the admin"))
            }
            const response = await deleteAdmin(removeEmptyFields(_id));
            if (!response.deletedCount) {
                return res.status(400).json(new ApiResponse(400, null, "Admin not found in Database"));
            } else {
                return res.status(201).json(new ApiResponse(201, null, "Deleted the Admin successfully"));
            }
        } catch (error) {
            return res.status(500).json(new ApiError(500, error, "something went wrong while deleting admin"));
        }
    }
)
// delete single user
const deleteSingleUser = AsyncHandler(
    async (req, res) => {
        try {
            const { email, number, username } = req.body;

            if (!email && !number && !username) {
                return res.status(400).json(new ApiError(400, this, "email, number or username is required"))
            }
            const response = await deleteUser(removeEmptyFields(req.body));
            if (!response.deletedCount) {
                return res.status(400).json(new ApiResponse(400, null, "User not found in Database"));
            } else {
                return res.status(201).json(new ApiResponse(201, null, "Deleted the user successfully"));
            }
        } catch (error) {
            return res.status(500).json(new ApiError(500, error, "something went wrong while deleting user"))
        }
    }
)
// view all present admins
const viewAllAdmins = AsyncHandler(
    async (req, res) => {
        try {
            const response = await viewAllAdmin();

            if (response) {
                return res.status(200).json(new ApiResponse(200, response, "All admins fetched successfully"));
            } else {
                return res.status(400).json(new ApiResponse(400, null, "No admin found in Database"));
            }
        } catch (error) {
            return res.status(500).json(new ApiError(500, error, "something went wrong while fetching admins"))
        }
    }
)
// view all present users
const viewAllUsers = AsyncHandler(
    async (req, res) => {
        try {
            const response = await viewAllUser();

            if (response) {
                return res.status(200).json(new ApiResponse(200, response, "All users fetched successfully"));
            } else {
                return res.status(400).json(new ApiResponse(400, null, "No user found in Database"));
            }
        } catch (error) {
            return res.status(500).json(new ApiError(500, error, "something went wrong while fetching users"))
        }
    }
)
//registration of the admin
const registerAdmin = AsyncHandler(
    async (req, res) => {
        const { username, fullName, email, password, number } = req.body;
        try {
            if (![username, fullName, email, password, number].every(field => field && field.trim())) {
                return res.status(400).json(new ApiError(400, null, "All fields are required"));
            }

            const existedUser = await Admin.findOne({
                $or: [{ username }, { email }, { number }]
            })

            if (existedUser) {
                return res.status(409).json(
                    new ApiError(409, null, "user already existed")
                );
            }

            const admin = await Admin.create({
                email,
                password,
                username: username.toLowerCase(),
                number,
                fullName
            })

            // checks for user creation
            const adminCreated = await Admin.findById(admin.id).select("-password")

            if (!adminCreated) {
                return res.status(406).json(
                    new ApiError(406, null, "something went wrong while creating user")
                );
            } else {
                return res.status(201).json(
                    new ApiResponse(201, adminCreated, "user created successfully")
                );
            }
        } catch (error) {
            return res.status(400).json(
                new ApiError(400, error, "something went wrong while creating user")
            );
        }
    }
)
// for admin login
const loginAdmin = AsyncHandler(async (req, res) => {

    //request body -> data
    const { email, username, password } = req.body

    //check username or email
    if (!username && !email) {
        return res.status(400).json(new ApiError(400, null, "username or email is required"))
    }

    //find the user iu
    const admin = await Admin.findOne({
        $or: [{ username }, { email }]
    })

    if (!admin) {
        return res.status(404).json(new ApiError(404, null, "Admin does not exist"))
    }
    //password check
    const isPasswordvalid = await admin.isValidPassword(password)
    if (!isPasswordvalid) {
        return res.status(404).json(new ApiError(401, null, "invalid credentials"))
    }

    //generating access token 
    const accessToken = await admin.generateAccessToken(admin._id)

    //sending cookies
    const loggedInAdmin = await Admin.findById(admin._id).select("-password ")


    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInAdmin, accessToken
                },
                "Admin loggedin successfully"
            )
        )
})
// for logout
const logoutAdmin = AsyncHandler(async (req, res) => {

    await Admin.findByIdAndUpdate(
        req.admin._id,
        {
            $unset: {
                accessToken: 1
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .json(new ApiResponse(200, {}, "Admin logged out"))
})
// to view single user
const viewSingleUser = AsyncHandler(
    async (req, res) => {
        try {
            const { email, number, username } = req.body;

            if (!email && !number && !username) {
                return res.status(400).json(new ApiError(400, this, "email, number or username is required"))
            }
            const response = await viewOneUser(removeEmptyFields(req.body));

            if (!response) {
                return res.status(400).json(new ApiResponse(400, null, "User not found in Database"));
            } else {
                return res.status(201).json(new ApiResponse(201, response, "user fetched successfully"));
            }
        } catch (error) {
            return res.status(500).json(new ApiError(500, error, "something went wrong while fetching user"))
        }
    }
)
// to register multiple user at one time
const registerMultipleUsers = AsyncHandler(async (req, res) => {
    try {
        const { userCount, userData } = req.body;
        const count = parseInt(userCount);
        const parsedUserData = JSON.parse(userData);

        if (!count || !parsedUserData || Object.keys(parsedUserData).length !== Number(count)) {
            return res.status(400).json(new ApiError(400, null, "Invalid user data or count mismatch"));
        }

        const images = req.files?.profileImage;

        if (!images || images.length !== Number(count)) {
            return res.status(400).json(new ApiError(400, null, "Number of images does not match count "));
        }

        const createdUsers = [];
        const failedUsers = [];

        const userKeys = Object.keys(parsedUserData);

        for (let i = 0; i < count; i++) {
            const user = parsedUserData[userKeys[i]];
            const imagePath = images[i]?.path;

            const { username, email, password, number, address, shopType, description } = user;

            // validate required fields
            if ([username, email, password, number, shopType].some(f => !f || f.trim() === "")) {
                failedUsers.push({ user: user.username, reason: "Missing required fields" });
                continue;
            }

            // check if user already exists
            const existingUser = await User.findOne({ $or: [{ username }, { email }, { number }] });
            if (existingUser) {
                failedUsers.push({ user: user.username, reason: "User already exists" });
                continue;
            }

            // check image
            if (!imagePath) {
                failedUsers.push({ user: user.username, reason: "Missing image" });
                continue;
            }

            // upload image to Cloudinary
            const uploadedImage = await UploadOnCloudinary(imagePath);
            if (!uploadedImage || !uploadedImage.url) {
                failedUsers.push({ user: user.username, reason: "Image upload failed" });
                continue;
            }

            // create user
            const newUser = await User.create({
                email,
                password,
                username: username.toLowerCase(),
                number,
                address,
                shopType,
                description,
                profileImage: uploadedImage.url,
            });

            const savedUser = await User.findById(newUser.id).select("-password");

            if (savedUser) {
                createdUsers.push(savedUser);
            } else {
                failedUsers.push({ user: user.username, reason: "Failed to save user" });
            }
        }

        return res.status(201).json(
            new ApiResponse(201, { createdUsers, failedUsers }, "User registration completed")
        );
    } catch (error) {
        return res.status(500).json(new ApiError(500,  "Server error while registering users", error));
    }
});



export { deleteSingleUser, deleteSingleAdmin, viewAllUsers, registerAdmin, loginAdmin, logoutAdmin, viewSingleUser, viewAllAdmins, registerMultipleUsers };