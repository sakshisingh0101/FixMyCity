import { Router } from "express";
import { upload } from "../middleware/multer.middleware.js";
import { verifyjwt } from "../middleware/auth.middleware.js";
import { deleteReport, getAllMyReport, getAllReports, removeUpvote, updateReport, uploadReport, upvote } from "../controllers/report.controller.js";
const reportRouter=Router();

reportRouter.route("/uploadReport").post( upload.fields([
        { name:"reportImage",
          maxCount:1

        }
        
    ]),uploadReport)
reportRouter.route("/upvote/:reportId").post(upvote)
reportRouter.route("/removeUpvote/:reportId").post(removeUpvote)
reportRouter.route("/getAllReport").get(getAllReports)
reportRouter.route("/getAllMyReport").get(verifyjwt,getAllMyReport)
reportRouter.route("/updateReport").post(upload.fields([
        { name:"reportImage",
          maxCount:1

        }
        
    ]),verifyjwt,updateReport)
reportRouter.route("/deletePost/:reportId").post(verifyjwt,deleteReport)

export default reportRouter;
