let tasks = [];

function obtenerTodas() {
  return tasks;
}

function crearTarea(data)   {
  const nuevaTarea = {
    id: tasks.length + 1,
    title: data.title,
    description: data.description,
    completed: false
  };
  tasks.push(nuevaTarea);
  return nuevaTarea;
}

function eliminarTarea(id) {
  if (!id) {
    throw new Error('NOT_FOUND');
  }
  const index = tasks.findIndex(tarea => tarea.id === id);
  if (index !== -1) {
    return tasks.splice(index, 1)[0];
  }
  return null;
}