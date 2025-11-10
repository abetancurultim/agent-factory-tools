import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Cargar variables de entorno locales (solo para pruebas)
dotenv.config();

// Configurar el transportador de email (SendGrid)
// Esta parte se ejecuta solo cuando la función "despierta"
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.sendgrid.net',
  port: process.env.EMAIL_PORT || 587,
  secure: false, 
  auth: {
    user: process.env.EMAIL_USER || 'apikey',
    pass: process.env.SENDGRID_API_KEY,
  },
});

/**
 * Esta es la Google Cloud Function.
 * Se exporta con un nombre (ej: sendEmailTool) que Google usará.
 * Recibe 'req' y 'res', tal como lo haría Express.
 */
export const sendEmailTool = async (req, res) => {
  // --- 1. Seguridad y Validación ---
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  // (Aquí se podría añadir un chequeo de API Key si quieres proteger la tool)
  // const apiKey = req.headers['x-api-key'];
  // if (apiKey !== process.env.MY_INTERNAL_API_KEY) {
  //   return res.status(401).send('Unauthorized');
  // }

  const clientData = req.body;
  console.log('[TOOL] 📧 Recibida solicitud para enviar datos:', clientData);

  // --- 2. Lógica de la Tool ---
  const {
    nombre,
    telefono,
    necesidadDental,
    // ... otros campos que ElevenLabs/LangGraph envíen
  } = clientData;

  const supervisorEmail = process.env.SUPERVISOR_EMAIL;
  if (!supervisorEmail) {
    console.error('[EMAIL] SUPERVISOR_EMAIL no está configurado');
    return res.status(500).send({ success: false, error: 'Email del supervisor no configurado' });
  }

  const subject = `🦷 Nueva Cita Dental - ${nombre} (${telefono})`;
  
  // (Aquí va la lógica para construir el 'htmlContent' y 'textContent')
  const htmlContent = `
    <h1>Nueva Solicitud de Cita</h1>
    <p><strong>Nombre:</strong> ${nombre || 'No proporcionado'}</p>
    <p><strong>Teléfono:</strong> ${telefono || 'No proporcionado'}</p>
    <p><strong>Necesidad:</strong> ${necesidadDental || 'No especificada'}</p>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: supervisorEmail,
    cc: process.env.EMAIL_CC || undefined,
    subject: subject,
    html: htmlContent,
  };

  // --- 3. Ejecución y Respuesta ---
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] ✅ Correo enviado exitosamente: ${info.messageId}`);
    
    // Esta es la respuesta que recibirá ElevenLabs o LangGraph
    res.status(200).send({ 
      success: true, 
      message: 'Los datos del cliente han sido enviados correctamente.' 
    });

  } catch (error) {
    console.error(`[EMAIL] ❌ Error al enviar correo:`, error);
    res.status(500).send({ 
      success: false, 
      error: error.message 
    });
  }
};