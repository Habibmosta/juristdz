/**
 * Service d'export PDF professionnel
 * Utilise jsPDF pour générer des PDFs des documents juridiques
 */
import jsPDF from 'jspdf';

export interface PdfExportOptions {
  title: string;
  content: string;
  language: 'fr' | 'ar';
  wilaya?: string;
  date?: Date;
  footer?: string;
}

export const pdfExportService = {
  /**
   * Exporter un document juridique en PDF
   */
  exportDocument(options: PdfExportOptions): void {
    const { title, content, language, wilaya, date = new Date(), footer } = options;
    const isAr = language === 'ar';

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentW = pageW - margin * 2;

    // ── Header ──────────────────────────────────────────────
    doc.setFillColor(15, 52, 96); // legal-blue
    doc.rect(0, 0, pageW, 18, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('JuristDZ', margin, 12);

    const headerRight = wilaya ? `Wilaya de ${wilaya}` : 'Document Juridique';
    doc.text(headerRight, pageW - margin, 12, { align: 'right' });

    // ── Title ────────────────────────────────────────────────
    doc.setTextColor(15, 52, 96);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const titleLines = doc.splitTextToSize(title, contentW);
    doc.text(titleLines, pageW / 2, 30, { align: 'center' });

    // Date
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    const dateStr = date.toLocaleDateString(isAr ? 'ar-DZ' : 'fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
    doc.text(dateStr, pageW / 2, 38, { align: 'center' });

    // Separator line
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, 42, pageW - margin, 42);

    // ── Content ──────────────────────────────────────────────
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // Strip markdown
    const plainText = content
      .replace(/#{1,6}\s+/g, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/_{1,2}(.+?)_{1,2}/g, '$1')
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')
      .replace(/`(.+?)`/g, '$1')
      .replace(/^[-*+]\s+/gm, '• ')
      .replace(/^\d+\.\s+/gm, (m) => m);

    const lines = doc.splitTextToSize(plainText, contentW);
    let y = 50;
    const lineH = 5.5;
    const footerH = 15;

    for (const line of lines) {
      if (y + lineH > pageH - footerH) {
        // Footer on current page
        pdfExportService._addFooter(doc, pageW, pageH, margin, footer);
        doc.addPage();
        // Header on new page
        doc.setFillColor(15, 52, 96);
        doc.rect(0, 0, pageW, 18, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('JuristDZ', margin, 12);
        doc.setTextColor(30, 30, 30);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        y = 25;
      }
      doc.text(line, margin, y);
      y += lineH;
    }

    // Footer on last page
    pdfExportService._addFooter(doc, pageW, pageH, margin, footer);

    // Save
    const filename = `${title.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_').substring(0, 50)}_${date.toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  },

  _addFooter(doc: jsPDF, pageW: number, pageH: number, margin: number, footer?: string): void {
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, pageH - 12, pageW - margin, pageH - 12);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    const footerText = footer || 'Document généré par JuristDZ — www.juristdz.com';
    doc.text(footerText, pageW / 2, pageH - 7, { align: 'center' });
    const pageNum = `Page ${(doc as any).internal.getCurrentPageInfo().pageNumber}`;
    doc.text(pageNum, pageW - margin, pageH - 7, { align: 'right' });
  },
};
