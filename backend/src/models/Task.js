import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ""
    },
    status: {
        type: String,
        enum: ["active", "completed"],
        default: "active"
    },
    completedAt: {
        type: Date,
        default: null
    },
    scheduledAt: {
        type: Date,
        default: null
    }
},
{
    timestamps: true,
})

const Task = mongoose.model("Task", taskSchema)


export default Task