# Documentación del Backend API

Este documento reúne la información técnica del backend que estaba en el `README.md`.
Contiene detalles de la API, configuración, rutas principales y comandos de ejecución.

## Descripción general

El backend está construido con Node.js y Express, y expone una API REST para gestionar las tareas de la aplicación.
El frontend consume estas rutas para crear, leer, actualizar y eliminar tareas.

## Instalación y ejecución

1. Instala las dependencias:
   ```bash
   npm install
   ```
2. Ejecuta el servidor en modo de desarrollo:
   ```bash
   npm run dev
   ```
3. Para construir o ejecutar en producción, usa el script correspondiente si está definido en `package.json`.

## Configuración del entorno

El backend puede requerir variables de entorno para la configuración de la base de datos, puerto y seguridad.
Coloca estas variables en un archivo `.env` en la raíz del proyecto si se usa `dotenv`.

Ejemplo de variables de entorno comunes:

```env
PORT=3000
DATABASE_URL=...
```

## Rutas principales de la API

Las rutas pueden variar según la implementación, pero generalmente incluyen los siguientes endpoints:

- `GET /api/tasks` - Obtener todas las tareas.
- `GET /api/tasks/:id` - Obtener una tarea específica.
- `POST /api/tasks` - Crear una nueva tarea.
- `PUT /api/tasks/:id` - Actualizar una tarea existente.
- `DELETE /api/tasks/:id` - Eliminar una tarea.

Si el proyecto incluye autenticación, también puede tener:

- `POST /api/auth/login` - Iniciar sesión.
- `POST /api/auth/register` - Registrar un nuevo usuario.

## Estructura sugerida del backend

El backend suele organizarse en carpetas como:

- `routes/` o `routers/` para definir las rutas.
- `controllers/` para la lógica de los endpoints.
- `models/` para los esquemas de datos o la capa de acceso a la base de datos.
- `middleware/` para manejo de autenticación, validación y errores.

## Consideraciones técnicas

- API REST con JSON como formato de intercambio.
- Manejo de errores desde el backend con respuestas HTTP adecuadas.
- Uso de CORS para permitir peticiones desde el frontend.
- Validación de datos de entrada en los endpoints.

## Referencias

Revisa `package.json` para ver las dependencias específicas y los scripts disponibles.
# Herramientas del ecosistema backend y APIs REST

Referencia técnica sobre cuatro herramientas que aparecen habitualmente en proyectos con APIs REST: qué son, qué problema resuelven y en qué contextos se usan.

---

## Axios

### Qué es

Axios es una librería JavaScript para realizar peticiones HTTP desde el navegador y desde Node.js. Está basada en **Promesas** y envuelve la API `XMLHttpRequest` en el navegador y el módulo `http`/`https` nativo de Node en el servidor.

### Por qué se usa

La alternativa nativa en el navegador moderno es la **Fetch API**, que TaskFlow sí utiliza. Las razones por las que muchos equipos eligen Axios sobre `fetch` son:

| Característica | `fetch` nativo | Axios |
|---|---|---|
| Parseo automático de JSON | No — hay que llamar `.json()` manualmente | Sí — el cuerpo ya llega como objeto |
| Tratamiento de errores HTTP | Solo lanza en errores de red; un 404 no lanza | Lanza automáticamente para cualquier código 4xx/5xx |
| Interceptores | No incorporados | `axios.interceptors.request/response` permiten modificar todas las peticiones o respuestas de forma centralizada |
| Cancelación de peticiones | `AbortController` (nativo pero verboso) | `CancelToken` o `AbortController` con integración directa |
| Soporte en Node.js | Requiere `node-fetch` o Node ≥ 18 | Funciona en cualquier versión de Node |
| Progreso de subida | No | `onUploadProgress` / `onDownloadProgress` |
| Transformadores | No | `transformRequest` / `transformResponse` |

### Caso de uso típico

```js
// Instalación
// npm install axios

import axios from "axios";

// Instancia reutilizable con configuración base
const api = axios.create({
  baseURL: "http://localhost:3000/api/v1",
  headers: { "Content-Type": "application/json" },
  timeout: 5000
});

// Interceptor de respuesta: maneja errores globalmente
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Redirigir a login...
    }
    return Promise.reject(error);
  }
);

// Petición GET
const { data: tasks } = await api.get("/tasks");

// Petición POST
const { data: newTask } = await api.post("/tasks", {
  title: "Revisar PR",
  tag: "Trabajo"
});
```

### Cuándo elegir Axios sobre fetch

