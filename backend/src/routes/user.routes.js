import { Router } from "express";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJwt } from "../middleware/auth.middleware.js";
import { loginUser, registerUser , logoutUser, updateUserProfile, updatePassword, isUserLogin, getUserDetails, refreshAccessToken } from "../controllers/user.controller.js";
// import { logoutUser } from "../../public/src/controllers/user.controller";

const userRouter=Router();

userRouter.route("/register").post(registerUser)
userRouter.route("/login").post(loginUser)
userRouter.route("/logout").post(verifyJwt,logoutUser)
userRouter.route("/updateUserProfile").post(verifyJwt,updateUserProfile)
userRouter.route("/updatePassword").post(verifyJwt,updatePassword)
userRouter.route("/isUserlogin").get(verifyJwt,isUserLogin)
userRouter.route("/getUserDetails").get(verifyJwt,getUserDetails)
userRouter.route("/refreshAccessToken").post(refreshAccessToken)

export default userRouter;