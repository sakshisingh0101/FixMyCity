import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema =new  mongoose.Schema({
  name:{
    type: String,
    required: true
  },
  userName:{
    type:String,
    required: true,
    lowercase:true,
    unique:true,
    trim: true
  },
  email:{
    type:String,
    required:false,
    unique:true,
    lowercase:true
  },
  password:{
    type:String,
    required:true,
    min:[6,"Password must be of min 6 character "],
    max:[14,"Password can be of max 14 character"]
  },
  role:{
    type:String,
    required:true
  },
  phoneNumber:{
     type:String,
     unique:true
  },
  refreshToken:{
    type:String
  }
},{timestamps:true})
userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next;
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function() {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      userName: this.userName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

userSchema.methods.generateRefreshToken = function() {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      userName: this.userName,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};

export const User = mongoose.model("User",userSchema)