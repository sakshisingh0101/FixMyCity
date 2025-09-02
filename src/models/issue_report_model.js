import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const reportSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    category: {
      type:  String, 
      required:true
    },           // user-selected
    reportImage:{
      type:String,
      required:true
    },

    predicted_category: String,    // system prediction

    final_category: String,        // admin-approved

   location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: {
    type: [Number], // [lng, lat]
    index: "2dsphere"
     },
    address: { type: String } 
   },
   description:{
    type:String,
    required:true

   },
  status: { type: String, enum: ["pending", "verified", "resolved"], default: "pending" },
  upvote:{
    type:Number,
    default: 0
  },
  createdBy:{
    type : mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
},{timestamps:true})
reportSchema.plugin(mongooseAggregatePaginate);
export const Report= mongoose.model("Report", reportSchema);