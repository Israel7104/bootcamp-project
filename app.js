import apiClient from "./src/api/client.js?v=20260407";

const DEFAULT_CATEGORIES = ["Trabajo", "Personal", "Compras"];

// Array para almacenar todas las tareas
let tasks = [];
let currentFilter = "all"; // "all", "pending", "completed"
let searchTerm = ""; // Término de búsqueda
let selectedCategory = "All"; // Categoría seleccionada
let sortMode = "created"; // "created" o "alphabetical"
let sortDirection = "asc"; // "asc" o "desc"
/** @type {Task | null} Tarea abierta en el diálogo de edición */
let taskBeingEdited = null;
/** @type {string[]} Lista de categorías disponibles */
let categories = [...DEFAULT_CATEGORIES];
let activeRequests = 0;
let networkState = { status: "idle", message: "" };

/**
 * @typedef {Object} Task
 * @property {number} id - Identificador único autoincremental.
 * @property {string} title - Título principal de la tarea.
 * @property {string} description - Descripción opcional de la tarea.
 * @property {string} tag - Categoría o etiqueta asignada.
 * @property {string} createdAt - Fecha de creación en formato ISO.
 * @property {string|null} updatedAt - Fecha de última edición en formato ISO.
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

function isNetworkBusy() {
    return activeRequests > 0;
}

function getNetworkErrorMessage(error, fallbackMessage) {
    if (error?.status >= 500) {
        return "El servidor devolvió un error interno. Inténtalo de nuevo en unos segundos.";
    }

    if (error?.status >= 400) {
        return error.message || fallbackMessage;
    }

    return fallbackMessage || error?.message || "No se pudo conectar con el servidor.";
}

function renderNetworkFeedback() {
    const container = getElement("networkState");
    const messageElement = getElement("networkStateMessage");
    const spinner = getElement("networkStateSpinner");
    const retryButton = getElement("retryLoadBtn");

    if (!container || !messageElement || !spinner || !retryButton) {
        return;
    }

    const shouldShow = networkState.status === "loading" || networkState.status === "error";
    container.hidden = !shouldShow;
    if (!shouldShow) {
        return;
    }

    container.className = `network-state network-state--${networkState.status}`;
    messageElement.textContent = networkState.message;
    spinner.hidden = networkState.status !== "loading";
    retryButton.classList.toggle("hidden", networkState.status !== "error");
}

function updateInteractiveControls() {
    const controls = document.querySelectorAll("main input, main textarea, main button, aside .filter-btn");
    const shouldDisable = isNetworkBusy();

    controls.forEach((control) => {
        if (control.id === "retryLoadBtn") {
            control.disabled = false;
            return;
        }

        control.disabled = shouldDisable;
    });
}

function syncNetworkUi() {
    renderNetworkFeedback();
    renderTasks();
    updateInteractiveControls();
}

function startNetworkRequest(message) {
    activeRequests += 1;
    networkState = { status: "loading", message };
    syncNetworkUi();
}

function finishNetworkRequest() {
    activeRequests = Math.max(0, activeRequests - 1);
    if (activeRequests === 0) {
        networkState = { status: "success", message: "" };
    }
    syncNetworkUi();
}

function failNetworkRequest(error, fallbackMessage) {
    activeRequests = Math.max(0, activeRequests - 1);
    networkState = {
        status: "error",
        message: getNetworkErrorMessage(error, fallbackMessage)
    };
    syncNetworkUi();
}

// Limpiar y refrescar la interfaz
function refreshUI() {
    updateCounters();
    renderSidebarCategories();
    updateCategoriesDatalist();
    renderNetworkFeedback();
    renderTasks();
    updateInteractiveControls();
}

// Guardar estado y refrescar interfaz
function persistAndRefresh() {
    syncCategoriesFromTasks();
    refreshUI();
}

function buildCategoriesFromTasks(taskList = tasks) {
    const categorySet = new Set(DEFAULT_CATEGORIES);

    taskList.forEach(task => {
        const normalizedTag = typeof task.tag === "string" ? task.tag.trim() : "";
        if (normalizedTag) {
            categorySet.add(normalizedTag);
        }
    });

    return Array.from(categorySet);
}

function syncCategoriesFromTasks() {
    categories = buildCategoriesFromTasks(tasks);
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
// SINCRONIZACION CON LA API
// ============================================

/**
 * Carga tareas y metadatos desde la API.
 * Si la respuesta falla, inicializa el estado por defecto.
 * @returns {Promise<void>}
 */
