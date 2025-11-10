import nodemailer from 'nodemailer';

// Variable para almacenar el transporter (se inicializa de forma lazy)
let transporter = null;

/**
 * Obtiene o crea el transporter de nodemailer
 */
const getTransporter = () => {
  if (!transporter) {
    // Verificar que las credenciales estén configuradas
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY no está configurada en las variables de entorno');
    }

    console.log('📧 Inicializando transporter de email con SendGrid...');
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.sendgrid.net',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false, 
      auth: {
        user: process.env.EMAIL_USER || 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  }
  return transporter;
};

/**
 * Función de "mail merge"
 */
const renderTemplate = (template, data) => {
  if (!template) return '';
  let rendered = template;
  for (const key in data) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    rendered = rendered.replace(regex, data[key] || '');
  }
  rendered = rendered.replace(/{{\w+}}/g, ''); // Limpiar no encontrados
  return rendered;
};

/**
 * Controlador de Express para manejar la Tool
 */
export const handleSendEmail = async (req, res) => {
  const payload = req.body;
  console.log('[TOOL] 📧 Recibida solicitud de email genérico:', payload);

  // 1. Extraer Configuración (de la UI, via ElevenLabs)
  const {
    to_email,
    cc_email,
    from_email,
    subject_template,
    body_template
  } = payload;

  // 2. Extraer Datos (del LLM)
  const data = payload; 

  // 3. Validación
  if (!to_email || !subject_template || !body_template) {
    console.error('[TOOL] ❌ Faltan parámetros de configuración');
    return res.status(400).send({ 
      success: false, 
      error: 'Configuración de la tool incompleta. Faltan to_email, subject_template, o body_template.' 
    });
  }
  
  if (!process.env.SENDGRID_API_KEY) {
     console.error('[TOOL] ❌ SENDGRID_API_KEY no está configurada');
     return res.status(500).send({ success: false, error: 'Servicio de email no configurado (lado servidor).' });
  }

  // 4. Renderizar Plantillas
  const subject = renderTemplate(subject_template, data);
  const htmlContent = renderTemplate(body_template, data);
  const textContent = htmlContent.replace(/<[^>]*>?/gm, '');

  // 5. Configurar y Enviar Email
  const mailOptions = {
    from: from_email || process.env.EMAIL_FROM,
    to: to_email,
    cc: cc_email || undefined,
    subject: subject,
    html: htmlContent,
    text: textContent,
  };

  try {
    const emailTransporter = getTransporter();
    const info = await emailTransporter.sendMail(mailOptions);
    console.log(`[EMAIL] ✅ Correo enviado exitosamente a ${to_email}: ${info.messageId}`);
    
    // Respuesta para ElevenLabs
    res.status(200).send({ 
      success: true, 
      message: `Email enviado correctamente a ${to_email}.`
    });

  } catch (error) {
    console.error(`[EMAIL] ❌ Error al enviar correo:`, error);
    res.status(500).send({ 
      success: false, 
      error: error.message 
    });
  }
};