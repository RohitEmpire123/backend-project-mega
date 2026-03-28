import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema(
  {
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video"
    },
    comment: {
      type: Schema.Types.ObjectId,
      ref: "Comment"
    },
    tweet: {
      type: Schema.Types.ObjectId,
      ref: "Tweet"
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

// ✅ Prevent duplicate likes (video)
likeSchema.index(
  { user: 1, video: 1 },
  { unique: true, sparse: true }
);

// ✅ Prevent duplicate likes (comment)
likeSchema.index(
  { user: 1, comment: 1 },
  { unique: true, sparse: true }
);

// ✅ Prevent duplicate likes (tweet)
likeSchema.index(
  { user: 1, tweet: 1 },
  { unique: true, sparse: true }
);

export const Like = mongoose.model("Like", likeSchema);