async function loadTasks() {
    startNetworkRequest("Cargando tareas desde el servidor...");

    try {
        tasks = await apiClient.getTasks();
        syncCategoriesFromTasks();
        console.log("Tareas cargadas desde la API:", tasks.length);
        finishNetworkRequest();
    } catch (error) {
        console.error("Error al cargar tareas desde la API:", error);
        initializeDefaultState();
        failNetworkRequest(error, "No se pudieron cargar las tareas desde el servidor.");
    }
}

// Inicializar estado por defecto
function initializeDefaultState() {
    tasks = [];
    categories = [...DEFAULT_CATEGORIES];
}

// Eliminar todas las tareas en el servidor y reiniciar el estado local
async function clearAllData() {
    if (confirm("¿Estás seguro de que quieres eliminar todas las tareas?")) {
        startNetworkRequest("Eliminando todas las tareas...");

        try {
            await Promise.all(tasks.map(task => apiClient.deleteTask(task.id)));
            initializeDefaultState();
            finishNetworkRequest();
            refreshUI();
            console.log("Todos los datos han sido eliminados");
        } catch (error) {
            console.error("Error al eliminar todas las tareas:", error);
            failNetworkRequest(error, "No se pudieron eliminar todas las tareas.");
        }
    }
}

// ============================================
// FUNCIONES DE TAREAS
// ============================================

// Formatear fecha para mostrarla en cada tarea
function formatTaskDate(dateValue) {
    if (!dateValue) {
        return "";
    }

    const parsedDate = new Date(dateValue);
    if (Number.isNaN(parsedDate.getTime())) {
        return "Fecha no disponible";
    }

    return parsedDate.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}

