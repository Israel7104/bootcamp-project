# Cursor Workflow


## Atajos de teclado mas usados
Ctrl + k
Me permite usar el chat para las lineas de codigo que tengo seleccionadas

Ctrl + L
Abre el chat para preguntarle cosas

Tab
Sirve para aceptar los cambios que me hace la IA

Esc
Sirve para negar los cambios de la IA

Ctrl + R
Regenera la respuesta que te de la IA

Ctrl + Shift + I
Usa composer

## Mejoras de codigo
Me agrego una sección en la que validaba si mi array era realmente un array para reducir posibles bugs

Cambio una frase del ingles al español

## Configuracion MCP filesystem (solo este proyecto)
Para que Cursor tenga acceso al filesystem mediante MCP *solo dentro de este repo*, cree el archivo `./.cursor/mcp.json` en la raiz del proyecto.

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/home/aster/Documentos/bootcamp-project"
      ]
    }
  }
}
```

Despues de crear el archivo, reinicio Cursor para que cargue el nuevo MCP.

## Consultas que hice con el servidor MCP de eToro
Para practicar con los servidores MCP, estuve usando el servidor de documentación de eToro (`plugin-etoro-etoro-api-docs`) y su herramienta `search_e_toro_api_docs`.

Hice al menos cinco consultas distintas:

- Para entender como obtener precios y ordenes de mercado, busque `BTC/USD price endpoint` y me devolvió varias páginas sobre endpoints de órdenes de mercado (abrir y cerrar posiciones por importe o por unidades).
- Para ver bien la autenticacion, busque `authentication headers Authorization x-api-key x-user-key` y vi que siempre tengo que enviar `x-api-key` y `x-user-key` en las cabeceras, además de otros detalles de auth.
- Para entender los calculos de la cuenta, busque `portfolio balances and equity calculation` y revise las guías de cómo calcular equity, total invertido y profit/loss a partir de los endpoints de PnL y portfolio.
- Para saber cómo abrir una operacion de cripto por API, busque `place market order for crypto` y vi los endpoints REST que permiten crear órdenes de mercado y market-if-touched tanto en real como en demo.
- Para conocer los limites de uso, busque `rate limits and throttling rules` y lei la sección de *Rate Limits* con las reglas de peticiones máximas y recomendaciones para no pasarme de los límites.

Los MCP son utiles para hablar con API de formas controladas