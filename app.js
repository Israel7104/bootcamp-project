// Array para almacenar todas las tareas
let tasks = [];
let nextId = 1;
let currentFilter = "all"; // "all", "pending", "completed"
let searchTerm = ""; // Término de búsqueda
let selectedCategory = "All"; // Categoría seleccionada
/** @type {Task | null} Tarea abierta en el diálogo de edición */
let taskBeingEdited = null;
/** @type {string[]} Lista de categorías disponibles */
let categories = ["Trabajo", "Personal", "Compras"];

/**
 * @typedef {Object} Task
 * @property {number} id - Identificador único autoincremental.
 * @property {string} title - Título principal de la tarea.
 * @property {string} description - Descripción opcional de la tarea.
 * @property {string} tag - Categoría o etiqueta asignada.
 * @property {Date} createdAt - Fecha de creación.
 * @property {boolean} completed - Estado de finalización.
 */

// ============================================
// FUNCIONES AUXILIARES
// ============================================

// Obtener elemento del DOM por ID
/**
 * Obtiene un elemento del DOM por su identificador.
 * @param {string} id - ID del elemento a buscar.
 * @returns {HTMLElement|null} Elemento encontrado o null si no existe.
 */
function getElement(id) {
    return document.getElementById(id);
}

// Limpiar y refrescar la interfaz
function refreshUI() {
    updateCounters();
    renderSidebarCategories();
    updateCategoriesDatalist();
    renderTasks();
}

// Guardar estado y refrescar interfaz
function persistAndRefresh() {
    saveTasks();
    refreshUI();
}

// Registrar listener solo si el elemento existe
/**
 * Registra un event listener si el elemento destino existe.
 * @param {string} elementId - ID del elemento al que se le agregará el listener.
 * @param {string} eventName - Nombre del evento (por ejemplo, "click" o "input").
 * @param {(event: Event) => void} handler - Función manejadora del evento.
 * @returns {void}
 */
function addListenerIfExists(elementId, eventName, handler) {
    const element = getElement(elementId);
    if (element) {
        element.addEventListener(eventName, handler);
    }
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

// Guardar categorías en localStorage
function saveCategories() {
    try {
        localStorage.setItem("categories", JSON.stringify(categories));
    } catch (error) {
        console.error("Error al guardar categorías en localStorage:", error);
    }
}

// Cargar categorías del localStorage
function loadCategories() {
    try {
        const saved = localStorage.getItem("categories");
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
                categories = parsed;
            }
        }
    } catch (error) {
        console.error("Error al cargar categorías de localStorage:", error);
        categories = ["Trabajo", "Personal", "Compras"];
    }
}

// Cargar tareas del LocalStorage
/**
 * Carga tareas y metadatos desde localStorage.
 * Si los datos no existen o son inválidos, inicializa el estado por defecto.
 * @returns {void}
 */
