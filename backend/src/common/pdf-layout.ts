import * as fs from 'fs';
import * as path from 'path';

export const PDF_LOGO = { x: 50, y: 40, width: 25 };
export const PDF_HEADER_X_WITH_LOGO = 85;
export const PDF_HEADER_X_NO_LOGO = 50;

export function resolveLogoPath(): string {
  const candidates = [
    path.join(process.cwd(), '..', 'frontend', 'src', 'assets', 'img', 'Logo_Umsa.png'),
    path.join(process.cwd(), 'frontend', 'src', 'assets', 'img', 'Logo_Umsa.png'),
    'e:\\Entrada-Universitaria\\frontend\\src\\assets\\img\\Logo_Umsa.png',
  ];
  return candidates.find((p) => fs.existsSync(p)) || candidates[0];
}

export function drawPdfInstitutionalHeader(
  doc: any,
  titleLine: string,
  subtitleLine?: string,
) {
  const logoPath = resolveLogoPath();
  const hasLogo = fs.existsSync(logoPath);
  const headerX = hasLogo ? PDF_HEADER_X_WITH_LOGO : PDF_HEADER_X_NO_LOGO;

  if (hasLogo) {
    doc.image(logoPath, PDF_LOGO.x, PDF_LOGO.y, { width: PDF_LOGO.width });
  }

  doc.fontSize(15).fillColor('#003399').font('Helvetica-Bold').text('UNIVERSIDAD MAYOR DE SAN ANDRÉS', headerX, 45);
  doc
    .fontSize(10)
    .fillColor('#0f172a')
    .font('Helvetica')
    .text('COMISIÓN ORGANIZADORA DE LA ENTRADA UNIVERSITARIA', headerX, 63);
  doc.fontSize(10).fillColor('#c8102e').font('Helvetica-Bold').text(titleLine, headerX, 76);
  if (subtitleLine) {
    doc.fontSize(8).fillColor('#475569').font('Helvetica-Oblique').text(subtitleLine, headerX, 89);
  }

  doc.moveTo(50, 105).lineTo(545, 105).lineWidth(1.5).strokeColor('#003399').stroke();

  return { headerX, contentStartY: subtitleLine ? 120 : 115 };
}
