// Array para almacenar todas las tareas
let tasks = [];
let nextId = 1;
let currentFilter = "all"; // "all", "pending", "completed"
let searchTerm = ""; // Término de búsqueda
let selectedCategory = "All"; // Categoría seleccionada

// ============================================
// FUNCIONES AUXILIARES
// ============================================

// Obtener elemento del DOM por ID
function getElement(id) {
    return document.getElementById(id);
}

// Limpiar y refrescar la interfaz
function refreshUI() {
    updateCounters();
    renderTasks();
}

// ============================================
// FUNCIONES DE ALMACENAMIENTO (LocalStorage)
// ============================================

// Guardar tareas en localStorage
function saveTasks() {
    try {
        localStorage.setItem("tasks", JSON.stringify(tasks));
        localStorage.setItem("nextId", nextId);
    } catch (error) {
        // Puede fallar si localStorage está lleno o deshabilitado
        console.error("Error al guardar tareas en localStorage:", error);
        alert("No se pudieron guardar los cambios. Verifica el espacio disponible.");
    }
}

// Cargar tareas de localStorage
function loadTasks() {
    try {
        const savedTasks = localStorage.getItem("tasks");
        const savedNextId = localStorage.getItem("nextId");
        
        // Si hay tareas guardadas, intentar cargarlas
        if (savedTasks) {
            const parsedTasks = JSON.parse(savedTasks);
            
            // Validar que sea un array válido
            if (Array.isArray(parsedTasks) && parsedTasks.length > 0) {
                tasks = parsedTasks;
                
                // Cargar nextId correctamente
                if (savedNextId) {
                    nextId = parseInt(savedNextId);
                    // Asegurar que nextId sea mayor que el ID máximo existente
                    const maxId = Math.max(...tasks.map(t => t.id || 0));
                    nextId = Math.max(nextId, maxId + 1);
                } else {
                    nextId = tasks.length + 1;
                }
                
                console.log("Tareas cargadas desde localStorage:", tasks.length);
            } else {
                // JSON válido pero array vacío o inválido
                console.log("No hay tareas guardadas o el formato es inválido");
                initializeDefaultState();
            }
        } else {
            // No hay datos guardados
            console.log("Primera ejecución: inicializando estado por defecto");
            initializeDefaultState();
        }
    } catch (error) {
        console.error("Error al cargar tareas de localStorage:", error);
        initializeDefaultState();
    }
}

// Inicializar estado por defecto
function initializeDefaultState() {
    tasks = [];
    nextId = 1;
}

// Limpiar localStorage y reiniciar
function clearAllData() {
    if (confirm("¿Estás seguro de que quieres eliminar todas las tareas?")) {
        localStorage.removeItem("tasks");
        localStorage.removeItem("nextId");
        initializeDefaultState();
        refreshUI();
        console.log("Todos los datos han sido eliminados");
    }
}

// ============================================
// FUNCIONES DE TAREAS
// ============================================

// Función constructora para crear nuevas tareas
function createTask(title, description, tag) {
    return {
        id: nextId++,
        title: title,
        description: description,
        tag: tag,
        createdAt: new Date(),
        completed: false
    };
}

// Función para agregar una tarea al array y actualizar el DOM
function addTask(title, description, tag) {
    if (title.trim() === "") {
        alert("Por favor ingresa un título para la tarea");
        return;
    }

    const newTask = createTask(title, description, tag);
    tasks.push(newTask);
    saveTasks();
    clearForm();
    refreshUI();
}

// Función para actualizar los contadores
function updateCounters() {
    const allCount = tasks.length;
    const pendingCount = tasks.filter(task => !task.completed).length;
    const completedCount = tasks.filter(task => task.completed).length;

    getElement("all-tasks-count").textContent = allCount;
    getElement("pending-tasks-count").textContent = pendingCount;
    getElement("completed-tasks-count").textContent = completedCount;
}

// Función para eliminar una tarea
function deleteTask(task) {
    const taskIndex = tasks.indexOf(task);
    if (taskIndex !== -1) {
        tasks.splice(taskIndex, 1);
        saveTasks();
        refreshUI();
    }
}

// Función para cambiar el estado de completado de una tarea
function toggleTaskCompletion(task) {
    task.completed = !task.completed;
    saveTasks();
    refreshUI();
}

// Función para editar el título de una tarea
function editTaskTitle(task) {
    const newTitle = prompt("Edit title:", task.title);
    
    // El usuario pulsa Cancelar o deja el campo vacío
    if (newTitle === null) {
        return;
    }
    
    // Validar que no esté vacío
    if (newTitle.trim() === "") {
        alert("The title cannot be empty. Please enter a valid title.");
        return;
    }
    
    // Actualizar la tarea
    task.title = newTitle.trim();
    saveTasks();
    refreshUI();
}

