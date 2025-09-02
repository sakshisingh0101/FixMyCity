import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Report } from "../models/issue_report_model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.models.js";

const uploadReport= asyncHandler(async(req,res)=>{
    const {title,location,description,category} = req.body
    if (!title || !description || !category || !location || !Array.isArray(location.coordinates)) {
    throw new ApiError(401,"Title, description, category and valid location are required");
}

    if(!(req.files&&Array.isArray(req.files.reportImage)&&req.files.reportImage[0]))
    {
        throw new ApiError(401,"No image is uploaded")
    }
    
    const reportImagepath = req.files?.reportImage[0]?.path
    if(!reportImagepath)
    {
        throw new ApiError(401,"No image uploaded")
    }
    const reportImageupload= await uploadOnCloudinary(reportImagepath)
    const user = await User.findById(req.user._id)
    if(!user)
    {
        throw new ApiError(401,"User not found")
    }
    const report = await Report.create({
        title,
        description,
        reportImage:reportImageupload.url,
        location:{
            type: "Point",
            coordinates:location.coordinates,
            address:location.address
        },
        category,
        predicted_category:category, // to be later predicted by ml
        upvote:0,
        createdBy:user,
        status: "pending"

    })


    return res.status(200).json(new ApiResponse(200,"Report Successfully Uploaded",report));

})
const upvote=asyncHandler(async(req,res)=>{
    const {reportId}= req.params
    if(!reportId)
    {
        throw new ApiError(401,"Invalid report id")
    }
    const report= await Report.findByIdAndUpdate(reportId,{
        $inc: { upvote: 1 }} , // atomic increment
      { new: true } 
    )

    if(!report)
    {
        throw new ApiError(404,"Post not found")
    }
    return res.status(200).json( new ApiResponse(200,"Successfully upvoted",report));

})
const removeUpvote=asyncHandler(async(req,res)=>{
    const {reportId} = req.params
    const report = await Report.findByIdAndUpdate(reportId,{
        $inc: { upvote: 1 }} , // atomic decrement
      { new: true } 
    )
    if(!report)
    {
        return new ApiError(401,"Report not found")
    }
    return res.status(200).json(new ApiResponse(200,"Successfuly removed vote"))
    
})
const getAllReports = asyncHandler(async(req,res)=>{
   const reports = await Report.find().sort({ upvotes: -1 });
   if(!reports)
   {
    throw new ApiError("No report found")
   }
   return res.status(200).json(new ApiResponse(200,"Successfully fetched all the reports"))
})

const getAllMyReport=asyncHandler(async(req,res)=>{
    const user = req.user
    const existedUser = await User.findById(user._id)
    if(!existedUser)
    {
        throw new ApiError(401,"User not found")
    }
    const userWithPost = await User.aggregate([
        {
            $match:{
                _id:existedUser._id
            }
        },
        {
            $lookup:{
                from:"reports",
                localField:"_id",
                foreignField:"createdBy",
                as:"UserReports"
            }
        },
         {
            $addFields:{
                totalPost:{ 
                    $size:"$UserReports"
                   }
            }
        },
        {
            $project:{
                password:0,
                refreshToken:0
            }
        }
    ])
     if(!userWithPost.length) 
    {
        throw new ApiError(400,"User document  not found ")
    }
    res.status(200).json(
        new ApiResponse(200,"User Post Details fetched successfully",userWithPost[0])
    )
    
})
const updateReport=asyncHandler(async(req,res)=>{
    const { id } = req.params;
    const userId = req.user._id; // from auth middleware
    const { title, description, category } = req.body;

    let report = await Report.findById(id);
    if (!report) {
      throw new ApiError(401,"Report not found")
    }

    if (report.owner.toString() !== userId.toString()) {
      throw new ApiError(401,"Not Authorized to update this report")
    }

    if (title) report.title = title;
    if (description) report.description = description;
    if (category) report.category = category;
    if (req.file) report.image = req.file.path; // multer field

    await report.save();
    res.json(report);
})
const deleteReport = asyncHandler(async(req,res)=>{
    const {reportId}= req.params
    const report = await Report.findById(reportId)
    if(!report)
    {
        throw new ApiError(401,"Report not found or invalid report id")
    }
    const user = await User.findById(req.user._id)
    if(!user)
    {
        throw new ApiError(401,"User not found")
    }
    if(report.createdBy._id.equals(user._id))
    {
        throw new ApiError(401,"Only owner can delete the post")
    }
    const deleterepo= await Report.findByIdAndDelete(report._id)
    if(!deleterepo)
    {
        throw new ApiError(401,"Failed deletion due to report not found")
    }
    return res.status(200).json(new ApiResponse(200,"Successfully deleted report",deleterepo))
})
export {uploadReport,upvote,getAllMyReport,getAllReports,removeUpvote,deleteReport,updateReport}