function loadTasks() {
    loadCategories();
    try {
        const savedTasks = localStorage.getItem("tasks");
        const savedNextId = localStorage.getItem("nextId");
        
        // Si hay tareas guardadas, intentar cargarlas
        if (savedTasks) {
            const parsedTasks = JSON.parse(savedTasks);
            
            // Validar que sea un array válido
            if (Array.isArray(parsedTasks) && parsedTasks.length > 0) {
                tasks = parsedTasks;
                
                // Migrar categorías antiguas en inglés al español
                const tagMigration = { "Work": "Trabajo", "Shopping": "Compras" };
                tasks = tasks.map(task => ({
                    ...task,
                    tag: tagMigration[task.tag] || task.tag
                }));

                // Agregar a la lista cualquier categoría personalizada de tareas existentes
                tasks.forEach(task => {
                    if (task.tag && !categories.includes(task.tag)) {
                        categories.push(task.tag);
                    }
                });

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
    categories = ["Trabajo", "Personal", "Compras"];
}

// Limpiar localStorage y reiniciar
function clearAllData() {
    if (confirm("¿Estás seguro de que quieres eliminar todas las tareas?")) {
        localStorage.removeItem("tasks");
        localStorage.removeItem("nextId");
        localStorage.removeItem("categories");
        initializeDefaultState();
        refreshUI();
        console.log("Todos los datos han sido eliminados");
    }
}

// ============================================
// FUNCIONES DE TAREAS
// ============================================

// Función constructora para crear nuevas tareas
/**
 * Crea un objeto tarea con estructura homogénea.
 * @param {string} title - Título de la tarea.
 * @param {string} description - Descripción de la tarea.
 * @param {string} tag - Categoría seleccionada.
 * @returns {Task} Tarea lista para almacenarse en memoria.
 */
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

// Validar y normalizar los datos del formulario
/**
 * Valida y normaliza los datos del formulario antes de crear una tarea.
 * @param {string} title - Título ingresado por el usuario.
 * @param {string} description - Descripción ingresada por el usuario.
 * @param {string} tag - Categoría seleccionada.
 * @returns {{title: string, description: string, tag: string} | null}
 * Devuelve datos normalizados o null si la validación falla.
 */
function validateTaskForm(title, description, tag) {
    const normalizedTitle = title.trim();
    const normalizedDescription = description.trim();
    const normalizedTag = tag.trim();

    if (normalizedTitle === "") {
        alert("El título es obligatorio.");
        return null;
    }

    if (normalizedTitle.length < 3) {
        alert("El título debe tener al menos 3 caracteres.");
        return null;
    }

    if (normalizedTitle.length > 80) {
        alert("El título no puede superar los 80 caracteres.");
        return null;
    }

    if (normalizedDescription.length > 300) {
        alert("La descripción no puede superar los 300 caracteres.");
        return null;
    }

    if (normalizedTag === "") {
        alert("Debes seleccionar una categoría.");
        return null;
    }

    return {
        title: normalizedTitle,
        description: normalizedDescription,
        tag: normalizedTag
    };
}

// Agregar categoría a la lista si no existe aún
function addCategoryIfNew(tag) {
    const normalized = tag ? tag.trim() : "";
    const exists = categories.some(category => category.toLowerCase() === normalized.toLowerCase());
    if (normalized && !exists) {
        categories.push(normalized);
        saveCategories();
    }
}

/**
 * Crea un botón de categoría para selección rápida.
 * @param {string} category - Nombre de la categoría.
 * @param {HTMLInputElement} input - Input objetivo.
 * @param {HTMLElement} quickPicker - Contenedor de botones.
 * @returns {HTMLButtonElement}
 */
function createCategoryChip(category, input, quickPicker) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "category-chip";
    chip.textContent = category;
    chip.addEventListener("click", () => {
        input.value = category;
        quickPicker.classList.add("hidden");
    });
    return chip;
}

/**
 * Renderiza categorías sugeridas en la ventanita rápida.
 * @param {HTMLInputElement} input - Campo de categoría.
 * @param {HTMLElement} quickPicker - Contenedor visual de sugerencias.
 * @returns {void}
 */
function renderCategoryQuickPicker(input, quickPicker) {
    const term = input.value.trim().toLowerCase();
    const matchingCategories = categories.filter(category => category.toLowerCase().includes(term)).slice(0, 8);
    quickPicker.innerHTML = "";

    if (matchingCategories.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "quick-picker-empty";
        emptyMessage.textContent = "Escribe y presiona Enter para crear esta categoría.";
        quickPicker.appendChild(emptyMessage);
        return;
    }

    matchingCategories.forEach(category => {
        quickPicker.appendChild(createCategoryChip(category, input, quickPicker));
    });
}

/**
 * Configura la ventanita de selección rápida para un input de categoría.
 * @param {string} inputId - ID del input objetivo.
 * @param {string} quickPickerId - ID del contenedor de sugerencias.
 * @returns {void}
 */
function setupCategoryQuickPicker(inputId, quickPickerId) {
    const input = getElement(inputId);
    const quickPicker = getElement(quickPickerId);
    if (!input || !quickPicker) {
        return;
    }

    const showQuickPicker = () => {
        renderCategoryQuickPicker(input, quickPicker);
        quickPicker.classList.remove("hidden");
    };

    input.addEventListener("focus", showQuickPicker);
    input.addEventListener("input", showQuickPicker);
    input.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            quickPicker.classList.add("hidden");
            return;
        }

        if (event.key === "Enter") {
            const typedCategory = input.value.trim();
            if (typedCategory) {
                addCategoryIfNew(typedCategory);
                updateCategoriesDatalist();
                renderSidebarCategories();
            }
        }
    });

    input.addEventListener("blur", () => {
        setTimeout(() => {
            quickPicker.classList.add("hidden");
        }, 120);
    });
}

