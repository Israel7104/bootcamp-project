import express from 'express';
import * as taskController from '../controllers/task.controller.js';

const router = express.Router();

// GET /api/v1/tasks - Obtener todas las tareas
router.get('/', taskController.getAllTasks);

// GET /api/v1/tasks/:id - Obtener una tarea por ID
router.get('/:id', taskController.getTask);

// POST /api/v1/tasks - Crear una nueva tarea
router.post('/', taskController.createTask);

// PUT /api/v1/tasks/:id - Actualizar una tarea
router.put('/:id', taskController.updateTask);

// DELETE /api/v1/tasks/:id - Eliminar una tarea
router.delete('/:id', taskController.deleteTask);

export default router;