import express from 'express';
import { handleSendEmail } from '../controllers/emailToolController.js';

const router = express.Router();

// Esta será nuestra URL final: /api/tools/send-email
router.post('/send-email', handleSendEmail);

// (Aquí añadiremos futuras tools, ej. router.post('/schedule-calendar', ...))

export default router;