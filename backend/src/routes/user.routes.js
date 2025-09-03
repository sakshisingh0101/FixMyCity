import { Router } from "express";
import { upload } from "../middleware/multer.middleware.js";
import { verifyjwt } from "../middleware/auth.middleware.js";
import { loginUser, registerUser , logoutUser, updateUserProfile, updatePassword, isUserLogin, getUserDetails, refreshAccessToken } from "../controllers/user.controller.js";
// import { logoutUser } from "../../public/src/controllers/user.controller";

const userRouter=Router();

userRouter.route("/register").post(registerUser)
userRouter.route("/login").post(loginUser)
userRouter.route("/logout").post(verifyjwt,logoutUser)
userRouter.route("/updateUserProfile").post(verifyjwt,updateUserProfile)
userRouter.route("/updatePassword").post(verifyjwt,updatePassword)
userRouter.route("/isUserlogin").post(isUserLogin)
userRouter.route("/getUserDetails").get(verifyjwt,getUserDetails)
userRouter.route("/refreshAccessToken").post(refreshAccessToken)

export default userRouter;