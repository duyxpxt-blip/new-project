import mongoose from "mongoose";

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log("kết nối tới csdl thành công")
    } catch (error) {
        console.log(error)
        process.exit(1)
    }
}

export default connectDB