- En proyectos con muchas peticiones que requieren **lógica compartida** (manejo de tokens, logging, reintentos) — los interceptores son más ergonómicos que wrappers manuales sobre `fetch`.
- En proyectos que deben funcionar tanto en Node.js como en el navegador con la misma base de código.
- En equipos con soporte a navegadores antiguos sin Fetch API nativa.

---

## Postman

### Qué es

Postman es una plataforma colaborativa para diseñar, testear y documentar APIs. Su componente más conocido es el **cliente HTTP gráfico** que permite componer y enviar peticiones HTTP de cualquier método sin escribir código.

### Por qué se usa

Durante el desarrollo de una API REST, Postman resuelve varios problemas:

**1. Prueba manual durante el desarrollo**  
Antes de tener un frontend, permite verificar que un endpoint devuelve exactamente lo que debe: código de estado, cabeceras, estructura del cuerpo JSON. Es el equivalente a `curl` pero con interfaz gráfica, historial y guardado de peticiones.

**2. Colecciones y entornos**  
Las peticiones se agrupan en _colecciones_ que pueden compartirse con el equipo. Los _entornos_ permiten cambiar la `base_url` entre `localhost`, staging y producción con un solo selector.

**3. Tests automatizados en el cliente**  
Cada petición puede incluir scripts de test en JavaScript que se ejecutan tras recibir la respuesta:

```js
// Script de test de Postman para POST /tasks
pm.test("Devuelve 201", () => {
  pm.response.to.have.status(201);
});

pm.test("La respuesta tiene id", () => {
  const body = pm.response.json();
  pm.expect(body).to.have.property("id");
  pm.expect(body.id).to.be.a("number");
});

// Guarda el id para usarlo en peticiones posteriores
pm.environment.set("taskId", pm.response.json().id);
```

El runner de colecciones puede ejecutar todas las peticiones en secuencia, lo que permite simular flujos completos (crear → actualizar → eliminar).

**4. Generación de documentación**  
Postman genera automáticamente una página de documentación pública o privada a partir de las colecciones, con ejemplos de petición y respuesta.

**5. Mock servers**  
Permite levantar un servidor mock basado en ejemplos guardados, de forma que el equipo de frontend puede trabajar mientras el backend todavía no está implementado.

### En este proyecto

Las capturas en `docs/postman/` documentan las pruebas realizadas sobre cada endpoint de la API: casos de éxito, validaciones de entrada incorrecta y errores 404.

---

## Sentry

### Qué es

Sentry es una plataforma de **monitorización de errores en tiempo real** (_error tracking_). Cuando una aplicación lanza una excepción no capturada o registra un error, el SDK de Sentry lo intercepta y lo envía al panel de Sentry con contexto completo: stack trace, versión del código, sistema operativo, navegador, usuario afectado, y variables de entorno en el momento del fallo.

### Por qué se usa

En producción, los errores no aparecen en la consola del desarrollador: ocurren en dispositivos y contextos desconocidos. Sentry resuelve tres necesidades:

**1. Visibilidad de errores reales**  
Sin Sentry, un error que afecta al 2% de los usuarios puede pasar semanas sin ser detectado. Sentry agrupa errores similares, muestra su frecuencia y lista los usuarios afectados.

**2. Contexto rico para reproducir el error**  
Cada evento incluye el stack trace completo con números de línea (si se proporcionan source maps), el breadcrumb trail (secuencia de acciones del usuario antes del error), y los valores exactos de las variables locales en cada frame del stack.

**3. Alertas proactivas**  
Se configura para enviar notificaciones (email, Slack, PagerDuty…) cuando un nuevo tipo de error aparece o cuando un error existente supera un umbral de frecuencia.

### Integración típica en Node.js + Express

```js
// npm install @sentry/node

import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.2  // Captura el 20% de las transacciones para performance
});

// En Express, antes de las rutas:
app.use(Sentry.Handlers.requestHandler());

// Las rutas normales...
app.use("/api/v1/tasks", taskRoutes);

// Después de las rutas y antes del error handler propio:
app.use(Sentry.Handlers.errorHandler());
```

### Integración típica en el frontend (JavaScript)

```js
// npm install @sentry/browser

import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  release: "taskflow@1.0.0",
  environment: "production"
});

// A partir de aquí, cualquier excepción no capturada se envía automáticamente.
// Para capturar manualmente en un catch:
try {
  await apiClient.createTask(data);
} catch (error) {
  Sentry.captureException(error);
  showErrorBanner(error.message);
}
```

### Conceptos clave

