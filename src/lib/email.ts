import { Resend } from 'resend';

// Instanciação lazy: o módulo pode ser importado (build, ambientes sem e-mail)
// sem exigir a RESEND_API_KEY. O client só é criado ao enviar de fato.
let resendClient: Resend | null = null;
function getResend(): Resend {
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}
const FROM = process.env.RESEND_FROM ?? 'PlantGuard AI <onboarding@resend.dev>';

const brand = `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td style="padding:32px 32px 20px;border-bottom:1px solid #e6ead8;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="background:#1b4d34;border-radius:10px;width:38px;height:38px;text-align:center;vertical-align:middle;">
              <span style="color:#f4f1e8;font-size:20px;line-height:38px;">🌿</span>
            </td>
            <td style="padding-left:10px;vertical-align:middle;">
              <span style="font-family:Georgia,serif;font-size:18px;font-weight:700;color:#0e1c12;letter-spacing:-0.3px;">PlantGuard AI</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
`;

const footer = `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td style="padding:20px 32px 32px;border-top:1px solid #e6ead8;text-align:center;">
        <p style="margin:0;font-family:sans-serif;font-size:12px;color:#9ca3af;">
          PlantGuard AI · Diagnóstico assistido por IA<br>
          <span style="font-size:11px;">Este email foi enviado automaticamente. Não responda a este endereço.</span>
        </p>
      </td>
    </tr>
  </table>
`;

const wrapper = (content: string) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>PlantGuard AI</title></head>
<body style="margin:0;padding:0;background:#f4f1e8;font-family:sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f1e8;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#faf8f3;border-radius:16px;border:1px solid #ccc8b8;overflow:hidden;">
          ${brand}
          ${content}
          ${footer}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

/** Escapa texto do usuário antes de interpolar no HTML do e-mail. */
function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface DiseaseAlertData {
  userName: string;
  imageName: string;
  plantType: string | null;
  pathology: string | null;
  confidence: number;
  description: string;
  recommendations: string;
  createdAt: string;
  analysisId: string;
}

