import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import tasksRouter from './routes/tasksRouter.js'
import connectDB from './config/db.js'

const PORT = process.env.PORT || 5001
const app = express();

app.use(cors())
app.use(express.json())

// Health check
app.get('/', (req, res) => res.send('Todox API is running...'))

app.use("/api/tasks", tasksRouter)

// Connection logic
let isConnected = false;
const connect = async () => {
    if (isConnected) return;
    await connectDB();
    isConnected = true;
};

// For local development
if (process.env.NODE_ENV !== 'production') {
    connect().then(() => {
        app.listen(PORT, () => {
            console.log("Server chạy trên cổng ", PORT);
        })
    })
}

// Ensure DB connects for serverless functions
app.use(async (req, res, next) => {
    try {
        await connect();
        next();
    } catch (error) {
        res.status(500).json({ error: "Database connection failed" });
    }
});

export default app;


