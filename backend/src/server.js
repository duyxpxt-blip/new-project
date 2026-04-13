import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import tasksRouter from './routes/tasksRouter.js'
import connectDB from './config/db.js'
const PORT = process.env.PORT || 5001
const app = express();

app.use(cors())
app.use(express.json())
app.use("/api/tasks", tasksRouter)

connectDB().then(() => {
    const server = app.listen(PORT, () => {
        console.log("Server chạy trên cổng ", PORT);
    })

    server.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
            console.error("❌ Lỗi: Port 5001 đang bị chiếm. Hãy đóng terminal cũ và chạy lại.")
            process.exit(1)
        } else {
            throw err
        }
    })
})


