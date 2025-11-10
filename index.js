import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import toolRoutes from './src/routes/toolRoutes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 8089;

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta de Health Check
app.get('/api/health', (req, res) => {
  res.status(200).send({ status: 'ok', component: 'tools-api' });
});

// --- Rutas de Tools ---
app.use('/api/tools', toolRoutes);

// Iniciar servidor (ESCUCHANDO EN 0.0.0.0 para DigitalOcean)
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Servidor de Tools escuchando en http://0.0.0.0:${port}`);
});