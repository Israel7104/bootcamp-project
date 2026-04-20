# TaskFlow API

API rest para la página web TaskFlow

1. [Arquitectura general](#1-arquitectura-general)
2. [Estructura de carpetas](#2-estructura-de-carpetas)
3. [Backend — servidor Express](#3-backend--servidor-express)
   - [Pipeline de middlewares](#31-pipeline-de-middlewares)
   - [Capa de rutas](#32-capa-de-rutas)
   - [Capa de controladores](#33-capa-de-controladores)
   - [Capa de servicios](#34-capa-de-servicios)
   - [Señales del proceso y graceful shutdown](#35-señales-del-proceso-y-graceful-shutdown)
4. [Frontend — SPA Vanilla JS](#4-frontend--spa-vanilla-js)
   - [Cliente HTTP (src/api/client.js)](#41-cliente-http-srcapiclientjs)
   - [Gestión de estado de red](#42-gestión-de-estado-de-red)
   - [Módulos lógicos de app.js](#43-módulos-lógicos-de-appjs)
5. [Modelos de datos](#5-modelos-de-datos)
6. [API REST — referencia completa](#6-api-rest--referencia-completa)



## 1. Arquitectura general

```
┌─────────────────────────────────────────────────────┐
│                   NAVEGADOR                         │
│                                                     │
│  index.html ──► app.js (ES Module)                  │
│                    │                                │
│              src/api/client.js                      │
│                    │  fetch() API nativa            │
└────────────────────┼────────────────────────────────┘
                     │  HTTP/JSON  (localhost:3000)
┌────────────────────▼────────────────────────────────┐
│               NODE.JS + EXPRESS                     │
│                                                     │
│  Middlewares globales                               │
│       │                                             │
│  Router  /api/v1/tasks                              │
│       │                                             │
│  Controllers  ──►  Services  ──►  In-memory store   │
└─────────────────────────────────────────────────────┘
```

El frontend y el backend son **desacoplados**: el cliente ignora los detalles de implementación del servidor y el servidor no conoce la existencia del frontend. La comunicación se realiza exclusivamente mediante HTTP con cuerpos JSON.

---

## 2. Estructura de carpetas

```
bootcamp-project/
│
├── index.html              # Punto de entrada HTML, diálogos, template de tarea
├── style.css               # Sistema de diseño, variables CSS, layouts, responsive
├── app.js                  # Módulo principal del frontend (ES Module)
│
├── src/
│   └── api/
│       └── client.js       # Cliente HTTP: abstrae fetch(), normaliza payloads
│
├── server/                 # Aplicación Node.js completamente independiente
│   ├── package.json        # Dependencias y scripts del servidor
│   └── src/
│       ├── index.js        # Entry point: configura Express, middlewares, arranque
│       ├── routes/
│       │   └── task.routes.js      # Declaración de rutas HTTP → controladores
│       ├── controllers/
│       │   └── task.controller.js  # Parseo de request, validación de entrada, respuesta HTTP
│       └── services/
│           └── task.service.js     # Lógica de negocio, almacenamiento en memoria
│
├── config/
│   └── env.js              # Validación de variables de entorno requeridas
│
├── docs/
│   ├── ai/                 # Notas y reflexiones sobre el uso de IA en el proyecto
│   ├── design/             # Capturas de diseño y UX
│   ├── postman/            # Capturas de pruebas con Postman
│   └── testing/            # Capturas de pruebas visuales
│
└── README.md
```

### Decisiones de diseño

| Decisión | Justificación |
|---|---|
| `server/` como subproyecto independiente | Permite instalar dependencias de Node solo donde se necesitan. El frontend no requiere `node_modules`. |
| `src/api/client.js` separado de `app.js` | Principio de responsabilidad única: `client.js` solo conoce HTTP; `app.js` solo conoce el DOM. |
| Patrón Routes → Controllers → Services | Separa el protocolo HTTP (controladores) de la lógica de negocio (servicios), facilitando pruebas unitarias de cada capa. |
| ES Modules (`type: "module"`) en servidor | Consistencia con la sintaxis `import/export` usada en el frontend. Requiere Node.js ≥ 14.

---

## 3. Backend — servidor Express

**Entry point:** `server/src/index.js`

### 3.1 Pipeline de middlewares

Express procesa cada request a través de una cadena de middlewares registrados en orden. La secuencia real en este proyecto es:

```
Request entrante
      │
      ▼
┌─────────────────────────────────────────────────────┐
│  1. cors()                                          │
│     Inyecta cabeceras Access-Control-Allow-Origin   │
│     en cada respuesta. Permite que el navegador     │
│     ejecute fetch() desde un origen distinto al    │
│     del servidor (ej. Live Server en :5500 →       │
│     Express en :3000). Sin este middleware el       │
│     navegador bloquea la respuesta por política     │
│     de Same-Origin.                                 │
├─────────────────────────────────────────────────────┤
│  2. express.json()                                  │
│     Parsea el cuerpo de la request cuando la        │
│     cabecera Content-Type es application/json.      │
│     Serializa el buffer de bytes en req.body como  │
│     objeto JavaScript. Si el JSON está malformado  │
│     responde automáticamente 400 Bad Request.       │
├─────────────────────────────────────────────────────┤
│  3. express.urlencoded({ extended: true })          │
│     Parsea cuerpos con codificación                 │
│     application/x-www-form-urlencoded (formularios │
│     HTML nativos). Con extended: true usa la        │
│     librería "qs" para soportar objetos y arrays   │
│     anidados en los valores.                        │
├─────────────────────────────────────────────────────┤
│  4. Logger personalizado                            │
│     Middleware de aplicación (3 parámetros) que     │
│     imprime METHOD + path en stdout y llama a       │
│     next() para continuar la cadena. No modifica   │
│     req ni res.                                     │
├─────────────────────────────────────────────────────┤
│  5. Router /api/v1/tasks                            │
│     Sub-aplicación Express que agrupa las rutas     │
│     del recurso Task. Solo se ejecuta cuando el    │
│     path comienza con /api/v1/tasks.               │
├─────────────────────────────────────────────────────┤
│  6. Health check  GET /api/v1/health                │
│     Ruta de diagnóstico. Responde 200 OK si el     │
│     proceso está vivo. Útil para load balancers y  │
│     herramientas de monitorización.                 │
├─────────────────────────────────────────────────────┤
│  7. Catch-all 404                                   │
│     Middleware de aplicación que captura cualquier  │
│     request que no haya coincidido con ninguna      │
│     ruta anterior. Responde 404 con JSON.           │
├─────────────────────────────────────────────────────┤
│  8. Error handler global (4 parámetros)             │
│     Express reconoce un middleware de error por su  │
│     aridad (err, req, res, next). Recibe errores    │
│     propagados con next(err). Implementa un mapeo  │
│     semántico: si el mensaje contiene "NOT_FOUND"  │
│     responde 404; cualquier otro error no           │
│     controlado responde 500 sin exponer el stack    │
│     trace al cliente.                               │
└─────────────────────────────────────────────────────┘
      │
      ▼
   Response
```

> **Nota sobre el orden:** los middlewares de parsing (`json`, `urlencoded`) deben registrarse **antes** que las rutas. Si se registrasen después, `req.body` estaría vacío al llegar a los controladores.

### 3.2 Capa de rutas

`server/src/routes/task.routes.js` es un `express.Router()` montado en `/api/v1/tasks`. Su única responsabilidad es declarar el mapeo verbo HTTP → función controladora:

```
GET    /          →  getAllTasks
GET    /:id       →  getTask
POST   /          →  createTask
PUT    /:id       →  updateTask
DELETE /:id       →  deleteTask
```

El Router actúa como punto de extensibilidad: añadir autenticación, rate-limiting o versionado solo requiere insertar middlewares en esta capa sin tocar los controladores.

### 3.3 Capa de controladores

`server/src/controllers/task.controller.js` es responsable del **protocolo HTTP**:

- Extrae parámetros de `req.params`, `req.query` y `req.body`.
- Valida tipos y presencia de campos obligatorios (devuelve `400` si fallan).
- Llama al servicio correspondiente con datos ya validados.
- Traduce el valor de retorno del servicio a una respuesta HTTP con el código de estado semántico correcto (`200`, `201`, `204`, `404`, `500`).
- Captura excepciones del servicio con `try/catch` e identifica el error para seleccionar el código HTTP apropiado.

Los controladores **no** contienen lógica de negocio. Si la regla "una tarea no puede tener título vacío" cambia, solo se modifica el servicio.

### 3.4 Capa de servicios

`server/src/services/task.service.js` es responsable de la **lógica de negocio y el almacenamiento**:

- Mantiene el estado en dos variables de módulo: `tasks` (array) y `nextId` (contador autoincremental).
- Expone un objeto con métodos síncronos que actúan sobre esas variables.
- Lanza `Error('NOT_FOUND')` cuando una operación referencia un ID inexistente. El controlador intercepta ese error y lo traduce a HTTP 404.

> El almacenamiento es **en memoria**: los datos se pierden al reiniciar el proceso. Para producción habría que sustituir este módulo por una capa de acceso a base de datos, sin necesidad de modificar controladores ni rutas.

### 3.5 Señales del proceso y graceful shutdown

El entry point registra tres manejadores de señal/evento:

| Evento | Comportamiento |
|---|---|
| `uncaughtException` | Registra timestamp, mensaje y stack trace completo, luego termina el proceso con código 1 para evitar un estado corrupto. |
| `unhandledRejection` | Ídem para promesas rechazadas sin `.catch()`. Garantiza que los errores async nunca pasen silenciosamente. |
| `SIGTERM` | Llama a `server.close()` para dejar de aceptar nuevas conexiones y esperar a que las activas terminen antes de salir con código 0. Es el mecanismo estándar de parada limpia en contenedores y plataformas de despliegue. |

---

## 4. Frontend — SPA Vanilla JS

El frontend es un **módulo ES** (`<script type="module">`). La ausencia de bundler es deliberada para maximizar la legibilidad del código fuente.

### 4.1 Cliente HTTP (`src/api/client.js`)

Encapsula todas las llamadas de red. El resto de la aplicación nunca llama a `fetch()` directamente.

#### Función `request(path, options)`

Primitiva interna que wrappea `fetch`. Responsabilidades:

1. Construye la URL completa concatenando la base URL (configurable vía `globalThis.TASKFLOW_API_BASE_URL`) con el `path` relativo.
2. Inyecta la cabecera `Content-Type: application/json` en todas las peticiones.
3. Captura errores de red (`fetch` lanza si no hay conectividad) y los convierte en objetos `Error` con `status = 0` para que la capa de UI pueda distinguirlos de los errores HTTP.
4. Para respuestas `204 No Content`, devuelve `null` sin intentar parsear.
5. Para respuestas con `!response.ok`, extrae el mensaje del cuerpo JSON y lanza un `Error` enriquecido con `status` y `details`.

#### Funciones de normalización

| Función | Dirección | Propósito |
|---|---|---|
| `normalizeTaskFromApi(task)` | API → frontend | Convierte `status: "pending"/"completed"` a `completed: boolean`; garantiza que `tag` sea siempre un string no vacío. |
| `normalizeTaskToApi(taskData)` | frontend → API | Convierte `completed: boolean` a `status: "pending"/"completed"`; serializa solo los campos que la API espera. |

Este antipatrón de datos disociados evita que un cambio en la representación interna de la API rompa la UI (y viceversa).

#### Métodos públicos del `apiClient`

| Método | Verbo | Endpoint |
|---|---|---|
| `getTasks()` | GET | `/tasks` |
| `createTask(data)` | POST | `/tasks` |
| `updateTask(id, data)` | PUT | `/tasks/:id` |
| `deleteTask(id)` | DELETE | `/tasks/:id` |

### 4.2 Gestión de estado de red

`app.js` mantiene dos variables de módulo para el estado de red:

```js
let activeRequests = 0;          // Contador de peticiones en vuelo
let networkState = {             // Estado actual para la UI
    status: "idle",              // "idle" | "loading" | "success" | "error"
    message: ""
};
```

El ciclo de vida de una operación de red sigue siempre el mismo patrón:

```
startNetworkRequest(mensaje)
        │
        ▼
   await apiClient.*()
        │
   ┌────┴────┐
  OK       Error
   │           │
   ▼           ▼
finishNe-  failNetwork-
tworkRequ  Request(err,
est()      fallback)
```

- `startNetworkRequest` incrementa `activeRequests` y fija `status = "loading"`.
- `finishNetworkRequest` decrementa `activeRequests`; cuando llega a 0 fija `status = "success"`.
- `failNetworkRequest` decrementa `activeRequests` y fija `status = "error"` con un mensaje diferenciado según el código HTTP (4xx vs 5xx vs error de red).

Después de cada transición se llama a `syncNetworkUi()`, que:
1. Actualiza el banner de estado en la barra de búsqueda (`renderNetworkFeedback`).
2. Vuelve a renderizar la lista (para mostrar el placeholder de carga o error si no hay tareas).
3. Deshabilita o habilita los controles interactivos con `updateInteractiveControls`.

### 4.3 Módulos lógicos de `app.js`

| Sección | Funciones principales | Responsabilidad |
|---|---|---|
| Estado global | Variables de módulo | `tasks[]`, filtros, orden, estado de edición, estado de red |
| Utilidades DOM | `getElement`, `addListenerIfExists` | Abstracción mínima sobre `document.getElementById` |
| Feedback de red | `renderNetworkFeedback`, `updateInteractiveControls`, `syncNetworkUi` | Actualización visual del estado de carga/error |
| Sincronización API | `loadTasks`, `addTask`, `deleteTask`, `toggleTaskCompletion`, `submitEditTaskForm`, `markAllTasksComplete`, `deleteAllCompletedTasks` | Operaciones CRUD asíncronas con manejo de errores |
| Validación | `validateTaskForm` | Reglas de negocio del lado cliente antes de enviar a la API |
| Categorías | `addCategoryIfNew`, `renderCategoryQuickPicker`, `setupCategoryQuickPicker`, `syncCategoriesFromTasks` | Derivación y renderizado de categorías desde las tareas cargadas |
| Filtros y búsqueda | `getFilteredTasks`, `setFilter`, `updateSearch`, `sortTasksByMode` | Filtrado y ordenación en memoria sobre el array local |
| Renderizado | `renderTasks`, `renderTaskItem`, `fillTaskData`, `renderHighlightedText` | Construcción del DOM desde el `<template>` HTML |
| Dialogs | `openEditTaskDialog`, `closeEditTaskDialog`, `showStyledConfirm` | Gestión de `<dialog>` nativos |
| Inicialización | `DOMContentLoaded` | Secuencia de arranque: carga API → configura listeners |

---

## 5. Modelos de datos

### Tarea — representación interna del frontend

```js
{
  id:          number,          // Identificador numérico autoincremental
  title:       string,          // Máx. 80 caracteres, obligatorio
  description: string,          // Máx. 300 caracteres, opcional
  tag:         string,          // Categoría libre, obligatoria
  createdAt:   string,          // ISO 8601, asignado por el servidor
  updatedAt:   string | null,   // ISO 8601 o null si no fue editada
  completed:   boolean          // true = completada, false = pendiente
}
```

### Tarea — representación de la API (JSON)

```json
{
  "id":          1,
  "title":       "Estudiar Express",
  "description": "Middlewares y rutas",
  "tag":         "Bootcamp",
  "status":      "pending",
  "createdAt":   "2026-04-07T10:30:00.000Z",
  "updatedAt":   null
}
```

La diferencia clave entre ambas representaciones es el campo `status` (API) frente a `completed` (frontend). La función `normalizeTaskFromApi` realiza la traducción en tiempo de recepción.

---

## 6. API REST — referencia completa

**Base URL:** `http://localhost:3000/api/v1`

Todas las peticiones y respuestas usan `Content-Type: application/json`.

---

### `GET /health`

Verifica que el servidor está en funcionamiento.

**Respuesta `200 OK`**
```json
{
  "status": "OK",
  "message": "Servidor funcionando correctamente"
}
```

**Ejemplo con curl:**
```bash
curl http://localhost:3000/api/v1/health
```

---

### `GET /tasks`

Devuelve el array completo de tareas almacenadas en memoria.

**Respuesta `200 OK`**
```json
[
  {
    "id": 1,
    "title": "Revisar PR",
    "description": "Revisar el pull request de main",
    "tag": "Trabajo",
    "status": "pending",
    "createdAt": "2026-04-07T09:00:00.000Z",
    "updatedAt": null
  }
]
```

Si no hay tareas devuelve `[]`.

**Ejemplo con curl:**
```bash
curl http://localhost:3000/api/v1/tasks
```

**Ejemplo con fetch:**
```js
const response = await fetch("http://localhost:3000/api/v1/tasks");
const tasks = await response.json();
```

---

### `GET /tasks/:id`

Devuelve una tarea por su identificador numérico.

**Parámetros de ruta**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `id` | string | Identificador de la tarea |

**Respuesta `200 OK`**
```json
{
  "id": 1,
  "title": "Revisar PR",
  "description": "Revisar el pull request de main",
  "tag": "Trabajo",
  "status": "pending",
  "createdAt": "2026-04-07T09:00:00.000Z",
  "updatedAt": null
}
```

**Respuesta `404 Not Found`**
```json
{ "error": "Tarea no encontrada" }
```

**Ejemplo con curl:**
```bash
curl http://localhost:3000/api/v1/tasks/1
```

---

### `POST /tasks`

Crea una nueva tarea. Asigna `id`, `createdAt` y `status` por defecto si no se proporcionan.

**Cuerpo de la petición**

| Campo | Tipo | Obligatorio | Restricciones |
|---|---|---|---|
| `title` | string | Sí | No vacío |
| `description` | string | No | — |
| `tag` | string | No | — |
| `status` | string | No | `"pending"` o `"completed"` |

**Respuesta `201 Created`**
```json
{
  "id": 2,
  "title": "Escribir tests",
  "description": "Cubrir los controladores",
  "tag": "Bootcamp",
  "status": "pending",
  "createdAt": "2026-04-07T10:15:00.000Z",
  "updatedAt": null
}
```

**Respuesta `400 Bad Request`** (título ausente o vacío)
```json
{ "error": "Hace falta el título" }
```

**Ejemplo con curl:**
```bash
curl -X POST http://localhost:3000/api/v1/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Escribir tests",
    "description": "Cubrir los controladores",
    "tag": "Bootcamp"
  }'
```

**Ejemplo con fetch:**
```js
const response = await fetch("http://localhost:3000/api/v1/tasks", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    title: "Escribir tests",
    description: "Cubrir los controladores",
    tag: "Bootcamp"
  })
});
const newTask = await response.json();
```

---

### `PUT /tasks/:id`

Actualiza una tarea existente. Solo se modifican los campos presentes en el cuerpo; los ausentes quedan inalterados. Actualiza `updatedAt` automáticamente.

**Parámetros de ruta**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `id` | string | Identificador de la tarea |

**Cuerpo de la petición** (todos los campos son opcionales)

| Campo | Tipo | Restricciones |
|---|---|---|
| `title` | string | — |
| `description` | string | — |
| `tag` | string | — |
| `status` | string | `"pending"` o `"completed"` |

**Respuesta `200 OK`**
```json
{
  "id": 2,
  "title": "Escribir tests",
  "description": "Cubrir los controladores",
  "tag": "Bootcamp",
  "status": "completed",
  "createdAt": "2026-04-07T10:15:00.000Z",
  "updatedAt": "2026-04-07T11:00:00.000Z"
}
```

**Respuesta `404 Not Found`**
```json
{ "error": "Tarea no encontrada" }
```

**Ejemplo con curl — marcar como completada:**
```bash
curl -X PUT http://localhost:3000/api/v1/tasks/2 \
  -H "Content-Type: application/json" \
  -d '{ "status": "completed" }'
```

**Ejemplo con curl — editar título y categoría:**
```bash
curl -X PUT http://localhost:3000/api/v1/tasks/2 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Escribir tests unitarios",
    "tag": "QA"
  }'
```

**Ejemplo con fetch:**
```js
const response = await fetch("http://localhost:3000/api/v1/tasks/2", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ status: "completed" })
});
const updatedTask = await response.json();
```

---

### `DELETE /tasks/:id`

Elimina permanentemente una tarea del almacenamiento en memoria.

**Parámetros de ruta**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `id` | string | Identificador de la tarea |

**Respuesta `204 No Content`** — cuerpo vacío.

**Respuesta `404 Not Found`**
```json
{ "error": "Tarea no encontrada" }
```

**Ejemplo con curl:**
```bash
curl -X DELETE http://localhost:3000/api/v1/tasks/2
```

**Ejemplo con fetch:**
```js
const response = await fetch("http://localhost:3000/api/v1/tasks/2", {
  method: "DELETE"
});
// response.status === 204, sin cuerpo
```

---

### Tabla resumen de la API

| Método | Endpoint | Descripción | Status OK | Status error |
|---|---|---|---|---|
| GET | `/api/v1/health` | Estado del servidor | 200 | — |
| GET | `/api/v1/tasks` | Listar todas las tareas | 200 | 500 |
| GET | `/api/v1/tasks/:id` | Obtener una tarea | 200 | 404 / 500 |
| POST | `/api/v1/tasks` | Crear una tarea | 201 | 400 / 500 |
| PUT | `/api/v1/tasks/:id` | Actualizar una tarea | 200 | 400 / 404 / 500 |
| DELETE | `/api/v1/tasks/:id` | Eliminar una tarea | 204 | 404 / 500 |

---