| Concepto | Descripción |
|---|---|
| **DSN** (_Data Source Name_) | URL única del proyecto en Sentry. El SDK lo usa para saber a dónde enviar los eventos. |
| **Release** | Versión del código. Permite comparar la tasa de errores antes y después de un despliegue. |
| **Breadcrumbs** | Registro de eventos previos al error (navegación, peticiones XHR, clics) que ayudan a reproducirlo. |
| **Source maps** | Mapas de código minificado → código fuente original. Sin ellos, el stack trace apunta a líneas del bundle, no al código legible. |
| **Performance monitoring** | Además de errores, Sentry puede medir el tiempo de cada endpoint o transacción de usuario. |

---

## Swagger (OpenAPI)

### Qué es

**OpenAPI** es una especificación estándar (mantenida por la _OpenAPI Initiative_) para describir APIs REST mediante un fichero YAML o JSON. **Swagger** es el conjunto de herramientas de código abierto construido alrededor de esa especificación; el más conocido es **Swagger UI**, una interfaz web interactiva generada automáticamente a partir del fichero OpenAPI.

El nombre "Swagger" proviene de la versión anterior a OpenAPI 3.0; hoy los términos se usan de forma intercambiable en la industria.

### Por qué se usa

**1. Documentación siempre actualizada**  
La especificación vive en el mismo repositorio que el código. Si el contrato de un endpoint cambia, se actualiza el fichero OpenAPI y la documentación refleja el cambio al instante, sin páginas de wiki que quedan obsoletas.

**2. Interfaz interactiva de pruebas**  
Swagger UI genera una página HTML en la que cualquier miembro del equipo (o consumidor externo de la API) puede ver todos los endpoints, sus parámetros, cuerpos de petición y respuestas posibles, y ejecutar peticiones reales desde el navegador, sin Postman ni `curl`.

**3. Generación de clientes SDK**  
`openapi-generator` puede leer el fichero de especificación y generar automáticamente un cliente tipado en cualquier lenguaje (TypeScript, Python, Java…), eliminando el trabajo manual de escribir el equivalente a `src/api/client.js`.

**4. Contract-first design**  
Los equipos que trabajan con el enfoque _design-first_ o _contract-first_ definen el fichero OpenAPI antes de escribir ninguna línea de código del servidor. El frontend y el backend acuerdan el contrato, y cada uno lo implementa de forma independiente y en paralelo.

### Ejemplo de especificación OpenAPI 3.0

Así se describiría el endpoint `POST /tasks` de este proyecto:

```yaml
openapi: 3.0.3
info:
  title: TaskFlow API
  version: 1.0.0

paths:
  /api/v1/tasks:
    post:
      summary: Crear una nueva tarea
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - title
              properties:
                title:
                  type: string
                  example: Estudiar Express
                description:
                  type: string
                  example: Middlewares y rutas
                tag:
                  type: string
                  example: Bootcamp
                status:
                  type: string
                  enum: [pending, completed]
                  default: pending
      responses:
        "201":
          description: Tarea creada
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Task"
        "400":
          description: Datos de entrada inválidos
          content:
            application/json:
              example:
                error: Hace falta el título

components:
  schemas:
    Task:
      type: object
      properties:
        id:
          type: integer
          example: 1
        title:
          type: string
        description:
          type: string
        tag:
          type: string
        status:
          type: string
          enum: [pending, completed]
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
          nullable: true
```

### Integración con Express

```js
// npm install swagger-ui-express swagger-jsdoc

import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

const spec = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: { title: "TaskFlow API", version: "1.0.0" }
  },
  apis: ["./src/routes/*.js"]  // Lee anotaciones JSDoc en los ficheros de rutas
});

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(spec));
// → Documentación interactiva en http://localhost:3000/api/docs
```

---

## Comparación rápida

| Herramienta | Capa | Problema que resuelve |
|---|---|---|
| **Axios** | Cliente HTTP | Simplifica y estandariza las peticiones HTTP en el frontend y en Node.js |
| **Postman** | Testing y documentación manual | Prueba y documenta endpoints sin escribir código; colaboración del equipo |
| **Sentry** | Observabilidad en producción | Detecta, agrupa y notifica errores reales con contexto suficiente para reproducirlos |
| **Swagger / OpenAPI** | Documentación y contrato de la API | Define el contrato de la API de forma legible por máquinas; genera UI interactiva y clientes SDK |

Estas cuatro herramientas son complementarias entre sí y no se excluyen. Un proyecto maduro las usa todas: **Swagger** para definir el contrato, **Axios** para consumirlo, **Postman** para probarlo durante el desarrollo, y **Sentry** para monitorizar los errores que escapan a las pruebas en producción.