export async function sendDiseaseAlertEmail(to: string, data: DiseaseAlertData) {
  const severityColor = data.confidence >= 70 ? '#b91c1c' : '#b45309';
  const date = new Date(data.createdAt).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const html = wrapper(`
    <tr>
      <td style="padding:28px 32px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
               style="background:#fff0f0;border-radius:12px;border:1px solid #fca5a5;overflow:hidden;">
          <tr>
            <td style="padding:16px 20px;background:#fef2f2;border-bottom:1px solid #fca5a5;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <span style="font-size:20px;">🔴</span>
                  </td>
                  <td style="padding-left:10px;vertical-align:middle;">
                    <span style="font-family:Georgia,serif;font-size:16px;font-weight:700;color:#991b1b;">Planta Doente Detectada</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 20px;">
              <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Análise em <strong style="color:#0e1c12;">${esc(data.imageName)}</strong> · ${date}</p>
              ${data.plantType ? `<p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#0e1c12;">🌱 ${esc(data.plantType)}</p>` : ''}
              ${data.pathology ? `<p style="margin:0;font-size:13px;font-weight:600;color:${severityColor};">⚠ ${esc(data.pathology)}</p>` : ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding:20px 32px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding-bottom:12px;">
              <p style="margin:0 0 6px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.6px;color:#5a6350;">Confiança da Análise</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:#e6ead8;border-radius:999px;height:8px;overflow:hidden;">
                    <table role="presentation" width="${data.confidence}%" cellpadding="0" cellspacing="0" border="0">
                      <tr><td style="background:${severityColor};height:8px;border-radius:999px;"></td></tr>
                    </table>
                  </td>
                  <td style="padding-left:10px;white-space:nowrap;font-size:13px;font-weight:700;color:${severityColor};">${data.confidence}%</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding:16px 32px 0;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.6px;color:#5a6350;">🔬 Diagnóstico</p>
        <p style="margin:0;font-size:14px;line-height:1.7;color:#374151;">${esc(data.description)}</p>
      </td>
    </tr>

    <tr>
      <td style="padding:16px 32px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
               style="background:#f0fdf4;border-radius:10px;border:1px solid #bbf7d0;overflow:hidden;">
          <tr>
            <td style="padding:14px 18px;">
              <p style="margin:0 0 8px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.6px;color:#166534;">💡 Recomendações</p>
              <p style="margin:0;font-size:14px;line-height:1.7;color:#15803d;white-space:pre-line;">${esc(data.recommendations)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding:20px 32px 28px;text-align:center;">
        <a href="${process.env.NEXTAUTH_URL}/history"
           style="display:inline-block;background:#1b4d34;color:#f4f1e8;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:600;letter-spacing:0.2px;">
          Ver Histórico Completo
        </a>
      </td>
    </tr>
  `);

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `🔴 Planta Doente: ${data.plantType ?? data.imageName} — PlantGuard AI`,
    html,
  });
}

export interface ReportAnalysis {
  id: string;
  imageName: string;
  status: string;
  confidence: number;
  plantType: string | null;
  pathology: string | null;
  description: string;
  createdAt: string;
}

export async function sendAnalysisReportEmail(
  to: string,
  userName: string,
  analyses: ReportAnalysis[],
  period: { from: string; to: string },
) {
  const statusIcon: Record<string, string> = {
    'Saudável': '🟢',
    'Doente': '🔴',
    'Inconclusivo': '🟡',
  };
  const statusColor: Record<string, string> = {
    'Saudável': '#166534',
    'Doente': '#991b1b',
    'Inconclusivo': '#92400e',
  };
  const statusBg: Record<string, string> = {
    'Saudável': '#f0fdf4',
    'Doente': '#fef2f2',
    'Inconclusivo': '#fffbeb',
  };

  const total = analyses.length;
  const healthy = analyses.filter((a) => a.status === 'Saudável').length;
  const sick = analyses.filter((a) => a.status === 'Doente').length;
  const healthRate = total > 0 ? Math.round((healthy / total) * 100) : 0;

  const rows = analyses
    .map((a) => {
      const date = new Date(a.createdAt).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
      });
      const icon = statusIcon[a.status] ?? '⚪';
      const color = statusColor[a.status] ?? '#374151';
      const bg = statusBg[a.status] ?? '#ffffff';
      const short = a.description.length > 90 ? a.description.slice(0, 90) + '…' : a.description;
      return `
        <tr>
          <td style="padding:10px 14px;border-bottom:1px solid #e6ead8;white-space:nowrap;font-size:12px;color:#5a6350;">${date}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e6ead8;font-size:13px;color:#0e1c12;">${esc(a.imageName)}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e6ead8;">
            <span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;background:${bg};color:${color};">${icon} ${esc(a.status)}</span>
          </td>
          <td style="padding:10px 14px;border-bottom:1px solid #e6ead8;font-size:12px;color:#374151;">${esc(a.plantType ?? '—')}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e6ead8;font-size:12px;color:${color};">${esc(a.pathology ?? '—')}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e6ead8;font-size:12px;color:#374151;max-width:220px;">${esc(short)}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e6ead8;font-size:12px;font-weight:600;color:#374151;text-align:right;">${a.confidence}%</td>
        </tr>
      `;
    })
    .join('');

  const html = wrapper(`
    <tr>
      <td style="padding:28px 32px 0;">
        <h2 style="margin:0 0 6px;font-family:Georgia,serif;font-size:22px;font-weight:700;color:#0e1c12;">Relatório de Análises</h2>
        <p style="margin:0;font-size:14px;color:#5a6350;">
          Olá, <strong>${esc(userName)}</strong> · Período: ${period.from} a ${period.to}
        </p>
      </td>
    </tr>

    <tr>
      <td style="padding:20px 32px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="25%" style="padding:0 6px 0 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background:#f4f1e8;border-radius:10px;border:1px solid #ccc8b8;padding:12px 14px;">
                <tr><td style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#5a6350;">Total</td></tr>
                <tr><td style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#0e1c12;">${total}</td></tr>
              </table>
            </td>
            <td width="25%" style="padding:0 6px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background:#f0fdf4;border-radius:10px;border:1px solid #bbf7d0;padding:12px 14px;">
                <tr><td style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#166534;">Saudáveis</td></tr>
                <tr><td style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#166534;">${healthy}</td></tr>
              </table>
            </td>
            <td width="25%" style="padding:0 6px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background:#fef2f2;border-radius:10px;border:1px solid #fca5a5;padding:12px 14px;">
                <tr><td style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#991b1b;">Doentes</td></tr>
                <tr><td style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#991b1b;">${sick}</td></tr>
              </table>
            </td>
            <td width="25%" style="padding:0 0 0 6px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background:#fffbeb;border-radius:10px;border:1px solid #fde68a;padding:12px 14px;">
                <tr><td style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#92400e;">Taxa de Saúde</td></tr>
                <tr><td style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#92400e;">${healthRate}%</td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding:20px 32px 0;overflow-x:auto;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
               style="border-radius:10px;border:1px solid #ccc8b8;overflow:hidden;font-family:sans-serif;">
          <thead>
            <tr style="background:#e6ead8;">
              <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#5a6350;white-space:nowrap;">Data</th>
              <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#5a6350;">Imagem</th>
              <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#5a6350;">Status</th>
              <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#5a6350;">Planta</th>
              <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#5a6350;">Patologia</th>
              <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#5a6350;">Diagnóstico</th>
              <th style="padding:10px 14px;text-align:right;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#5a6350;">Conf.</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="7" style="padding:20px;text-align:center;color:#9ca3af;font-size:13px;">Nenhuma análise no período.</td></tr>'}
          </tbody>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding:20px 32px 28px;text-align:center;">
        <a href="${process.env.NEXTAUTH_URL}/dashboard/analytics"
           style="display:inline-block;background:#1b4d34;color:#f4f1e8;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:600;letter-spacing:0.2px;">
          Ver Dashboard Completo
        </a>
      </td>
    </tr>
  `);

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `📊 Relatório PlantGuard AI — ${period.from} a ${period.to}`,
    html,
  });
}
