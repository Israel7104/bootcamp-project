import taskService from '../services/task.service.js';

export const getAllTasks = async (req, res) => {
    try {
        const tasks = taskService.getAllTasks();
        return res.status(200).json(tasks);
    } catch (error) {
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};

export const getTask = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ error: 'ID de tarea inválido' });
        }

        const task = taskService.getTask(id);
        return res.status(200).json(task);
    } catch (error) {
        if (error.message === 'NOT_FOUND') {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};

export const createTask = async (req, res) => {
    try {
        const { title, description, status, tag } = req.body;

        if (!title || typeof title !== 'string' || title.trim() === '') {
            return res.status(400).json({ error: 'Hace falta el título' });
        }

        if (description && typeof description !== 'string') {
            return res.status(400).json({ error: 'Hace falta la descripción' });
        }

        if (tag && typeof tag !== 'string') {
            return res.status(400).json({ error: 'La categoría debe ser una cadena de texto' });
        }

        if (status && !['pending', 'completed'].includes(status)) {
            return res.status(400).json({ error: 'El estado debe ser pendiente o completado' });
        }

        const task = taskService.createTask({ title, description, status, tag });
        return res.status(201).json(task);
    } catch (error) {
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};

export const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, status, tag } = req.body;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ error: 'ID de tarea inválido' });
        }

        if (title && typeof title !== 'string') {
            return res.status(400).json({ error: 'El título debe ser una cadena de texto' });
        }

        if (description && typeof description !== 'string') {
            return res.status(400).json({ error: 'La descripción debe ser una cadena de texto' });
        }

        if (tag && typeof tag !== 'string') {
            return res.status(400).json({ error: 'La categoría debe ser una cadena de texto' });
        }

        if (status && !['pending', 'completed'].includes(status)) {
            return res.status(400).json({ error: 'El estado debe ser pendiente o completado' });
        }

        const task = taskService.updateTask(id, { title, description, status, tag });
        return res.status(200).json(task);
    } catch (error) {
        if (error.message === 'NOT_FOUND') {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};

export const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ error: 'ID de tarea inválido' });
        }

        taskService.deleteTask(id);
        return res.status(204).send();
    } catch (error) {
        if (error.message === 'NOT_FOUND') {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};