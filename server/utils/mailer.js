const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ─── Build email HTML ───────────────────────────────────────────────────────── */
const buildEmailHTML = (otp, role, type = 'reset') => {
  const isDentist = role === 'dentist';

  // Teal for clinicians, blue for patients
  const accent     = isDentist ? '#0d9488' : '#2563eb';
  const accentLight= isDentist ? '#f0fdfa' : '#eff6ff';
  const accentBg   = isDentist ? '#0f766e' : '#1d4ed8';
  const accentDash = isDentist ? '#0d948844' : '#2563eb44';
  const portalName = isDentist ? 'ProstoCalc Clinician Portal' : 'ProstoCalc Patient Portal';
  const greeting   = isDentist ? 'Dear Doctor,' : 'Hello,';
  const footerRole = isDentist ? 'Clinician' : 'Patient';

  let typeLabel = 'Password Reset';
  let instructionText = `We received a request to reset the password for your ${footerRole} account.`;
  let steps = ['Return to the password reset page.', 'Enter the 6-digit code above.', 'Set your new password.'];

  if (type === 'login') {
    typeLabel = 'Secure Login';
    instructionText = `Enter this code to complete your login to the ${portalName}.`;
    steps = ['Enter the 6-digit code on the login screen.', 'Wait for biometric synchronization.', 'Access your clinical dashboard.'];
  } else if (type === 'signup') {
    typeLabel = 'Account Verification';
    instructionText = `Welcome to ProstoCalc! Please verify your email to activate your ${footerRole} account.`;
    steps = ['Enter the 6-digit code on the registration page.', 'Complete your profile details.', 'Start using the clinical AI tools.'];
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${typeLabel} · ${portalName}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">

          <!-- ── Header ────────────────────────────────────────────── -->
          <tr>
            <td style="background-color:${accentBg};border-radius:12px 12px 0 0;padding:28px 36px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.6);">
                      ${typeLabel}
                    </p>
                    <h1 style="margin:6px 0 0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
                      ${portalName}
                    </h1>
                  </td>
                  <td align="right">
                    <div style="width:40px;height:40px;background:rgba(255,255,255,0.12);border-radius:10px;display:inline-flex;align-items:center;justify-content:center;">
                      <img
                        src="https://api.iconify.design/lucide/shield-check.svg?color=rgba(255,255,255,0.8)&width=20&height=20"
                        width="20" height="20" alt="secure"
                        style="display:block;"
                      />
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Body ──────────────────────────────────────────────── -->
          <tr>
            <td style="background-color:#ffffff;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;padding:36px;">

              <p style="margin:0 0 6px;font-size:15px;font-weight:600;color:#0f172a;">${greeting}</p>
              <p style="margin:0 0 28px;font-size:14px;line-height:1.7;color:#475569;">
                ${instructionText}
                Use the verification code below — it expires in <strong style="color:#0f172a;">10 minutes</strong>.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color:${accentLight};border:1px dashed ${accentDash};border-radius:10px;padding:28px 20px;text-align:center;">
                    <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${accent};">
                      Verification code
                    </p>
                    <p style="margin:0;font-size:38px;font-weight:800;letter-spacing:12px;color:${accent};font-family:'Courier New',Courier,monospace;">
                      ${otp}
                    </p>
                    <p style="margin:10px 0 0;font-size:11px;color:#94a3b8;">
                      Valid for 10 minutes
                    </p>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;">
                <tr>
                  <td style="background-color:#f8fafc;border-radius:10px;padding:20px 24px;border:1px solid #e2e8f0;">
                    <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.1em;">
                      How to use this code
                    </p>
                    <table cellpadding="0" cellspacing="0" border="0">
                      ${steps.map((step, i) => `
                      <tr>
                        <td style="padding:3px 12px 3px 0;vertical-align:top;">
                          <span style="display:inline-block;width:20px;height:20px;background-color:${accent};border-radius:50%;text-align:center;line-height:20px;font-size:10px;font-weight:800;color:#fff;">${i + 1}</span>
                        </td>
                        <td style="padding:3px 0;font-size:13px;color:#475569;vertical-align:middle;">${step}</td>
                      </tr>`).join('')}
                    </table>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;">
                <tr>
                  <td style="background-color:#fefce8;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;">
                    <p style="margin:0;font-size:12px;line-height:1.6;color:#78350f;">
                      <strong>Security Note:</strong>
                      If you did not initiate this request, please ignore this email.
                      Your account security remains our highest priority.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ── Footer ────────────────────────────────────────────── -->
          <tr>
            <td style="background-color:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:20px 36px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.6;">
                      &copy; ${new Date().getFullYear()} ProstoCalc &nbsp;·&nbsp;
                      <a href="#" style="color:#94a3b8;text-decoration:none;">Security Center</a>
                    </p>
                  </td>
                  <td align="right">
                    <p style="margin:0;font-size:11px;color:#cbd5e1;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">
                      ${footerRole} Portal
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr><td style="height:32px;"></td></tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
};

const sendOTP = async (email, otp, role = 'patient', type = 'reset') => {
  const isDentist  = role === 'dentist';
  const subjectTag = isDentist ? 'Clinician' : 'Patient';
  
  // LOG OTP TO CONSOLE FOR DEVELOPMENT (especially helpful on restricted networks)
  console.log('----------------------------------------------------');
  console.log(`[AUTH] Generating ${type.toUpperCase()} OTP for ${email} (${role})`);
  console.log(`[AUTH] VERIFICATION CODE IS: ${otp}`);
  console.log('----------------------------------------------------');

  let subject = `Your verification code — ProstoCalc ${subjectTag} Portal`;
  if (type === 'login') subject = `Login Verification code — ProstoCalc ${subjectTag} Portal`;
  if (type === 'signup') subject = `Welcome to ProstoCalc — Verify your account`;

  const mailOptions = {
    from:    `"ProstoCalc" <${process.env.EMAIL_USER}>`,
    to:      email,
    subject: subject,
    html:    buildEmailHTML(otp, role, type),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[MAIL] Email sent successfully to ${email}. MessageId: ${info.messageId}`);
    return { success: true };
  } catch (error) {
    console.error(`[MAIL] Failed to send email to ${email}: ${error.message}`);
    // Still return success false, but the OTP is logged above
    return { success: false, error: error.message };
  }
};

module.exports = { sendOTP };

module.exports = { sendOTP };