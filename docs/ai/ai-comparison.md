# AI Comparison

## 📌 Introducción
En este documento voy a comparar diferentes herramientas de inteligencia artificial utilizadas durante el proyecto. Analizaré sus capacidades, ventajas, limitaciones y casos de uso más adecuados.

## 🔍 Herramientas analizadas
- ChatGPT
- Cursor
- Claude

## ⚖️ Criterios de comparación
- Facilidad de uso
- Calidad de las respuestas
- Velocidad
- Integración con el flujo de trabajo
- Soporte para código

## 🧠 Conclusiones
Resumen de qué herramienta funciona mejor según el contexto.



## Comparativa entre ChatGPT y Claude en conceptos tecnicos

API, HTTP/HTTPS y autenticación y autorización. Explicame estos conceptos tecnicos.

Use este prompt en ambas IA y pude sacar en conclusión que Claude me da una información mas detallada y aparte me da ejemplos reales mientras que ChatGPT 
tan solo me da un resumen basico.

## Comparativa en funciones

### Corrección de funciones JavaScript
- Objetivo: Analizar errores de JavaScript
- Procedimiento: Creare tres funciones de JavaScript con errores y se lo enviare a las IA. Creare un chat por cada función
```
function upgradearPI() {
    const PI = 3.14;
    PI = 3.14159; 
}
```
```
function contar() {
    let i = 0;
    while (i < 10) {
        if (i == 5) {
            i = 0; 
        } else {
            i++;
        }
    }
}
```
```
function sumar(a : string, b: number) {
    return a + b;
}
```
- Resultado: 
-- En la primera función ambas IA han encontrado el problema y me han dicho la solución pero solo ChatGPT me ha dado la versión corregida.
-- En la segunda función ambas IA encuentran el problema y me dan soluciones distintas a parte de que me preguntan cual era mi intención.
-- En la tercera función ambas IA me dan 3 opciones para el codigo.
- Conclusión: Para corregir codigo con IA(por lo menos de JavaScript) lo mejor es ChatGPT ya que es mas probable que te de una versión corregida a parte de que ambos explican el problema y la posible solución.

### Creación de funciones con lenguaje humano
- Objetivo: Describir con lenguaje natural tres funciones de JavaScript
- Procedimiento: En chats nuevos pedire que me creen funciones para ver que acaba pasando
- Resultado:
-- En la primera prueba le pedi "Una función para cambiar un texto al pulsar un boton". ChatGPT me creo un archivo HTML con un boton y con un script que cambia el texto solo la primera vez que pulsas el boton mientras que Claude me ha hecho 1 archivo html con estilos y con un script que cambia el texto cada vez que le das al boton a parte de que al acabar de generarmelo me ha abierto una pestañita con la página funcionando. Añado que lo de ChatGPT se completo en un momento y lo de Claude tardo mas.
-- En la segunda prueba pedi "Crea una función para analizar cuantas teclas estoy pulsando al mismo tiempo". ChatGPT me envio directamente las funciones de JavaScript para que las añada a mi proyecto mientras tanto Claude me hizo una miniApp que funcionaba en el chat pero no me envio nada de codigo. Le tuve que pedir que fuese en JavaScript para que me enviase el codigo. Curiosamente aunque hagan lo mismo el codigo es muy distinto. Tambien al probar el codigo el de ChatGPT me viene con los console.log mientras que los de Claude los tuve que agregar yo.
-- En la tercera prueba pedi "Crea una funcion en la que sacando la información nutricional de un producto que estara guardado en una clase quiero que pueda darme los macros que estoy ingiriendo al decirle cuantos gramos consumi". ChatGPT me paso un codigo de TypeScript en el que crea la clase y la función y Claude me crea una aplicación en python con interfaz gráfica que puedo usar en el mismo chat y me pasa el codigo con ejemplos de uso. Esta vez aunque los dos usan lenguajes distintos y uno tiene interfaz lo que es el como funciona el codigo es lo mismo.
- Conclusión: Viendo las pruebas podriamos ver que si quieres crear una app desde cero basandote en una función Claude es de lo mejor que hay pero si quieres agregar funciones a tu aplicación lo ideal es usar ChatGPT. Tambien si estas aprendiendo ChatGPT puede venir mejor ya que crea prints que vienen muy bien para debuggear.