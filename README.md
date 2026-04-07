# TaskFlow Mobile

Aplicación web de tareas creada como proyecto de bootcamp. El objetivo es ofrecer un flujo simple y personalizable para apuntar, clasificar y completar tareas de forma rápida.

Demo en producción:
https://bootcamp-project-nine.vercel.app/

## Vista General

TaskFlow permite:

- Crear tareas con título, descripción y categoría.
- Editar y eliminar tareas existentes.
- Marcar tareas como completadas de forma individual o masiva.
- Filtrar por estado, categoría y término de búsqueda.
- Ordenar por fecha de creación o alfabéticamente.
- Cambiar dirección de orden ascendente o descendente.
- Ver fechas de creación y edición.
- Usar modo oscuro.
- Sincronizar tareas con la API REST del proyecto.

## Capturas

Página principal:
![Pantalla principal](docs/design/home.png)

Formulario de alta de tarea:
![Formulario de tarea](docs/design/add_task.png)

## Tecnologías

- HTML5
- CSS3 (archivo propio en style.css)
- JavaScript Vanilla (archivo principal app.js)
- Tailwind CSS vía CDN (utilidades de layout/tema)
- API REST con Express para operaciones CRUD

## Ejecución Local

1. Clona el repositorio.
2. Abre la carpeta del proyecto.
3. Inicia la API en `server/` con `npm install` y `npm run dev`.
4. Ejecuta un servidor estático en la raíz del proyecto (por ejemplo con VS Code Live Server).

El frontend no requiere build, pero sí necesita que la API esté disponible en `http://localhost:3000`.

## Estructura del Proyecto

```
.
├── index.html        # Estructura de la app y diálogos
├── style.css         # Estilos y tema claro/oscuro
├── app.js            # Lógica principal del frontend
├── src/api/client.js # Cliente HTTP para la API de tareas
├── README.md
└── docs/
		├── design/
		├── testing/
		└── ai/
```

## Modelo de Datos

Cada tarea sigue esta estructura:

```js
{
	id: number,
	title: string,
	description: string,
	tag: string,
	createdAt: Date | string,
	updatedAt: Date | string | null,
	completed: boolean
}
```

## Funcionalidades Detalladas

### Gestión de tareas
- Alta de tarea con validación.
- Edición mediante diálogo modal.
- Eliminación individual.
- Marcado de completado individual.

### Acciones masivas
- Marcar/desmarcar todas las tareas visibles.
	- Respeta filtros activos: estado, categoría y búsqueda.
- Eliminar todas las tareas completadas con confirmación estilizada.

### Filtros y búsqueda
- Filtro por estado: todas, pendientes, completadas.
- Filtro por categoría desde sidebar.
- Búsqueda por título, descripción o categoría.
- Mensajes de feedback en búsqueda y botón para limpiar texto.
- Resaltado visual de coincidencias.

### Categorías
- Campo de categoría libre con datalist.
- Creación de categorías nuevas al escribir y presionar Enter.
- Selector rápido de categorías (quick picker) en alta y edición.
- Categorías derivadas de las tareas cargadas desde la API.

### Ordenación
- Orden por creación o alfabético.
- Dirección ascendente o descendente.

### Tema y UX
- Modo oscuro con preferencia inicial del sistema.
- Diálogo Acerca de en footer.
- Confirmación personalizada para acciones críticas.

## Ejemplos de Uso

### Ejemplo 1: Crear y organizar una tarea
1. Escribe en Tarea: "Estudiar JavaScript".
2. En Descripción añade: "Repasar funciones y arrays".
3. En Añadir categoría escribe "Bootcamp" y pulsa Enter para crearla.
4. Pulsa Añadir tarea.
Resultado esperado: la tarea aparece en la lista y la categoría Bootcamp queda disponible para futuras tareas.

### Ejemplo 2: Filtrar por categoría y completar solo lo visible
1. Haz clic en la categoría "Bootcamp" en la barra lateral.
2. Pulsa "Marcar todas como completadas".
3. Confirma en el diálogo estilizado.
Resultado esperado: solo cambian de estado las tareas visibles de la categoría seleccionada.

### Ejemplo 3: Buscar una tarea y ver coincidencias resaltadas
1. Escribe "javascript" en el buscador.
2. Observa el contador de resultados y el resaltado en título, descripción y categoría.
3. Pulsa el botón X del buscador para limpiar la búsqueda.
Resultado esperado: la lista se filtra en tiempo real y vuelve al estado normal al limpiar.

### Ejemplo 4: Ordenar tareas
1. Pulsa "Orden: creación" para alternar a "Orden: A-Z".
2. Pulsa "Dirección: Asc" para cambiar a descendente.
Resultado esperado: el listado se reordena sin perder filtros activos.

### Ejemplo 5: Editar y registrar fecha de modificación
1. Pulsa "Editar" en una tarea existente.
2. Cambia el título o descripción y guarda.
Resultado esperado: en la tarjeta aparece "Editada: DD/MM/AAAA" junto a la fecha de creación.

### Ejemplo 6: Eliminar tareas completadas con confirmación
1. Marca algunas tareas como completadas.
2. Pulsa "Eliminar completadas".
3. Confirma en el diálogo.
Resultado esperado: se eliminan las completadas y se actualizan contadores y lista.

## Documentación de Funciones (app.js)

