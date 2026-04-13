import Task from "../models/Task.js";

export const getAllTasks = async (req, res) => {
    try {
        const tasks = await Task.find().sort({createdAt:-1});
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: "Lỗi server: " + error.message });
    }
};

export const createTask = async (req, res) => {
    try {
        const { title, description, scheduledAt } = req.body;
        const task = await Task.create({ title, description, scheduledAt });
        res.status(201).json(task);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const updateTask = async (req, res) => {
    try {
        const { title, description, status, scheduledAt } = req.body;
        
        let updateData = { title, description, status, scheduledAt };
        
        // Handle completedAt timestamp
        if (status === 'completed') {
            updateData.completedAt = new Date();
        } else if (status === 'active') {
            updateData.completedAt = null;
        }

        const updatedTask = await Task.findByIdAndUpdate(req.params.id,
            updateData,
            { new: true }
        )
        if(!updatedTask) return res.status(404).json({message:"Không tìm thấy task"})
        res.status(200).json(updatedTask)
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteTask = async (req, res) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);
        if (!task) return res.status(404).json({ message: "Không tìm thấy task" });
        res.status(200).json({ message: "Xóa thành công" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server: " + error.message });
    }
};
