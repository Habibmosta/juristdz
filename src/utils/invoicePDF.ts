import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface InvoiceData {
  invoice_number: string;
  issue_date: string;
  due_date: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  case_title?: string;
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
  }>;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes?: string;
}

interface LawyerInfo {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  nif?: string; // Numéro d'identification fiscale
}

export const generateInvoicePDF = (invoice: InvoiceData, lawyerInfo: LawyerInfo): jsPDF => {
  const doc = new jsPDF();
  
  // Configuration
  const primaryColor: [number, number, number] = [16, 185, 129]; // Green-600
  const textColor: [number, number, number] = [51, 65, 85]; // Slate-700
  const lightGray: [number, number, number] = [241, 245, 249]; // Slate-100
  
  let yPos = 20;
  
  // ===== EN-TÊTE =====
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, 'F');
  
  // Logo/Titre
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURE', 20, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.invoice_number, 20, 32);
  
  yPos = 50;
  
  // ===== INFORMATIONS AVOCAT =====
  doc.setTextColor(...textColor);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('De:', 20, yPos);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  yPos += 6;
  doc.text(lawyerInfo.name, 20, yPos);
  
  if (lawyerInfo.email) {
    yPos += 5;
    doc.text(lawyerInfo.email, 20, yPos);
  }
  
  if (lawyerInfo.phone) {
    yPos += 5;
    doc.text(lawyerInfo.phone, 20, yPos);
  }
  
  if (lawyerInfo.address) {
    yPos += 5;
    doc.text(lawyerInfo.address, 20, yPos);
  }
  
  if (lawyerInfo.nif) {
    yPos += 5;
    doc.text(`NIF: ${lawyerInfo.nif}`, 20, yPos);
  }
  
  // ===== INFORMATIONS CLIENT =====
  yPos = 50;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('À:', 120, yPos);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  yPos += 6;
  doc.text(invoice.client_name, 120, yPos);
  
  if (invoice.client_email) {
    yPos += 5;
    doc.text(invoice.client_email, 120, yPos);
  }
  
  if (invoice.client_phone) {
    yPos += 5;
    doc.text(invoice.client_phone, 120, yPos);
  }
  
  if (invoice.case_title) {
    yPos += 5;
    doc.setFont('helvetica', 'italic');
    doc.text(`Dossier: ${invoice.case_title}`, 120, yPos);
    doc.setFont('helvetica', 'normal');
  }
  
  // ===== DATES =====
  yPos = Math.max(yPos, 85) + 10;
  doc.setFillColor(...lightGray);
  doc.rect(20, yPos, 170, 15, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Date d\'émission:', 25, yPos + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(invoice.issue_date).toLocaleDateString('fr-FR'), 25, yPos + 11);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Date d\'échéance:', 100, yPos + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(invoice.due_date).toLocaleDateString('fr-FR'), 100, yPos + 11);
  
  yPos += 25;
  
  // ===== TABLEAU DES ÉLÉMENTS =====
  const tableData = invoice.items.map(item => [
    item.description,
    item.quantity.toString(),
    `${item.unit_price.toLocaleString()} DA`,
    `${item.amount.toLocaleString()} DA`
  ]);
  
  (doc as any).autoTable({
    startY: yPos,
    head: [['Description', 'Quantité', 'Prix unitaire', 'Montant']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10
    },
    bodyStyles: {
      fontSize: 9,
      textColor: textColor
    },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' }
    },
    margin: { left: 20, right: 20 }
  });
  
  // ===== TOTAUX =====
  yPos = (doc as any).lastAutoTable.finalY + 10;
  
  const totalsX = 130;
  const totalsWidth = 60;
  
  // Sous-total
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Sous-total:', totalsX, yPos);
  doc.text(`${invoice.subtotal.toLocaleString()} DA`, totalsX + totalsWidth, yPos, { align: 'right' });
  
  // TVA
  yPos += 6;
  doc.text(`TVA (${invoice.tax_rate}%):`, totalsX, yPos);
  doc.text(`${invoice.tax_amount.toLocaleString()} DA`, totalsX + totalsWidth, yPos, { align: 'right' });
  
  // Ligne de séparation
  yPos += 3;
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(totalsX, yPos, totalsX + totalsWidth, yPos);
  
  // Total
  yPos += 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.text('TOTAL:', totalsX, yPos);
  doc.text(`${invoice.total.toLocaleString()} DA`, totalsX + totalsWidth, yPos, { align: 'right' });
  
  // ===== NOTES =====
  if (invoice.notes) {
    yPos += 15;
    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Notes:', 20, yPos);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const splitNotes = doc.splitTextToSize(invoice.notes, 170);
    doc.text(splitNotes, 20, yPos + 5);
    yPos += 5 + (splitNotes.length * 4);
  }
  
  // ===== PIED DE PAGE =====
  const pageHeight = doc.internal.pageSize.height;
  doc.setFillColor(...lightGray);
  doc.rect(0, pageHeight - 30, 210, 30, 'F');
  
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.text('Merci pour votre confiance', 105, pageHeight - 20, { align: 'center' });
  doc.text('Paiement par virement bancaire ou espèces', 105, pageHeight - 15, { align: 'center' });
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} par JuristDZ`, 105, pageHeight - 10, { align: 'center' });
  
  return doc;
};

export const downloadInvoicePDF = (invoice: InvoiceData, lawyerInfo: LawyerInfo) => {
  const doc = generateInvoicePDF(invoice, lawyerInfo);
  doc.save(`${invoice.invoice_number}.pdf`);
};

export const getInvoicePDFBlob = (invoice: InvoiceData, lawyerInfo: LawyerInfo): Blob => {
  const doc = generateInvoicePDF(invoice, lawyerInfo);
  return doc.output('blob');
};
