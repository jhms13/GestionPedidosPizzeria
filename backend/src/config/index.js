require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

// Middlewares
app.use(cors()); // Permite que React se conecte
app.use(express.json()); // Permite recibir datos en formato JSON (para el carrito)

// Permite servir archivos estáticos (nuestro bucket local de imágenes)
app.use(express.static(path.join(__dirname, '../../public')));

/**
 * nombre de la funcion: Conexión a PostgreSQL (Instancia de Pool)
 * parametros: Objeto de configuración con credenciales tomadas de process.env
 * retorno: Objeto 'pool' para realizar consultas a la base de datos.
 * funcionalidad: Establece y gestiona un pool de conexiones seguras hacia la base de datos PostgreSQL usando las variables de entorno (.env) para proteger los datos sensibles del servidor.
 */
const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
});

// Prueba de conexion a la DB al iniciar el servidor
pool.connect()
    .then(() => console.log('🔥 Conexión exitosa a PostgreSQL'))
    .catch(err => console.error('Error conectando a la BD', err));


// --- RUTAS DE LA API ---

/**
 * nombre de la funcion: Callback de la ruta GET '/api/productos'
 * parametros: req (Object) - Petición del cliente, res (Object) - Objeto de respuesta de Express.
 * retorno: Promise<void> - Envía una respuesta HTTP en formato JSON.
 * funcionalidad: Ejecuta una consulta SQL relacional combinando la tabla madre 'pizzas' con la tabla hija 'variantes' mediante un LEFT JOIN. Utiliza 'json_agg' para empaquetar las tallas correspondientes dentro de cada pizza y devuelve el catálogo estructurado al frontend.
 */
app.get('/api/productos', async (req, res) => {
    try {
        const query = `
            SELECT 
                p.id_pizza AS id_producto,
                p.nombre,
                p.descripcion,
                p.imagen_url,
                json_agg(
                    json_build_object(
                        'id_variante', v.id_variante,
                        'tamano', v.tamano,
                        'precio', v.precio
                    )
                ) AS variantes
            FROM pizzas p
            LEFT JOIN variantes v ON p.id_pizza = v.id_pizza
            GROUP BY p.id_pizza, p.nombre, p.descripcion, p.imagen_url
            ORDER BY p.id_pizza;
        `;
        const resultado = await pool.query(query);
        
        // Enviamos el paquete listo con la pizza y sus variantes por dentro
        res.json(resultado.rows); 
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener los productos' });
    }
});

/**
 * nombre de la funcion: Callback de la ruta GET '/api/opciones'
 * parametros: req (Object) - Petición del cliente, res (Object) - Objeto de respuesta de Express.
 * retorno: Promise<void> - Envía una respuesta HTTP en formato JSON.
 * funcionalidad: Consulta la tabla 'Opcion_Extra' en PostgreSQL para obtener la lista de todos los ingredientes adicionales o personalizaciones disponibles para el usuario y los envía al cliente.
 */
app.get('/api/opciones', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM Opcion_Extra');
        res.json(resultado.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener las opciones extra' });
    }
});

/**
 * nombre de la funcion: Callback de inicialización del servidor (app.listen)
 * parametros: Ninguno.
 * retorno: void.
 * funcionalidad: Abre el puerto especificado en las variables de entorno (o el 3000 por defecto) para empezar a escuchar peticiones HTTP entrantes, mostrando un mensaje de confirmación en la consola.
 */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});