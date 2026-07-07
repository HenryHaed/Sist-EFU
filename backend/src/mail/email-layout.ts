export const UMSA_PRIMARY = '#003399';
export const UMSA_SECONDARY = '#c8102e';
export const UMSA_BG = '#f8fafc';
export const UMSA_TEXT = '#1e293b';
export const UMSA_MUTED = '#64748b';

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function nl2br(text: string): string {
  return escapeHtml(text).replace(/\n/g, '<br/>');
}

type EmailLayoutOptions = {
  title: string;
  subtitle?: string;
  contentHtml: string;
  frontendUrl?: string;
};

export function buildEmailLayout({
  title,
  subtitle = 'Entrada Folklórica Universitaria',
  contentHtml,
  frontendUrl,
}: EmailLayoutOptions): string {
  const portalLine = frontendUrl
    ? `<p style="margin: 0; font-size: 11px; color: ${UMSA_MUTED};">
         Portal: <a href="${escapeHtml(frontendUrl)}" style="color: ${UMSA_PRIMARY}; text-decoration: none;">${escapeHtml(frontendUrl)}</a>
       </p>`
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${UMSA_BG}; font-family: Arial, Helvetica, sans-serif; color: ${UMSA_TEXT};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: ${UMSA_BG}; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 8px 24px rgba(0, 51, 153, 0.08);">
          <tr>
            <td style="background: linear-gradient(135deg, ${UMSA_PRIMARY} 0%, #002266 100%); padding: 28px 32px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <p style="margin: 0 0 6px; font-size: 11px; font-weight: bold; letter-spacing: 0.22em; text-transform: uppercase; color: rgba(255,255,255,0.85);">
                      Universidad Mayor de San Andrés
                    </p>
                    <h1 style="margin: 0; font-size: 32px; font-weight: 900; font-style: italic; letter-spacing: -0.02em; color: #ffffff; line-height: 1;">
                      UMS<span style="color: ${UMSA_SECONDARY};">A</span>
                    </h1>
                    <p style="margin: 10px 0 0; font-size: 12px; font-weight: bold; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.92);">
                      ${escapeHtml(subtitle)}
                    </p>
                  </td>
                </tr>
              </table>
              <div style="margin-top: 18px; height: 4px; width: 72px; background: linear-gradient(90deg, ${UMSA_SECONDARY}, #ffffff); border-radius: 999px;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 20px; font-size: 22px; font-weight: 900; color: ${UMSA_PRIMARY}; line-height: 1.25;">
                ${escapeHtml(title)}
              </h2>
              ${contentHtml}
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 32px 28px; background-color: #f1f5f9; border-top: 3px solid ${UMSA_SECONDARY};">
              <p style="margin: 0 0 8px; font-size: 11px; font-weight: bold; letter-spacing: 0.12em; text-transform: uppercase; color: ${UMSA_PRIMARY};">
                Sistema de Gestión EFU
              </p>
              <p style="margin: 0 0 10px; font-size: 12px; line-height: 1.5; color: ${UMSA_MUTED};">
                Este mensaje fue enviado desde el sistema oficial de la Entrada Folklórica Universitaria de la UMSA.
              </p>
              ${portalLine}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function emailParagraph(html: string): string {
  return `<p style="margin: 0 0 16px; font-size: 15px; line-height: 1.65; color: ${UMSA_TEXT};">${html}</p>`;
}

export function emailHighlightBox(innerHtml: string): string {
  return `<div style="margin: 24px 0; padding: 20px 22px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid ${UMSA_SECONDARY}; border-radius: 0 12px 12px 0;">
    ${innerHtml}
  </div>`;
}

export function emailCodeDisplay(code: string): string {
  return `<div style="margin: 28px 0; text-align: center;">
    <p style="margin: 0 0 10px; font-size: 11px; font-weight: bold; letter-spacing: 0.14em; text-transform: uppercase; color: ${UMSA_MUTED};">
      Tu código de verificación
    </p>
    <div style="display: inline-block; padding: 18px 28px; background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%); border: 2px solid ${UMSA_PRIMARY}; border-radius: 12px;">
      <span style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: ${UMSA_PRIMARY};">${escapeHtml(code)}</span>
    </div>
  </div>`;
}

export function emailButton(href: string, label: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin: 28px auto;">
    <tr>
      <td align="center" style="border-radius: 999px; background: linear-gradient(135deg, ${UMSA_PRIMARY} 0%, #002266 100%);">
        <a href="${escapeHtml(href)}" style="display: inline-block; padding: 14px 32px; font-size: 13px; font-weight: bold; letter-spacing: 0.08em; text-transform: uppercase; color: #ffffff; text-decoration: none; border-radius: 999px;">
          ${escapeHtml(label)}
        </a>
      </td>
    </tr>
  </table>`;
}

export function emailMutedNote(html: string): string {
  return `<p style="margin: 16px 0 0; font-size: 12px; line-height: 1.5; color: ${UMSA_MUTED};">${html}</p>`;
}

export function emailLabel(text: string): string {
  return `<p style="margin: 0 0 12px; font-size: 11px; font-weight: bold; letter-spacing: 0.1em; text-transform: uppercase; color: ${UMSA_MUTED};">${escapeHtml(text)}</p>`;
}