// Función para marcar todas las tareas como completadas
function markAllTasksComplete() {
    if (tasks.length === 0) {
        alert("No hay tareas para marcar como completadas");
        return;
    }
    
    const allCompleted = tasks.every(task => task.completed);
    
    if (allCompleted) {
        if (confirm("Todas las tareas ya están marcadas como completadas. ¿Deseas desmarcas todas?")) {
            tasks.forEach(task => task.completed = false);
        } else {
            return;
        }
    } else {
        if (confirm("¿Deseas marcar todas las tareas como completadas?")) {
            tasks.forEach(task => task.completed = true);
        } else {
            return;
        }
    }
    
    saveTasks();
    refreshUI();
}

// Función para eliminar todas las tareas completadas
function deleteAllCompletedTasks() {
    const completedCount = tasks.filter(task => task.completed).length;
    
    if (completedCount === 0) {
        alert("No hay tareas completadas para eliminar");
        return;
    }
    
    if (confirm(`¿Deseas eliminar ${completedCount} tarea${completedCount !== 1 ? 's' : ''} completada${completedCount !== 1 ? 's' : ''}? Esta acción no se puede deshacer.`)) {
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        refreshUI();
    }
}

// ============================================
// FUNCIONES DE FILTRO
// ============================================

// Función para filtrar tareas según el filtro actual
function getFilteredTasks() {
    let filtered = tasks;
    
    // Filtrar por estado (all, pending, completed)
    if (currentFilter === "pending") {
        filtered = filtered.filter(task => !task.completed);
    } else if (currentFilter === "completed") {
        filtered = filtered.filter(task => task.completed);
    }
    
    // Filtrar por categoría (si no es "All")
    if (selectedCategory !== "All") {
        filtered = filtered.filter(task => task.tag === selectedCategory);
    }
    
    // Filtrar por término de búsqueda (si existe)
    if (searchTerm.trim() !== "") {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(task => 
            task.title.toLowerCase().includes(searchLower) ||
            task.description.toLowerCase().includes(searchLower) ||
            task.tag.toLowerCase().includes(searchLower)
        );
    }
    
    return filtered;
}

// Función para actualizar el botón activo
function updateActiveFilter(filterId) {
    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.classList.remove("active");
    });
    getElement(filterId).classList.add("active");
}

// Función para cambiar el filtro
function setFilter(filter) {
    currentFilter = filter;
    
    const filterMap = {
        all: "all-tasks-btn",
        pending: "pending-tasks-btn",
        completed: "completed-tasks-btn"
    };
    
    updateActiveFilter(filterMap[filter]);
    renderTasks();
}

// Función para actualizar el término de búsqueda
function updateSearch(term) {
    searchTerm = term;
    renderTasks();
}

// Función para cambiar la categoría activa
function filterByCategory(category) {
    selectedCategory = category;
    
    // Actualizar clase activa en las categorías
    document.querySelectorAll(".category-item").forEach(item => {
        item.classList.remove("active");
    });
    
    const activeItem = document.querySelector(`[data-category="${category}"]`);
    if (activeItem) {
        activeItem.classList.add("active");
    }
    
    renderTasks();
}

// ============================================
// FUNCIONES DE RENDERIZADO
// ============================================

// Obtener mensaje de lista vacía según el filtro
function getEmptyMessage() {
    const messages = {
        all: "No hay tareas aún. ¡Agrega una!",
        pending: "No hay tareas pendientes.",
        completed: "No hay tareas completadas."
    };
    return messages[currentFilter] || messages.all;
}

// Rellenar datos de la tarea en el template
function fillTaskData(taskElement, task) {
    taskElement.querySelector(".task-title").textContent = task.title;
    taskElement.querySelector(".task-description").textContent = task.description || "Sin descripción";
    taskElement.querySelector(".task-status").textContent = task.tag;
    
    const checkbox = taskElement.querySelector(".task-checkbox");
    checkbox.checked = task.completed;
}

// Crear botón de eliminar
function createDeleteButton(task) {
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Eliminar";
    deleteBtn.className = "delete-btn";
    deleteBtn.addEventListener("click", () => deleteTask(task));
    return deleteBtn;
}

// Crear botón de editar
function createEditButton(task) {
    const editBtn = document.createElement("button");
    editBtn.textContent = "Editar";
    editBtn.className = "edit-btn";
    editBtn.addEventListener("click", () => editTaskTitle(task));
    return editBtn;
}

