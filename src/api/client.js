const DEFAULT_API_BASE_URL = "http://localhost:3000/api/v1";

function getApiBaseUrl() {
    const configuredBaseUrl = globalThis.TASKFLOW_API_BASE_URL;
    if (typeof configuredBaseUrl === "string" && configuredBaseUrl.trim() !== "") {
        return configuredBaseUrl.replace(/\/$/, "");
    }

    return DEFAULT_API_BASE_URL;
}

async function request(path, options = {}) {
    let response;

    try {
        response = await fetch(`${getApiBaseUrl()}${path}`, {
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            },
            ...options
        });
    } catch (error) {
        const networkError = new Error("No se pudo conectar con el servidor.");
        networkError.status = 0;
        networkError.cause = error;
        throw networkError;
    }

    if (response.status === 204) {
        return null;
    }

    const data = await response.json().catch(() => null);
    if (!response.ok) {
        const message = data?.error || "No se pudo completar la solicitud al servidor.";
        const requestError = new Error(message);
        requestError.status = response.status;
        requestError.details = data;
        throw requestError;
    }

    return data;
}

function normalizeTaskFromApi(task) {
    return {
        id: Number(task.id),
        title: task.title || "",
        description: task.description || "",
        tag: typeof task.tag === "string" && task.tag.trim() ? task.tag.trim() : "General",
        createdAt: task.createdAt || new Date().toISOString(),
        updatedAt: task.updatedAt || null,
        completed: task.status === "completed"
    };
}

function normalizeTaskToApi(taskData) {
    return {
        title: taskData.title,
        description: taskData.description,
        tag: taskData.tag,
        status: taskData.completed ? "completed" : "pending"
    };
}

const apiClient = {
    async getTasks() {
        const tasks = await request("/tasks");
        return Array.isArray(tasks) ? tasks.map(normalizeTaskFromApi) : [];
    },

    async createTask(taskData) {
        const task = await request("/tasks", {
            method: "POST",
            body: JSON.stringify(normalizeTaskToApi(taskData))
        });

        return normalizeTaskFromApi(task);
    },

    async updateTask(taskId, taskData) {
        const task = await request(`/tasks/${taskId}`, {
            method: "PUT",
            body: JSON.stringify(normalizeTaskToApi(taskData))
        });

        return normalizeTaskFromApi(task);
    },

    async deleteTask(taskId) {
        await request(`/tasks/${taskId}`, {
            method: "DELETE"
        });
    }
};

export default apiClient;