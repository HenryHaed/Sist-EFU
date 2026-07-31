import * as fs from 'fs';
import * as path from 'path';

export const PDF_LOGO = { x: 50, y: 40, width: 25 };
export const PDF_HEADER_X_WITH_LOGO = 85;
export const PDF_HEADER_X_NO_LOGO = 50;

/** Colores institucionales UMSA */
export const PDF_UMSA_BLUE = '#003399';
export const PDF_UMSA_RED = '#c8102e';

export function resolveLogoPath(): string {
  const candidates = [
    path.join(process.cwd(), '..', 'frontend', 'src', 'assets', 'img', 'Logo_Umsa.png'),
    path.join(process.cwd(), 'frontend', 'src', 'assets', 'img', 'Logo_Umsa.png'),
    'e:\\Entrada-Universitaria\\frontend\\src\\assets\\img\\Logo_Umsa.png',
  ];
  return candidates.find((p) => fs.existsSync(p)) || candidates[0];
}

export type PdfHeaderOptions = {
  /** Ancho de página (puntos). Portrait A4 ≈ 595; landscape ≈ 842 */
  pageWidth?: number;
  margin?: number;
  /** Encabezado más compacto (reportes landscape) */
  compact?: boolean;
};

export function drawPdfInstitutionalHeader(
  doc: any,
  titleLine: string,
  subtitleLine?: string,
  options?: PdfHeaderOptions,
) {
  const margin = options?.margin ?? 50;
  const pageWidth = options?.pageWidth ?? 595.28;
  const compact = options?.compact ?? false;
  const contentWidth = pageWidth - margin * 2;

  const logoW = compact ? 28 : PDF_LOGO.width;
  const logoX = margin;
  const logoY = compact ? 28 : PDF_LOGO.y;
  const logoPath = resolveLogoPath();
  const hasLogo = fs.existsSync(logoPath);
  const headerX = hasLogo ? margin + logoW + 10 : margin;

  if (hasLogo) {
    doc.image(logoPath, logoX, logoY, { width: logoW });
  }

  const titleSize = compact ? 12 : 15;
  const subSize = compact ? 8 : 10;
  const reportSize = compact ? 9 : 10;

  doc
    .fontSize(titleSize)
    .fillColor(PDF_UMSA_BLUE)
    .font('Helvetica-Bold')
    .text('UNIVERSIDAD MAYOR DE SAN ANDRÉS', headerX, compact ? 30 : 45, {
      width: contentWidth - (hasLogo ? logoW + 10 : 0),
    });
  doc
    .fontSize(subSize)
    .fillColor('#0f172a')
    .font('Helvetica')
    .text('COMISIÓN ORGANIZADORA DE LA ENTRADA UNIVERSITARIA', headerX, compact ? 46 : 63, {
      width: contentWidth - (hasLogo ? logoW + 10 : 0),
    });
  doc
    .fontSize(reportSize)
    .fillColor(PDF_UMSA_RED)
    .font('Helvetica-Bold')
    .text(titleLine, headerX, compact ? 58 : 76, {
      width: contentWidth - (hasLogo ? logoW + 10 : 0),
    });
  if (subtitleLine) {
    doc
      .fontSize(7)
      .fillColor('#475569')
      .font('Helvetica-Oblique')
      .text(subtitleLine, headerX, compact ? 70 : 89, {
        width: contentWidth - (hasLogo ? logoW + 10 : 0),
      });
  }

  const lineY = compact ? (subtitleLine ? 84 : 78) : 105;
  // Doble línea institucional (azul + rojo) — estilo oficinista
  doc
    .moveTo(margin, lineY)
    .lineTo(margin + contentWidth, lineY)
    .lineWidth(1.5)
    .strokeColor(PDF_UMSA_BLUE)
    .stroke();
  doc
    .moveTo(margin, lineY + 2.5)
    .lineTo(margin + contentWidth, lineY + 2.5)
    .lineWidth(0.75)
    .strokeColor(PDF_UMSA_RED)
    .stroke();

  return {
    headerX,
    contentStartY: lineY + (compact ? 12 : 15),
    margin,
    contentWidth,
    pageWidth,
  };
}
