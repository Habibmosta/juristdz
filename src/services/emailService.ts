// Service d'envoi d'emails pour JuristDZ
// Utilise Supabase Edge Functions ou un service tiers (SendGrid, Mailgun, etc.)

interface EmailData {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Blob;
  }>;
}

export const sendInvoiceEmail = async (
  recipientEmail: string,
  recipientName: string,
  invoiceNumber: string,
  invoiceTotal: number,
  pdfBlob: Blob
): Promise<boolean> => {
  try {
    // Option 1: Utiliser Supabase Edge Function
    const { supabase } = await import('../lib/supabase');
    
    // Convertir le PDF en base64
    const reader = new FileReader();
    const pdfBase64 = await new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(pdfBlob);
    });
    
    // Préparer le contenu HTML de l'email
    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #334155;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f8fafc;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .invoice-details {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #10b981;
          }
          .amount {
            font-size: 24px;
            font-weight: bold;
            color: #10b981;
          }
          .button {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 8px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            color: #64748b;
            font-size: 12px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Nouvelle Facture</h1>
          <p>JuristDZ - Plateforme Juridique Professionnelle</p>
        </div>
        
        <div class="content">
          <p>Bonjour ${recipientName},</p>
          
          <p>Vous avez reçu une nouvelle facture de votre avocat.</p>
          
          <div class="invoice-details">
            <p><strong>Numéro de facture:</strong> ${invoiceNumber}</p>
            <p><strong>Montant total:</strong> <span class="amount">${invoiceTotal.toLocaleString()} DA</span></p>
          </div>
          
          <p>Vous trouverez la facture détaillée en pièce jointe de cet email.</p>
          
          <p>Pour toute question concernant cette facture, n'hésitez pas à contacter votre avocat.</p>
          
          <p>Cordialement,<br>
          <strong>L'équipe JuristDZ</strong></p>
        </div>
        
        <div class="footer">
          <p>Cet email a été envoyé automatiquement par JuristDZ</p>
          <p>© ${new Date().getFullYear()} JuristDZ - Tous droits réservés</p>
        </div>
      </body>
      </html>
    `;
    
    // Appeler la fonction Edge de Supabase pour envoyer l'email
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: recipientEmail,
        subject: `Facture ${invoiceNumber} - JuristDZ`,
        html: emailHTML,
        attachments: [
          {
            filename: `${invoiceNumber}.pdf`,
            content: pdfBase64,
            type: 'application/pdf',
            disposition: 'attachment'
          }
        ]
      }
    });
    
    if (error) {
      console.error('Error sending email:', error);
      
      // Fallback: Ouvrir le client email par défaut
      const mailtoLink = `mailto:${recipientEmail}?subject=Facture ${invoiceNumber}&body=Veuillez trouver ci-joint votre facture ${invoiceNumber} d'un montant de ${invoiceTotal.toLocaleString()} DA.`;
      window.open(mailtoLink, '_blank');
      
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in sendInvoiceEmail:', error);
    
    // Fallback: Ouvrir le client email par défaut
    const mailtoLink = `mailto:${recipientEmail}?subject=Facture ${invoiceNumber}&body=Veuillez trouver ci-joint votre facture ${invoiceNumber} d'un montant de ${invoiceTotal.toLocaleString()} DA.`;
    window.open(mailtoLink, '_blank');
    
    return false;
  }
};

// Fonction pour envoyer un rappel de paiement
export const sendPaymentReminderEmail = async (
  recipientEmail: string,
  recipientName: string,
  invoiceNumber: string,
  invoiceTotal: number,
  dueDate: string,
  daysOverdue: number
): Promise<boolean> => {
  try {
    const { supabase } = await import('../lib/supabase');
    
    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #334155;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f8fafc;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .alert {
            background: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .amount {
            font-size: 24px;
            font-weight: bold;
            color: #ef4444;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>⚠️ Rappel de Paiement</h1>
        </div>
        
        <div class="content">
          <p>Bonjour ${recipientName},</p>
          
          <div class="alert">
            <p><strong>Facture en retard:</strong> ${invoiceNumber}</p>
            <p><strong>Montant dû:</strong> <span class="amount">${invoiceTotal.toLocaleString()} DA</span></p>
            <p><strong>Date d'échéance:</strong> ${new Date(dueDate).toLocaleDateString('fr-FR')}</p>
            <p><strong>Retard:</strong> ${daysOverdue} jour(s)</p>
          </div>
          
          <p>Nous vous rappelons que le paiement de cette facture est en retard.</p>
          
          <p>Merci de régulariser votre situation dans les plus brefs délais.</p>
          
          <p>Cordialement,<br>
          <strong>Votre Avocat</strong></p>
        </div>
      </body>
      </html>
    `;
    
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        to: recipientEmail,
        subject: `⚠️ Rappel: Facture ${invoiceNumber} en retard`,
        html: emailHTML
      }
    });
    
    return !error;
  } catch (error) {
    console.error('Error sending reminder:', error);
    return false;
  }
};
