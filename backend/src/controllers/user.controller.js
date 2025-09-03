import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
const generateTokens=async(userId)=>{
  const user = await User.findById(userId);
  const accessToken =  user.generateAccessToken();
  const refreshToken= user.generateRefreshToken();
  user.refreshToken= refreshToken;
  user.save({validateBeforeSave:false})
  return {accessToken,refreshToken};

}
const registerUser = asyncHandler(async(req,res)=>{
    // username email password name role fields check 
    const {name,userName,email,phoneNumber,password,role} = req.body ;
    if([name,userName,password,role].some((fields)=>fields?.trim()===""))
    {
        throw new ApiError(400,"All the fields are required");
    }
     if(email===""&&!phoneNumber)
    {
         throw new ApiError(401,"User must enter email or phone number")
    }
    
    if(phoneNumber&&isNaN(phoneNumber))
    {
        throw new ApiError(401,"Enter a valid number")
    }
    if(email&&!email.includes('@'))
    {
      throw new ApiError(400,"Invalid email");
    }
    
    const existeduser = await User.findOne({
       $or:[{userName} , {email}]
    })
    if(existeduser)
    {
        throw new ApiError(401,"User already registered")
    }
    const user = await User.create({
        name,
        userName,
        email:email?.trim()==="" ? "": email,
        password,
        role,
        phoneNumber: phoneNumber? phoneNumber : undefined
    })
    // const {accessToken,refreshToken}= generateTokens(user._id)
    const finaluser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!finaluser)
    {
        throw new ApiError(400,"User creation failed")
    }
    // const option={
    //     httpOnly:true,
    //     secure:process.env.NODE_ENV==='production',
    //     sameSite:'None'
    // }
    return res
    .status(200)
    .json(new ApiResponse(200,"Successfully registerd",{
        data:finaluser,refreshToken,accessToken
    }))

})
const loginUser = asyncHandler(async(req,res)=>{
    const {userName,email,password}= req.body
    if([userName,email,password].some((field)=>field?.trim()==="")){
        throw new ApiError(401,"All the fields are required")
    }
    const existeduser = await User.findOne({
        $or:[{userName},{email}]
    })
    if(!existeduser)
    {
        throw new ApiError(400,"User does not exist");
    }

   const passwordCorrect=await (existeduser).isPassword(password);
   if(!passwordCorrect)
   {
    throw new ApiError(401,"Password is incorrect ")
   }
   const options={
    httpOnly:true,
    secure:process.env.NODE_ENV==='production',
    sameSite:'None'
   }
   const {accessToken,refreshToken}= await generateTokens(existeduser._id);
   
   const user=await User.findById(existeduser._id).select("-password -refreshToken")
   return res.status(200)
   .cookie("accessToken",accessToken,options)
   .cookie("refreshToken",refreshToken,options)
   .json(new ApiResponse(200,"Successfully Login",{
    data:user,refreshToken,accessToken
   }));
   

})
const logoutUser=asyncHandler(async(req,res)=>{
    // cookie remove refreshToken update
   const user= await User.findByIdAndUpdate(req.user._id,
        {
        $set:{
            refreshToken:undefined
        }
       
        },
        {
            new : true
        }
).select("-password -refreshToken")

res.status(200)
.clearCookie("accessToken")
.clearCookie("refreshToken")
.json(
    new ApiResponse(200,"Logged Out Successfully",{
        data:user
    })
)
})

const updateUserProfile=asyncHandler(async(req,res)=>{
    const {userName,email,phoneNumber} = req.body
    // if([userName,email,phoneNumber].some((field)=>(field?.trim()==="")))
    // {
    //     throw new ApiError(401,"Fields must not be empty")
    // }
    if(userName.trim()==="")
    {
        throw new ApiError(401,"Username cannot be empty")
    }
    const user= await User.findOne({userName})
    
    if (user && user._id.toString() !== req.user._id.toString()) {
    throw new ApiError(401, "Username already taken");
   }

   if(phoneNumber&&isNaN(phoneNumber))
   {
       throw new ApiError(401,"Invalid phone number")
   }
    

  const existedUser = await User.findById(req.user._id);

existedUser.userName = userName.trim();
existedUser.email = email?.trim() ? email.trim() : existedUser.email;
existedUser.phoneNumber = phoneNumber ? phoneNumber : existedUser.phoneNumber;

await existedUser.save();


  return res.status(200).json(new ApiResponse(200,"Successfully profile updated",existedUser))


    

})
const updatePassword=asyncHandler(async(req,res)=>{
    const {currentPassword,newPassword}= req.body;
    if(!currentPassword||!newPassword)
    {
        throw new ApiError(401,"Fields must not be empty")
    }
    const user =req.user;
    const iscorrect = await user.isPassword(currentPassword)
    if(!iscorrect)
    {
        throw new ApiError(401,"Incorrect current password")
    }
    const currentUser= await User.findById(user._id)
    if(!currentUser)
    {
        throw new ApiError(401,"User not exist")
    }
    currentUser.password= newPassword
   await currentUser.save({validateBeforeSave:false})

})

const isUserLogin = asyncHandler(async(req,res)=>{
    
         try {
        let token = req.cookies?.accessToken;

        if (!token) {
            const tokenHeader = req.headers.authorization;
            if (!tokenHeader || !tokenHeader.startsWith("Bearer ")) {
                throw new ApiError(401, "Authorization token is missing");
            }
            token = tokenHeader.replace("Bearer ", "").trim();
        }

        const decodedInfo = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedInfo._id).select("-password -refreshToken");
        if (!user) {
            throw new ApiError(401, "Invalid Access Token");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, "User Authenticated", user));

    } catch (error) {
        throw new ApiError(401, "Invalid or Expired Token");
    }

        
        
})
const getUserDetails= asyncHandler(async(req,res)=>{
    const user = await User.findById(req.user._id).select("-password -refreshToken")
    if(!user)
    {
        throw new ApiError(500,"User not found")
    }
    return res.status(200).json(200,"User details fetched",user)

})
const refreshAccessToken=asyncHandler(async(req,res)=>{
   try {
     const Token=req.cookies?.refreshToken || req.body.refreshToken
     if (!Token) {
        throw new ApiError(401, "Refresh token not provided");
      }
      
     const decodedInfo= jwt.verify(Token,process.env.REFRESH_TOKEN_SECRET)
     const user=await User.findById(decodedInfo._id)
     if(!user)
     {
         throw new ApiError(401," Invalid token : user does not match ")
 
     }
     if(user.refreshToken!==Token)  //equal check 
     {   throw new ApiError(401," Invalid refresh Token")
 
 
     }
 
 
 
     const {accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id);
     const option={
         httpOnly:true,
         server:false
     }
     const newUser=await User.findByIdAndUpdate(user._id,
         {
         $set: {
             refreshToken:refreshToken
         }
         },
        {
            new: true
        }
 ).select("-password -refreshToken")
     res.status(200)
   
     .cookie("accessToken",accessToken,option)
     .cookie("refreshToken",refreshToken,option)
     .json(
         new ApiResponse(200,"Refresh Aceess Token successfully",{
             data: newUser,refreshToken,accessToken
             
         })
     )
   } catch (error) {
    throw new ApiError(401,error?.message|| "Invalid refresh token 66");
   }
})


export {loginUser,registerUser,logoutUser,updateUserProfile,updatePassword,getUserDetails,isUserLogin,refreshAccessToken}


