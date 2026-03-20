# TaskFlow Mobile - Proyecto de Bootcamp

Una aplicación web diseñada para la gestión eficiente de tareas. 

Con esta herramienta puedes añadir tareas, visualizarlas, marcarlas como completadas, eliminarlas y realizar un seguimiento de tus estadísticas de productividad.

## Página Principal

![Interfaz de la página principal de TaskFlow que muestra la barra lateral de navegación izquierda con menús para Todas las tareas, Importantes, Estadísticas y Categorías. El área principal muestra el campo de creación de tareas y la Tarea 1 expandida con el indicador de estado de finalización.](docs/design/home.png)

La página principal muestra todas tus tareas en una ubicación central. La barra lateral izquierda proporciona una navegación rápida a diferentes vistas, incluyendo **Todas las tareas**, **Importantes**, **Estadísticas** y **Categorías**. Cada tarea muestra su estado actual con indicadores visuales de finalización. Puedes expandir cualquier tarea para ver más detalles y gestionarla.

## Añadir Tarea

![Formulario de añadir tarea de TaskFlow que muestra el campo de entrada con descripción y opciones de selección de categorías en el menú desplegable.](docs/design/add_task.png)

Añadir una nueva tarea es simple e intuitivo. Ingresa el nombre de la tarea en el campo de entrada, añade una descripción detallada si es necesario y selecciona una categoría del menú desplegable. Este flujo de trabajo mantiene tus tareas organizadas y te ayuda a categorizarlas para una mejor gestión.

## ⚙️ Funcionalidades Principales

### Añadir tareas
Para añadir una tarea, debes escribir un título en el cuadro de **Tarea**, una descripción en el cuadro de **Descripción**, seleccionar una categoría en el cuadro de **Añadir Categoría** y finalmente presionar el botón **Añadir tarea**.

### Completar tareas
Existen dos formas de marcar las tareas como completadas:
1. Presionando el cuadrado izquierdo que se encuentra en cada tarea.
2. Presionando el botón **Marcar todas como completadas**.

### Eliminar tareas
Puedes eliminar tareas de forma individual o utilizar el botón de limpieza para borrar las tareas que ya han sido finalizadas.

### Seleccionar categoría
Utiliza el selector para organizar tus tareas por tipo (Trabajo, Personal, Compras), lo que facilita la segmentación de tus responsabilidades.

### Editar título
Permite modificar el nombre de tareas existentes para mantener la información actualizada.

### Seleccionar filtros
Filtra rápidamente tu lista para ver solo las tareas **Pendientes** o las **Completadas**, ayudándote a enfocarte en lo que falta por hacer.

### Buscar tareas
Utiliza la barra de búsqueda para localizar tareas específicas por su nombre en tiempo real.

### Modo Oscuro
Cambia entre el tema claro y oscuro para mejorar la visibilidad y reducir la fatiga visual según tu preferencia o la configuración de tu sistema.

## Pruebas

### Lista vacía
![Página principal de TaskFlow con una lista vacía](docs/testing/empty_list_test.png)
Cuando la lista está vacía, verás un mensaje indicando que no hay tareas disponibles.

### Añadir una tarea sin título
![Mensaje de TaskFlow que muestra un error sobre el título vacío](docs/testing/empty_title_test.png)
Al intentar añadir una tarea sin título, aparecerá un error indicando que este campo es obligatorio.

### Añadir una tarea con título largo
![Página principal de TaskFlow con una tarea de título largo](docs/testing/long_title_test.png)
Actualmente es posible añadir títulos largos; estamos trabajando para optimizar el ajuste de texto en futuras versiones.

### Marcar varias tareas como completadas
![Página principal de TaskFlow con varias tareas completadas](docs/testing/multiple_completed_test.png)
Puedes seleccionar todas las tareas para marcarlas como completadas simultáneamente o hacerlo una por una.

### Eliminar varias tareas
![Mensaje de TaskFlow preguntando si realmente quieres eliminar las tareas seleccionadas](docs/testing/multiple_deleted_test.png)
![Página principal de TaskFlow sin las tareas eliminadas](docs/testing/multiple_deleted_test2.png)
Al presionar el botón de eliminar, aparecerá un mensaje de confirmación para evitar borrados accidentales.

### Recargar página
La aplicación utiliza `localStorage`, por lo que tus tareas y preferencias (como el Modo Oscuro) se mantendrán guardadas incluso si cierras el navegador o recargas la página.