// Función para agregar una tarea al array y actualizar el DOM
/**
 * Crea y agrega una tarea al estado global, persiste cambios y refresca la UI.
 * @param {string} title - Título de la tarea.
 * @param {string} description - Descripción de la tarea.
 * @param {string} tag - Categoría de la tarea.
 * @returns {void}
 */
function addTask(title, description, tag) {
    if (title.trim() === "") {
        alert("Por favor ingresa un título para la tarea");
        return;
    }

    const newTask = createTask(title, description, tag);
    tasks.push(newTask);
    addCategoryIfNew(tag);
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
        persistAndRefresh();
    }
}

// Función para cambiar el estado de completado de una tarea
function toggleTaskCompletion(task) {
    task.completed = !task.completed;
    persistAndRefresh();
}

/**
 * Abre el diálogo de edición con título, descripción y categoría.
 * @param {Task} task - Tarea a editar.
 * @returns {void}
 */
function openEditTaskDialog(task) {
    taskBeingEdited = task;
    getElement("edit-task-title").value = task.title;
    getElement("edit-task-description").value = task.description || "";
    getElement("edit-task-tags").value = task.tag || categories[0] || "";
    getElement("editTaskDialog").showModal();
}

/**
 * Aplica los cambios del formulario de edición si pasan la validación.
 * @returns {void}
 */
function submitEditTaskForm() {
    if (!taskBeingEdited) {
        return;
    }
    const title = getElement("edit-task-title").value;
    const description = getElement("edit-task-description").value;
    const tag = getElement("edit-task-tags").value;
    const data = validateTaskForm(title, description, tag);
    if (!data) {
        return;
    }
    taskBeingEdited.title = data.title;
    taskBeingEdited.description = data.description;
    taskBeingEdited.tag = data.tag;
    taskBeingEdited = null;
    addCategoryIfNew(data.tag);
    getElement("editTaskDialog").close();
    persistAndRefresh();
}

function closeEditTaskDialog() {
    taskBeingEdited = null;
    getElement("editTaskDialog").close();
}

// Función para marcar todas las tareas como completadas
function markAllTasksComplete() {
    if (tasks.length === 0) {
        alert("No hay tareas para marcar como completadas");
        return;
    }
    
    const allCompleted = tasks.every(task => task.completed);
    const confirmMessage = allCompleted
        ? "Todas las tareas ya están marcadas como completadas. ¿Deseas desmarcas todas?"
        : "¿Deseas marcar todas las tareas como completadas?";

    if (!confirm(confirmMessage)) {
        return;
    }

    tasks.forEach(task => {
        task.completed = !allCompleted;
    });
    persistAndRefresh();
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
        persistAndRefresh();
    }
}

// ============================================
// FUNCIONES DE FILTRO
// ============================================

// Función para filtrar tareas según el filtro actual
/**
 * Obtiene la lista de tareas según filtros de estado, categoría y búsqueda.
 * @returns {Task[]} Lista de tareas filtradas.
 */
