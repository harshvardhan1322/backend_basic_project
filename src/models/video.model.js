import mongoose , {Schema} from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"

const videoSchema = new mongoose.Schema(
    {
        videoFile: {
            type: String,//cloudinary url
            required: [true, 'video required']
        },
        thumbnail : {
            type: String,//cloudinary url
            required: [true, 'thumbnail required']
        },
        title: {
            type: String,
            required: [true, 'title required']
        },
        description: {
            type: String,
            required: true
        },
        duration: {
            type: String, //cloudinary url
            required: true
        },
        views: {
            type: String,
            default: 0
        },
        isPublished: {
            type: Boolean,
            default: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "Users"
        },
    },
    {
        timestamps: true
    }
)

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video",videoSchema)