import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
const app=express();
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

//routes
import userRouter from "./routes/user.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import healthcheckRouter from "./routes/healthcheck.routes.js";
import likeRouter from "./routes/like.routes.js";
import commentRouter from "./routes/comment.routes.js";
import videoRouter from "./routes/video.routes.js";

//route declaration
app.use("/api/v1/users",userRouter)
app.use("/api/tweets", tweetRouter);
app.use("/api/subscriptions", subscriptionRouter);
app.use("/api/playlists", playlistRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api", healthcheckRouter); // e.g., GET /api/healthcheck
app.use("/api/likes", likeRouter);
app.use("/api/comments", commentRouter);
app.use("/api/videos", videoRouter);

export {app}