// Construir el texto de metadatos de una tarea
function buildTaskMetaText(task) {
    const createdText = `Creada: ${formatTaskDate(task.createdAt)}`;
    if (!task.updatedAt) {
        return createdText;
    }

    return `${createdText} | Editada: ${formatTaskDate(task.updatedAt)}`;
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
async function addTask(title, description, tag) {
    const data = validateTaskForm(title, description, tag);
    if (!data) {
        return;
    }

    startNetworkRequest("Guardando tarea...");

    try {
        const newTask = await apiClient.createTask({
            ...data,
            completed: false
        });
        tasks.push(newTask);
        finishNetworkRequest();
        persistAndRefresh();
        clearForm();
    } catch (error) {
        console.error("Error al crear la tarea:", error);
        failNetworkRequest(error, "No se pudo crear la tarea.");
    }
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
async function deleteTask(task) {
    startNetworkRequest("Eliminando tarea...");

    try {
        await apiClient.deleteTask(task.id);
        tasks = tasks.filter(currentTask => currentTask.id !== task.id);
        finishNetworkRequest();
        persistAndRefresh();
    } catch (error) {
        console.error("Error al eliminar la tarea:", error);
        failNetworkRequest(error, "No se pudo eliminar la tarea.");
    }
}

// Función para cambiar el estado de completado de una tarea
async function toggleTaskCompletion(task) {
    startNetworkRequest("Actualizando estado de la tarea...");

    try {
        const updatedTask = await apiClient.updateTask(task.id, {
            title: task.title,
            description: task.description,
            tag: task.tag,
            completed: !task.completed
        });

        Object.assign(task, updatedTask);
        finishNetworkRequest();
        persistAndRefresh();
    } catch (error) {
        console.error("Error al actualizar el estado de la tarea:", error);
        failNetworkRequest(error, "No se pudo actualizar la tarea.");
        renderTasks();
    }
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
async function submitEditTaskForm() {
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

    startNetworkRequest("Guardando cambios de la tarea...");

    try {
        const updatedTask = await apiClient.updateTask(taskBeingEdited.id, {
            ...data,
            completed: taskBeingEdited.completed
        });

        Object.assign(taskBeingEdited, updatedTask);
        addCategoryIfNew(data.tag);
        taskBeingEdited = null;
        getElement("editTaskDialog").close();
        finishNetworkRequest();
        persistAndRefresh();
    } catch (error) {
        console.error("Error al editar la tarea:", error);
        failNetworkRequest(error, "No se pudieron guardar los cambios.");
    }
}

function closeEditTaskDialog() {
    taskBeingEdited = null;
    getElement("editTaskDialog").close();
}

/**
 * Muestra un diálogo de confirmación con estilo de la aplicación.
 * @param {string} message - Mensaje a mostrar en el diálogo.
 * @returns {Promise<boolean>} true si el usuario acepta, false si cancela.
 */
function showStyledConfirm(message) {
    const dialog = getElement("markAllConfirmDialog");
    const messageElement = getElement("confirmDialogMessage");
    const acceptButton = getElement("confirmDialogAccept");
    const cancelButton = getElement("confirmDialogCancel");

    if (!dialog || !messageElement || !acceptButton || !cancelButton || typeof dialog.showModal !== "function") {
        return Promise.resolve(confirm(message));
    }

    messageElement.textContent = message;
    dialog.showModal();

    return new Promise((resolve) => {
        let resolved = false;

        const cleanup = () => {
            acceptButton.removeEventListener("click", onAccept);
            cancelButton.removeEventListener("click", onCancel);
            dialog.removeEventListener("cancel", onCancelEvent);
            dialog.removeEventListener("click", onBackdropClick);
            dialog.removeEventListener("close", onClose);
        };

        const finish = (value) => {
            if (resolved) return;
            resolved = true;
            cleanup();
            if (dialog.open) {
                dialog.close();
            }
            resolve(value);
        };

        const onAccept = () => finish(true);
        const onCancel = () => finish(false);
        const onCancelEvent = (event) => {
            event.preventDefault();
            finish(false);
        };
        const onBackdropClick = (event) => {
            if (event.target === dialog) {
                finish(false);
            }
        };
        const onClose = () => finish(false);

        acceptButton.addEventListener("click", onAccept);
        cancelButton.addEventListener("click", onCancel);
        dialog.addEventListener("cancel", onCancelEvent);
        dialog.addEventListener("click", onBackdropClick);
        dialog.addEventListener("close", onClose);
    });
}

// Función para marcar todas las tareas como completadas
async function markAllTasksComplete() {
    const visibleTasks = getFilteredTasks();

    if (visibleTasks.length === 0) {
        alert("No hay tareas visibles para marcar como completadas");
        return;
    }

    const allCompleted = visibleTasks.every(task => task.completed);
    const confirmMessage = allCompleted
        ? "Todas las tareas visibles ya están completadas. ¿Deseas desmarcarlas?"
        : "¿Deseas marcar como completadas todas las tareas visibles?";

    const confirmed = await showStyledConfirm(confirmMessage);
    if (!confirmed) {
        return;
    }

    startNetworkRequest(allCompleted
        ? "Desmarcando tareas visibles..."
        : "Marcando tareas visibles como completadas...");

    try {
        const updatedTasks = await Promise.all(
            visibleTasks.map(task => apiClient.updateTask(task.id, {
                title: task.title,
                description: task.description,
                tag: task.tag,
                completed: !allCompleted
            }))
        );

        const updatedTasksById = new Map(updatedTasks.map(task => [task.id, task]));
        tasks = tasks.map(task => updatedTasksById.get(task.id) || task);
        finishNetworkRequest();
        persistAndRefresh();
    } catch (error) {
        console.error("Error al actualizar las tareas visibles:", error);
        failNetworkRequest(error, "No se pudieron actualizar las tareas visibles.");
    }
}

// Función para eliminar todas las tareas completadas
async function deleteAllCompletedTasks() {
    const completedCount = tasks.filter(task => task.completed).length;
    
    if (completedCount === 0) {
        alert("No hay tareas completadas para eliminar");
        return;
    }

    const confirmed = await showStyledConfirm(`¿Deseas eliminar ${completedCount} tarea${completedCount !== 1 ? 's' : ''} completada${completedCount !== 1 ? 's' : ''}? Esta acción no se puede deshacer.`);
    if (!confirmed) {
        return;
    }

    startNetworkRequest("Eliminando tareas completadas...");

    try {
        const completedTasks = tasks.filter(task => task.completed);
        await Promise.all(completedTasks.map(task => apiClient.deleteTask(task.id)));
        tasks = tasks.filter(task => !task.completed);
        finishNetworkRequest();
        persistAndRefresh();
    } catch (error) {
        console.error("Error al eliminar las tareas completadas:", error);
        failNetworkRequest(error, "No se pudieron eliminar las tareas completadas.");
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

// Actualiza el contador de resultados de búsqueda y visibilidad del botón de limpiar
function updateSearchFeedback(resultCount) {
    const feedback = getElement("searchFeedback");
    const clearBtn = getElement("clearSearchBtn");
    const searchInput = getElement("searchInput");
    const term = searchTerm.trim();

    if (clearBtn) {
        clearBtn.classList.toggle("hidden", !term);
    }
    if (searchInput) {
        searchInput.classList.toggle("searching", !!term);
    }
    if (!feedback) {
        return;
    }

    if (!term) {
        feedback.textContent = "";
        feedback.className = "search-feedback";
        return;
    }

    if (resultCount === 0) {
        feedback.textContent = `Sin resultados para “${term}”`;
        feedback.className = "search-feedback search-feedback--empty";
    } else {
        feedback.textContent = `${resultCount} resultado${resultCount !== 1 ? "s" : ""} para “${term}”`;
        feedback.className = "search-feedback search-feedback--results";
    }
}

// Limpiar la búsqueda activa
function clearSearch() {
    const searchInput = getElement("searchInput");
    if (searchInput) {
        searchInput.value = "";
        searchInput.focus();
    }
    updateSearch("");
}

// Obtener timestamp de creación de forma robusta
function getTaskCreationTimestamp(task) {
    const parsedDate = new Date(task.createdAt).getTime();
    if (!Number.isNaN(parsedDate)) {
        return parsedDate;
    }
    return task.id || 0;
}

// Ordenar tareas según modo activo
function sortTasksByMode(taskList) {
    const sorted = [...taskList];

    if (sortMode === "alphabetical") {
        sorted.sort((a, b) => a.title.localeCompare(b.title, "es", { sensitivity: "base" }));
    } else {
        sorted.sort((a, b) => getTaskCreationTimestamp(a) - getTaskCreationTimestamp(b));
    }

    if (sortDirection === "desc") {
        sorted.reverse();
    }

    return sorted;
}

// Actualizar texto de los botones de orden
function updateSortButtonLabels() {
    const toggleSortBtn = getElement("toggleSortBtn");
    const toggleSortDirectionBtn = getElement("toggleSortDirectionBtn");

    if (toggleSortBtn) {
        toggleSortBtn.textContent = sortMode === "alphabetical" ? "Orden: A-Z" : "Orden: creación";
    }

    if (toggleSortDirectionBtn) {
        toggleSortDirectionBtn.textContent = sortDirection === "desc"
            ? "Dirección: Des"
            : "Dirección: Asc";
    }
}

// Alternar entre orden por creación y alfabético
function toggleSortMode() {
    sortMode = sortMode === "created" ? "alphabetical" : "created";
    updateSortButtonLabels();
    renderTasks();
}

// Alternar entre dirección ascendente y descendente
function toggleSortDirection() {
    sortDirection = sortDirection === "asc" ? "desc" : "asc";
    updateSortButtonLabels();
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
    if (searchTerm.trim()) {
        return `Sin resultados para “${searchTerm.trim()}”`;
    }
    const messages = {
        all: "No hay tareas aún. ¡Agrega una!",
        pending: "No hay tareas pendientes.",
        completed: "No hay tareas completadas."
    };
    return messages[currentFilter] || messages.all;
}

// Escapar caracteres especiales para construir expresiones regulares seguras
function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Renderizar texto con coincidencias resaltadas del término de búsqueda
function renderHighlightedText(element, text, term) {
    const content = text || "";
    const normalizedTerm = term.trim();
    element.textContent = "";

    if (!normalizedTerm) {
        element.textContent = content;
        return;
    }

    const regex = new RegExp(`(${escapeRegExp(normalizedTerm)})`, "ig");
    let lastIndex = 0;
    let match = regex.exec(content);

    while (match) {
        if (match.index > lastIndex) {
            element.appendChild(document.createTextNode(content.slice(lastIndex, match.index)));
        }

        const highlight = document.createElement("mark");
        highlight.className = "search-highlight";
        highlight.textContent = match[0];
        element.appendChild(highlight);

        lastIndex = regex.lastIndex;
        match = regex.exec(content);
    }

    if (lastIndex < content.length) {
        element.appendChild(document.createTextNode(content.slice(lastIndex)));
    }
}

// Rellenar datos de la tarea en el template
function fillTaskData(taskElement, task) {
    const term = searchTerm.trim();
    const titleElement = taskElement.querySelector(".task-title");
    const descriptionElement = taskElement.querySelector(".task-description");
    const statusElement = taskElement.querySelector(".task-status");

    renderHighlightedText(titleElement, task.title, term);
    renderHighlightedText(descriptionElement, task.description || "Sin descripción", term);
    taskElement.querySelector(".task-meta").textContent = buildTaskMetaText(task);
    renderHighlightedText(statusElement, task.tag, term);
    
    const checkbox = taskElement.querySelector(".task-checkbox");
    checkbox.checked = task.completed;
    checkbox.disabled = isNetworkBusy();
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
    editBtn.disabled = isNetworkBusy();
    deleteBtn.disabled = isNetworkBusy();
    
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
    if (!tasksList) {
        return;
    }

    tasksList.innerHTML = "";

    if (networkState.status === "loading" && tasks.length === 0) {
        const loadingLi = document.createElement("li");
        const spinner = document.createElement("span");
        const message = document.createElement("span");

        loadingLi.className = "tasks-loading-message";
        spinner.className = "loading-spinner";
        spinner.setAttribute("aria-hidden", "true");
        message.textContent = networkState.message || "Cargando tareas...";
        loadingLi.appendChild(spinner);
        loadingLi.appendChild(message);
        tasksList.appendChild(loadingLi);
        updateSearchFeedback(0);
        return;
    }

    if (networkState.status === "error" && tasks.length === 0) {
        const errorLi = document.createElement("li");
        errorLi.className = "tasks-error-message";
        errorLi.textContent = networkState.message || "No se pudieron cargar las tareas.";
        tasksList.appendChild(errorLi);
        updateSearchFeedback(0);
        return;
    }

    const filteredTasks = getFilteredTasks();
    const sortedTasks = sortTasksByMode(filteredTasks);

    updateSearchFeedback(sortedTasks.length);

    if (sortedTasks.length === 0) {
        const emptyLi = document.createElement("li");
        emptyLi.className = "tasks-empty-message";
        emptyLi.textContent = getEmptyMessage();
        tasksList.appendChild(emptyLi);
        return;
    }

    sortedTasks.forEach(task => {
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
document.addEventListener("DOMContentLoaded", async () => {
    // Cargar tareas desde la API
    await loadTasks();
    refreshUI();
    
    const form = document.querySelector("form");
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const title = getElement("task").value;
        const description = getElement("description").value;
        const tag = getElement("tags").value;

        await addTask(title, description, tag);
    });

    setupFilterButtons();
    setupCategoryQuickPicker("tags", "tagsQuickPicker");
    setupCategoryQuickPicker("edit-task-tags", "editTagsQuickPicker");
    updateSortButtonLabels();
    
    addListenerIfExists("searchInput", "input", (e) => updateSearch(e.target.value));
    addListenerIfExists("clearSearchBtn", "click", clearSearch);
    addListenerIfExists("toggleSortBtn", "click", toggleSortMode);
    addListenerIfExists("toggleSortDirectionBtn", "click", toggleSortDirection);
    addListenerIfExists("markAllCompleteBtn", "click", markAllTasksComplete);
    addListenerIfExists("deleteCompletedBtn", "click", deleteAllCompletedTasks);
    addListenerIfExists("retryLoadBtn", "click", async () => {
        await loadTasks();
        refreshUI();
    });
    
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
    getElement("editTaskForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        await submitEditTaskForm();
    });
    getElement("editTaskCancel").addEventListener("click", () => closeEditTaskDialog());
    editDialog.addEventListener("close", () => {
        taskBeingEdited = null;
    });
});

// =============================================
// DIALOG "ACERCA DE"
// =============================================
const aboutLink = document.getElementById("aboutLink");
const aboutDialog = document.getElementById("aboutDialog");
const aboutClose = document.getElementById("aboutClose");

if (aboutLink && aboutDialog) {
    aboutLink.addEventListener("click", (e) => {
        e.preventDefault();
        aboutDialog.showModal();
    });
}

if (aboutClose && aboutDialog) {
    aboutClose.addEventListener("click", () => aboutDialog.close());
}

if (aboutDialog) {
    aboutDialog.addEventListener("click", (e) => {
        if (e.target === aboutDialog) aboutDialog.close();
    });
}

// =============================================
// ALTERNAR MODO OSCURO (opcional)
// =============================================
const darkModeToggle = document.getElementById('darkModeToggle');

function initializeDarkMode() {
    const prefersDarkMode = globalThis.matchMedia
        && globalThis.matchMedia("(prefers-color-scheme: dark)").matches;

    document.documentElement.classList.toggle("dark", prefersDarkMode);
    updateDarkModeButtonLabel(prefersDarkMode);
}

/**
 * Actualiza el texto del botón según el tema actual.
 * @param {boolean} isDark - Indica si el modo oscuro está activo.
 * @returns {void}
 */
function updateDarkModeButtonLabel(isDark) {
    if (!darkModeToggle) {
        return;
    }
    darkModeToggle.textContent = isDark ? "Modo Claro" : "Modo Oscuro";
}

// 3. Aplicar preferencia del sistema al iniciar
initializeDarkMode();

// 4. Evento del botón
if (darkModeToggle) {
    darkModeToggle.addEventListener("click", () => {
        const isDark = document.documentElement.classList.toggle("dark");
        updateDarkModeButtonLabel(isDark);
    });
}