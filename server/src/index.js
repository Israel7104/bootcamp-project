import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import taskRoutes from './routes/task.routes.js';

// Cargar variables de entorno
dotenv.config();

// Crear instancia de express
const app = express();
const isVercelEnvironment = process.env.VERCEL === '1';

// Configuración del puerto
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging simple
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// Rutas
app.use('/api/v1/tasks', taskRoutes);

// Ruta de salud (health check)
app.get('/api/v1/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Servidor funcionando correctamente' });
});

// Ruta raíz
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Bienvenido a la API de Tareas', version: '1.0.0' });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Mapeo semántico de errores: Traduce mensajes de error a códigos HTTP
const errorStatusMap = {
    'NOT_FOUND': 404,
    'INVALID_ID': 400,
    'VALIDATION_ERROR': 400,
    'UNAUTHORIZED': 401,
    'FORBIDDEN': 403,
    'DUPLICATE_ENTRY': 409,
    'CONFLICT': 409,
};

// Helper para determinar el código de estado HTTP basado en el error
const getHttpStatus = (err) => {
    // Si ya tiene un statusCode definido, úsalo
    if (err.statusCode) return err.statusCode;
    if (err.status) return err.status;
    
    // Evalúa el mensaje de error para mapeo semántico
    const errorMessage = err.message || '';
    for (const [key, statusCode] of Object.entries(errorStatusMap)) {
        if (errorMessage.includes(key) || errorMessage === key) {
            return statusCode;
        }
    }
    
    // Evalúa el nombre del error
    if (err.name === 'ValidationError') return 400;
    if (err.name === 'UnauthorizedError') return 401;
    if (err.name === 'SyntaxError') return 400;
    
    // Por defecto, error interno del servidor
    return 500;
};

// Helper para generar mensaje seguro (sin detalles sensibles)
const getSafeErrorMessage = (statusCode, isDevelopment) => {
    const safeMessages = {
        400: 'Solicitud inválida',
        401: 'No autorizado',
        403: 'Acceso prohibido',
        404: 'Recurso no encontrado',
        409: 'Conflicto en los datos',
        500: 'Error interno del servidor'
    };
    return safeMessages[statusCode] || 'Error del servidor';
};

// Middleware de manejo de errores global (4 parámetros)
app.use((err, req, res, next) => {
    // Si la respuesta ya fue enviada, delega al manejador por defecto de Express
    if (res.headersSent) {
        return next(err);
    }

    // Mapeo semántico mínimo: errores de cliente conocidos
    const errorMessage = (err?.message || '').toUpperCase();
    if (errorMessage.includes('NOT_FOUND')) {
        return res.status(404).json({ error: 'Recurso no encontrado' });
    }

    // Fallo no controlado: registrar traza completa y responder genérico
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
});

if (!isVercelEnvironment) {
    // Iniciar servidor local
    const server = app.listen(PORT, () => {
        console.log(`\n🚀 Servidor ejecutándose en http://localhost:${PORT}`);
        console.log(`📝 API de Tareas disponible en http://localhost:${PORT}/api/v1/tasks\n`);
    });

    // Manejo de excepciones síncronas no capturadas
    process.on('uncaughtException', (err) => {
        const timestamp = new Date().toISOString();
        console.error(`\n[${timestamp}] 🔴 EXCEPCIÓN NO CAPTURADA (síncronamente):`);
        console.error(`  ${err.message}`);
        console.error(`  Stack trace:\n${err.stack}\n`);
        process.exit(1);
    });

    // Manejo de rechazos de promesas no manejados (async)
    process.on('unhandledRejection', (reason, promise) => {
        const timestamp = new Date().toISOString();
        console.error(`\n[${timestamp}] 🔴 RECHAZO DE PROMESA NO MANEJADO:`);
        console.error(`  Promesa: ${promise}`);
        console.error(`  Razón: ${reason}`);
        if (reason instanceof Error) {
            console.error(`  Stack trace:\n${reason.stack}\n`);
        }
        process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('\n⛔ SIGTERM recibido. Cerrando servidor...');
        server.close(() => {
            console.log('✅ Servidor cerrado correctamente\n');
            process.exit(0);
        });
    });
}

export default app;