### 1) Utilidades generales

- getElement(id): obtiene un elemento del DOM por id.
- refreshUI(): refresca contadores, categorías, datalist y lista.
- persistAndRefresh(): sincroniza categorías en memoria y refresca UI.
- addListenerIfExists(elementId, eventName, handler): añade listeners de forma segura.

### 2) Comunicación con API

- loadTasks(): carga tareas desde la API y normaliza el estado inicial.
- initializeDefaultState(): reinicia estado en memoria.
- clearAllData(): elimina tareas remotas y reinicia aplicación.
- src/api/client.js: concentra `getTasks`, `createTask`, `updateTask` y `deleteTask`.

### 3) Creación y validación de tareas

- formatTaskDate(dateValue): normaliza una fecha a formato es-ES.
- buildTaskMetaText(task): compone texto Creada/Editada mostrado en tarjeta.
- validateTaskForm(title, description, tag): valida campos y devuelve datos normalizados.
- addTask(title, description, tag): crea una tarea vía API, actualiza estado y re-renderiza.
- clearForm(): limpia formulario de alta.

### 4) Categorías

- addCategoryIfNew(tag): añade categoría si no existe (comparación case-insensitive).
- createCategoryChip(category, input, quickPicker): crea botón rápido de categoría.
- renderCategoryQuickPicker(input, quickPicker): pinta sugerencias filtradas.
- setupCategoryQuickPicker(inputId, quickPickerId): conecta eventos de quick picker.
- updateCategoriesDatalist(): sincroniza opciones del datalist.
- renderSidebarCategories(): renderiza categorías de la barra lateral.
- filterByCategory(category): aplica categoría activa y actualiza estado visual.

### 5) Estado de tareas y edición

- updateCounters(): actualiza contadores de todas/pendientes/completadas.
- deleteTask(task): elimina una tarea individual vía API.
- toggleTaskCompletion(task): alterna estado de completado vía API.
- openEditTaskDialog(task): abre modal de edición con datos precargados.
- submitEditTaskForm(): valida y guarda cambios de edición vía API.
- closeEditTaskDialog(): cierra modal de edición y limpia referencia activa.

### 6) Confirmaciones y acciones masivas

- showStyledConfirm(message): muestra diálogo de confirmación custom y devuelve Promise<boolean>.
- markAllTasksComplete(): marca o desmarca tareas visibles según filtros activos.
- deleteAllCompletedTasks(): elimina todas las tareas completadas tras confirmación.

### 7) Filtros, búsqueda y orden

- getFilteredTasks(): aplica filtros por estado, categoría y búsqueda.
- updateActiveFilter(filterId): marca visualmente el filtro activo.
- setFilter(filter): cambia filtro de estado y re-renderiza.
- updateSearch(term): actualiza término de búsqueda y re-renderiza.
- updateSearchFeedback(resultCount): muestra mensajes y estado del input de búsqueda.
- clearSearch(): limpia búsqueda activa y devuelve el foco al input.
- getTaskCreationTimestamp(task): obtiene timestamp robusto de creación.
- sortTasksByMode(taskList): ordena por modo y dirección seleccionados.
- updateSortButtonLabels(): sincroniza texto de botones de orden.
- toggleSortMode(): alterna entre orden por creación y alfabético.
- toggleSortDirection(): alterna ascendente/descendente.

### 8) Renderizado de tareas

- getEmptyMessage(): devuelve mensaje contextual cuando no hay resultados.
- escapeRegExp(value): escapa texto para usarlo en expresiones regulares.
- renderHighlightedText(element, text, term): renderiza texto con resaltado de búsqueda.
- fillTaskData(taskElement, task): inyecta título, descripción, meta y categoría.
- createTaskActionButton(label, className, onClick): genera botones de acción.
- addTaskEvents(listItem, task): conecta eventos (checkbox) por tarea.
- renderTaskItem(task): construye un item de lista desde template.
- renderTasks(): renderiza la lista final aplicando filtros y orden.

### 9) Inicialización y tema

- setupFilterButtons(): conecta botones de filtro principal.
- initializeDarkMode(): aplica la preferencia del sistema al arrancar.
- updateDarkModeButtonLabel(isDark): actualiza texto del botón de tema.

Eventos principales:

- DOMContentLoaded: carga datos, configura listeners y prepara la interfaz.
- Clic en Acerca de: abre diálogo informativo del proyecto.
- Clic en botón de modo oscuro: alterna tema durante la sesión actual.

## Casos de Prueba Visuales

Lista vacía:
![Lista vacía](docs/testing/empty_list_test.png)

Validación de título vacío:
![Título vacío](docs/testing/empty_title_test.png)

Títulos largos:
![Título largo](docs/testing/long_title_test.png)

Múltiples tareas completadas:
![Múltiples completadas](docs/testing/multiple_completed_test.png)

Confirmación y resultado de borrado múltiple:
![Confirmación borrado](docs/testing/multiple_deleted_test.png)
![Resultado borrado](docs/testing/multiple_deleted_test2.png)

## Sincronización de Datos

La aplicación sincroniza automáticamente con la API:

- Lectura de tareas al iniciar
- Creación, edición y borrado de tareas
- Actualización de estado completada/pendiente

No hay persistencia en el navegador. El estado depende de la API en ejecución y del almacenamiento en memoria del servidor.