function getFilteredTasks() {
    let filtered = tasks;
    
    // Filtrar por estado (todas, pendientes, completadas)
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
/**
 * Cambia el filtro principal de estado y vuelve a renderizar.
 * @param {"all"|"pending"|"completed"} filter - Filtro de estado a aplicar.
 * @returns {void}
 */
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
/**
 * Actualiza el término de búsqueda en memoria y refresca el listado.
 * @param {string} term - Texto de búsqueda ingresado por el usuario.
 * @returns {void}
 */
function updateSearch(term) {
    searchTerm = term;
    renderTasks();
}

// Función para cambiar la categoría activa
/**
 * Aplica filtro por categoría y actualiza la opción visual activa.
 * @param {string} category - Categoría seleccionada.
 * @returns {void}
 */
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

// Crear botón de acción de tarea
function createTaskActionButton(label, className, onClick) {
    const button = document.createElement("button");
    button.textContent = label;
    button.className = className;
    button.addEventListener("click", onClick);
    return button;
}

// Agregar eventos a la tarea
function addTaskEvents(listItem, task) {
    const checkbox = listItem.querySelector(".task-checkbox");
    checkbox.addEventListener("change", () => toggleTaskCompletion(task));
}

// Renderizar una tarea individual
/**
 * Renderiza una tarea individual usando el template del DOM.
 * @param {Task} task - Tarea a renderizar.
 * @returns {DocumentFragment} Fragmento listo para insertarse en la lista.
 */
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
    
    const editBtn = createTaskActionButton("Editar", "edit-btn", () => openEditTaskDialog(task));
    const deleteBtn = createTaskActionButton("Eliminar", "delete-btn", () => deleteTask(task));
    
    buttonsContainer.appendChild(editBtn);
    buttonsContainer.appendChild(deleteBtn);
    taskContent.appendChild(buttonsContainer);
    
    return taskElement;
}

// Actualizar las opciones del datalist de categorías
function updateCategoriesDatalist() {
    const datalist = document.getElementById("categories-datalist");
    if (!datalist) return;
    datalist.innerHTML = "";
    categories.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat;
        datalist.appendChild(option);
    });
}

// Renderizar categorías en la barra lateral
function renderSidebarCategories() {
    const categoriesList = getElement("categoriesList");
    const allItem = categoriesList.querySelector('[data-category="All"]');
    categoriesList.innerHTML = "";
    if (allItem) {
        if (selectedCategory === "All") {
            allItem.classList.add("active");
        } else {
            allItem.classList.remove("active");
        }
        categoriesList.appendChild(allItem);
    }
    categories.forEach(cat => {
        const li = document.createElement("li");
        li.className = "category-item";
        if (selectedCategory === cat) li.classList.add("active");
        li.setAttribute("data-category", cat);
        li.setAttribute("tabindex", "0");
        li.textContent = cat;
        li.addEventListener("click", () => filterByCategory(cat));
        li.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                filterByCategory(cat);
            }
        });
        categoriesList.appendChild(li);
    });
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
        const tag = getElement("tags").value;

        addTask(title, description, tag);
    });

    setupFilterButtons();
    setupCategoryQuickPicker("tags", "tagsQuickPicker");
    setupCategoryQuickPicker("edit-task-tags", "editTagsQuickPicker");
    
    addListenerIfExists("searchInput", "input", (e) => updateSearch(e.target.value));
    addListenerIfExists("markAllCompleteBtn", "click", markAllTasksComplete);
    addListenerIfExists("deleteCompletedBtn", "click", deleteAllCompletedTasks);
    
    // Listener para "Todas las categorías"; el resto se gestiona en renderSidebarCategories()
    const allCategoryItem = document.querySelector('[data-category="All"]');
    if (allCategoryItem) {
        allCategoryItem.addEventListener("click", () => filterByCategory("All"));
        allCategoryItem.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                filterByCategory("All");
            }
        });
    }

    const editDialog = getElement("editTaskDialog");
    getElement("editTaskForm").addEventListener("submit", (e) => {
        e.preventDefault();
        submitEditTaskForm();
    });
    getElement("editTaskCancel").addEventListener("click", () => closeEditTaskDialog());
    editDialog.addEventListener("close", () => {
        taskBeingEdited = null;
    });
});

// =============================================
// ALTERNAR MODO OSCURO (opcional)
// =============================================
const darkModeToggle = document.getElementById('darkModeToggle');

// 1. Definir la función de guardado
/**
 * Persiste la preferencia de modo oscuro en localStorage.
 * @param {boolean} isDark - Indica si el modo oscuro está activo.
 * @returns {void}
 */
function saveDarkModePreference(isDark) {
    localStorage.setItem("darkMode", isDark ? "enabled" : "disabled");
}

// 2. Definir la función de carga
/**
 * Aplica la preferencia de modo oscuro almacenada al cargar la página.
 * @returns {void}
 */
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