// Agregar eventos a la tarea
function addTaskEvents(listItem, task) {
    const checkbox = listItem.querySelector(".task-checkbox");
    checkbox.addEventListener("change", () => toggleTaskCompletion(task));
}

// Renderizar una tarea individual
function renderTaskItem(task) {
    const taskTemplate = getElement("taskTemplate");
    const taskElement = taskTemplate.content.cloneNode(true);
    const listItem = taskElement.querySelector(".task-item");
    
    // Agregar clase si está completada
    if (task.completed) {
        listItem.classList.add("completed");
    }
    
    fillTaskData(taskElement, task);
    addTaskEvents(listItem, task);
    
    const taskContent = taskElement.querySelector(".task-content");
    
    // Crear contenedor para los botones
    const buttonsContainer = document.createElement("div");
    buttonsContainer.className = "task-buttons";
    
    const editBtn = createEditButton(task);
    const deleteBtn = createDeleteButton(task);
    
    buttonsContainer.appendChild(editBtn);
    buttonsContainer.appendChild(deleteBtn);
    taskContent.appendChild(buttonsContainer);
    
    return taskElement;
}

// Función para renderizar todas las tareas en el DOM
function renderTasks() {
    const tasksList = getElement("tasksList");
    tasksList.innerHTML = "";

    const filteredTasks = getFilteredTasks();

    if (filteredTasks.length === 0) {
        tasksList.innerHTML = `<li style='text-align: center; color: #999; padding: 20px;'>${getEmptyMessage()}</li>`;
        return;
    }

    filteredTasks.forEach(task => {
        const taskElement = renderTaskItem(task);
        tasksList.appendChild(taskElement);
    });
}

// Función para limpiar el formulario
function clearForm() {
    getElement("task").value = "";
    getElement("description").value = "";
    getElement("tags").value = "";
}

// ============================================
// INICIALIZACIÓN
// ============================================

// Configurar event listeners de los botones de filtro
function setupFilterButtons() {
    const filterButtonsConfig = [
        { id: "all-tasks-btn", filter: "all" },
        { id: "pending-tasks-btn", filter: "pending" },
        { id: "completed-tasks-btn", filter: "completed" }
    ];
    
    filterButtonsConfig.forEach(config => {
        getElement(config.id).addEventListener("click", () => setFilter(config.filter));
    });
}

// Inicializar la aplicación cuando carga el DOM
document.addEventListener("DOMContentLoaded", () => {
    // Cargar tareas guardadas
    loadTasks();
    refreshUI();
    
    const form = document.querySelector("form");
    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const title = getElement("task").value;
        const description = getElement("description").value;
        const tag = getElement("tags").value || " Sin categoría";

        addTask(title, description, tag);
    });

    setupFilterButtons();
    
    // Agregar event listener para la búsqueda
    const searchInput = getElement("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            updateSearch(e.target.value);
        });
    }
    
    // Agregar event listener para marcar todas las tareas
    const markAllBtn = getElement("markAllCompleteBtn");
    if (markAllBtn) {
        markAllBtn.addEventListener("click", markAllTasksComplete);
    }
    
    // Agregar event listener para eliminar todas las completadas
    const deleteCompletedBtn = getElement("deleteCompletedBtn");
    if (deleteCompletedBtn) {
        deleteCompletedBtn.addEventListener("click", deleteAllCompletedTasks);
    }
    
    // Agregar event listeners a las categorías
    const categoryItems = document.querySelectorAll(".category-item");
    categoryItems.forEach(item => {
        item.addEventListener("click", () => {
            const category = item.getAttribute("data-category");
            filterByCategory(category);
        });
    });
    
    // Marcar "All" como activo por defecto
    document.querySelector('[data-category="All"]')?.classList.add("active");
});

// =============================================
// TOGGLE DARK MODE (opcional)
// =============================================
const darkModeToggle = document.getElementById('darkModeToggle');

// 1. Definir la función de guardado
function saveDarkModePreference(isDark) {
    localStorage.setItem("darkMode", isDark ? "enabled" : "disabled");
}

// 2. Definir la función de carga
function loadDarkModePreference() {
    const darkModeSetting = localStorage.getItem("darkMode");
    if (darkModeSetting === "enabled") {
        document.documentElement.classList.add("dark");
    }
}

// 3. Ejecutar carga al iniciar
loadDarkModePreference();

// 4. Evento del botón
darkModeToggle.addEventListener("click", () => {
    // Alterna la clase en el HTML (raíz)
    const isDark = document.documentElement.classList.toggle("dark"); 
    saveDarkModePreference(isDark);
});