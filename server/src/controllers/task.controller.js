import taskService from '../services/task.service.js';

export const createTask = async (req, res) => {
    try {
        const { title, description, status } = req.body;

        if (!title || typeof title !== 'string' || title.trim() === '') {
            return res.status(400).json({ error: 'Hace falta el título' });
        }

        if (description && typeof description !== 'string') {
            return res.status(400).json({ error: 'Hace falta la descripción' });
        }

        if (status && !['pending', 'completed'].includes(status)) {
            return res.status(400).json({ error: 'El estado debe ser pendiente o completado' });
        }

        const task = await taskService.createTask({ title, description, status });
        return res.status(201).json(task);
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

        const task = await taskService.getTask(id);
        return res.status(200).json(task);
    } catch (error) {
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};

export const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ error: 'ID de tarea inválido' });
        }

        await taskService.deleteTask(id);
        return res.status(204).send();
    } catch (error) {
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};