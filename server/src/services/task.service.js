let tasks = [];
let nextId = 1;

const taskService = {
  getAllTasks() {
    return tasks;
  },

  createTask(data) {
    const nuevaTarea = {
      id: nextId++,
      title: data.title,
      description: data.description || '',
      status: data.status || 'pending',
      createdAt: new Date(),
      updatedAt: null
    };
    tasks.push(nuevaTarea);
    return nuevaTarea;
  },

  getTask(id) {
    const task = tasks.find(tarea => String(tarea.id) === String(id));
    if (!task) {
      throw new Error('NOT_FOUND');
    }
    return task;
  },

  updateTask(id, data) {
    const task = tasks.find(tarea => String(tarea.id) === String(id));
    if (!task) {
      throw new Error('NOT_FOUND');
    }
    if (data.title) task.title = data.title;
    if (data.description !== undefined) task.description = data.description;
    if (data.status) task.status = data.status;
    task.updatedAt = new Date();
    return task;
  },

  deleteTask(id) {
    const index = tasks.findIndex(tarea => String(tarea.id) === String(id));
    if (index === -1) {
      throw new Error('NOT_FOUND');
    }
    return tasks.splice(index, 1)[0];
  }
};

export default taskService;
