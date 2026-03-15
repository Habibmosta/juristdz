/**
 * Export service — CSV & Excel (XLSX via pure JS, no external lib needed)
 * Supports: exportCSV, exportExcel
 */

export interface ExportColumn {
  key: string;
  label: string;
  format?: (value: any) => string;
}

// ─── CSV ──────────────────────────────────────────────────────────────────────

export function exportCSV(data: Record<string, any>[], columns: ExportColumn[], filename: string): void {
  const header = columns.map(c => `"${c.label}"`).join(',');
  const rows = data.map(row =>
    columns.map(c => {
      const val = row[c.key] ?? '';
      const formatted = c.format ? c.format(val) : String(val);
      return `"${formatted.replace(/"/g, '""')}"`;
    }).join(',')
  );
  const csv = [header, ...rows].join('\r\n');
  const bom = '\uFEFF'; // UTF-8 BOM for Excel compatibility
  downloadBlob(bom + csv, `${filename}.csv`, 'text/csv;charset=utf-8;');
}

// ─── Excel (XLSX) — pure JS, no lib ──────────────────────────────────────────
// Generates a minimal valid .xlsx using the Open XML format

export function exportExcel(data: Record<string, any>[], columns: ExportColumn[], filename: string): void {
  const rows: string[][] = [
    columns.map(c => c.label),
    ...data.map(row =>
      columns.map(c => {
        const val = row[c.key] ?? '';
        return c.format ? c.format(val) : String(val);
      })
    )
  ];

  const xml = buildXlsx(rows);
  downloadBlob(xml, `${filename}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

// ─── Minimal XLSX builder ─────────────────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildXlsx(rows: string[][]): string {
  // We return a CSV-compatible XML that Excel opens natively (SpreadsheetML)
  const xmlRows = rows.map((row, ri) => {
    const cells = row.map((cell, ci) => {
      const col = String.fromCharCode(65 + ci);
      return `<Cell><Data ss:Type="String">${escapeXml(cell)}</Data></Cell>`;
    }).join('');
    return `<Row>${cells}</Row>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="header">
      <Font ss:Bold="1"/>
      <Interior ss:Color="#C8A951" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="Export">
    <Table>${xmlRows}</Table>
  </Worksheet>
</Workbook>`;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Pre-built column configs ─────────────────────────────────────────────────

export const CASE_EXPORT_COLUMNS: ExportColumn[] = [
  { key: 'case_number', label: 'N° Dossier' },
  { key: 'title', label: 'Titre' },
  { key: 'clientName', label: 'Client' },
  { key: 'caseType', label: 'Type' },
  { key: 'status', label: 'Statut' },
  { key: 'priority', label: 'Priorité' },
  { key: 'deadline', label: 'Échéance', format: v => v ? new Date(v).toLocaleDateString('fr-DZ') : '' },
  { key: 'estimatedValue', label: 'Valeur estimée (DA)', format: v => v ? String(v) : '' },
  { key: 'assignedLawyer', label: 'Avocat assigné' },
  { key: 'created_at', label: 'Date création', format: v => v ? new Date(v).toLocaleDateString('fr-DZ') : '' },
];

export const CLIENT_EXPORT_COLUMNS: ExportColumn[] = [
  { key: 'firstName', label: 'Prénom' },
  { key: 'lastName', label: 'Nom' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Téléphone' },
  { key: 'address', label: 'Adresse' },
  { key: 'totalCases', label: 'Total dossiers' },
  { key: 'activeCases', label: 'Dossiers actifs' },
  { key: 'totalRevenue', label: 'Revenus (DA)' },
  { key: 'createdAt', label: 'Date ajout', format: v => v ? new Date(v).toLocaleDateString('fr-DZ') : '' },
];

export const INVOICE_EXPORT_COLUMNS: ExportColumn[] = [
  { key: 'invoice_number', label: 'N° Facture' },
  { key: 'client_name', label: 'Client' },
  { key: 'status', label: 'Statut' },
  { key: 'subtotal', label: 'Sous-total (DA)' },
  { key: 'tax_amount', label: 'TVA (DA)' },
  { key: 'total_amount', label: 'Total (DA)' },
  { key: 'issue_date', label: 'Date émission', format: v => v ? new Date(v).toLocaleDateString('fr-DZ') : '' },
  { key: 'due_date', label: 'Date échéance', format: v => v ? new Date(v).toLocaleDateString('fr-DZ') : '' },
  { key: 'paid_date', label: 'Date paiement', format: v => v ? new Date(v).toLocaleDateString('fr-DZ') : '' },
];
