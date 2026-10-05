import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter = null;

/**
 * Returns a singleton Nodemailer transporter or null if unconfigured
 */
export const getTransporter = () => {
  if (transporter) return transporter;

  const isConfigured = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD);
  if (!isConfigured) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASSWORD,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  return transporter;
};

/**
 * Verify SMTP connection safely during backend startup (never exposes secrets)
 */
export const verifySmtpConnection = async () => {
  const isConfigured = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD);
  if (!isConfigured) {
    console.log('[SMTP] SMTP credentials not configured in backend/.env (SMTP_USER or SMTP_PASSWORD missing)');
    return false;
  }

  try {
    const t = getTransporter();
    await t.verify();
    console.log('[SMTP] SMTP connection ready');
    return true;
  } catch (error) {
    console.error(`[SMTP] SMTP connection failed: ${error.message || 'Verification error'}`);
    return false;
  }
};

/**
 * Generates responsive Sandstone HTML template for Password Reset OTP
 */
export const buildOtpEmailHtml = ({ recipientName = 'Team Member', otp, expiryMinutes = 10 }) => {
  const formattedOtp = otp.toString().split('').join(' ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ApexPOS Password Reset</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1F2937;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FAF7F2; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #FFFFFF; border: 1px solid #E5D8C6; border-radius: 20px; box-shadow: 0 10px 30px rgba(41, 35, 31, 0.06); overflow: hidden;">
          
          <!-- Header Banner -->
          <tr>
            <td style="padding: 36px 36px 24px 36px; text-align: center; border-bottom: 1px solid #F3ECE1; background: linear-gradient(180deg, #FFFFFF 0%, #FDFBF8 100%);">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" style="margin: 0 auto 14px auto;">
                <tr>
                  <td style="background: linear-gradient(135deg, #92400E, #D97706); width: 48px; height: 48px; border-radius: 14px; text-align: center; vertical-align: middle; color: #FFFFFF; font-size: 22px; font-weight: bold; box-shadow: 0 6px 16px rgba(146, 64, 14, 0.25);">
                    &#127860;
                  </td>
                </tr>
              </table>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #1F2937; letter-spacing: -0.5px;">ApexPOS</h1>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #5B6470; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Restaurant Management System</p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 36px 28px 36px;">
              <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: #1F2937;">Password Reset Verification Code</h2>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #4B5563;">
                Hello <strong>${recipientName}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #4B5563;">
                We received a request to reset your ApexPOS account password. Use the single-use verification code below to proceed:
              </p>

              <!-- OTP Highlight Box -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 0 0 26px 0;">
                <tr>
                  <td style="background-color: #FAF7F2; border: 2px dashed #92400E; border-radius: 14px; padding: 22px; text-align: center;">
                    <span style="font-family: 'Courier New', Courier, monospace, monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #92400E; display: inline-block; padding-left: 10px;">
                      ${otp}
                    </span>
                    <p style="margin: 10px 0 0 0; font-size: 12px; color: #78350F; font-weight: 600;">
                      &#9201; Expires in ${expiryMinutes} minutes
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Security Advisory -->
              <div style="background-color: #FEF3C7; border-left: 4px solid #D97706; border-radius: 6px; padding: 12px 14px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #92400E;">
                  <strong>Security Reminder:</strong> Never share this code with anyone. ApexPOS staff will never ask for your verification code.
                </p>
              </div>

              <p style="margin: 0 0 20px 0; font-size: 13px; line-height: 1.6; color: #5B6470;">
                If you did not request a password reset, you can safely ignore this email. Your existing password will remain secure and unchanged.
              </p>

              <p style="margin: 24px 0 0 0; font-size: 13px; line-height: 1.5; color: #4B5563;">
                Regards,<br />
                <strong style="color: #1F2937;">The ApexPOS Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 36px; background-color: #FAF7F2; border-top: 1px solid #E5D8C6; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #8C7E72; line-height: 1.5;">
                This automated message was sent by ApexPOS Terminal Security.<br />
                &copy; ${new Date().getFullYear()} ApexPOS. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

/**
 * Sends the Password Reset OTP email through configured SMTP
 */
export const sendPasswordResetOtpEmail = async ({ to, recipientName = 'ApexPOS User', otp }) => {
  const t = getTransporter();

  if (!t) {
    if (env.NODE_ENV !== 'production') {
      console.log(`[SMTP DEV MODE] Verification code for ${to}: [${otp}] (Configure SMTP_USER & SMTP_PASSWORD in backend/.env for real SMTP relay)`);
      return { messageId: 'dev-smtp-preview', accepted: [to] };
    }
    const error = new Error('SMTP service is not configured. Please define SMTP_USER and SMTP_PASSWORD in backend/.env');
    error.statusCode = 503;
    throw error;
  }

  const fromEmail = env.SMTP_FROM_EMAIL || env.SMTP_USER;
  const fromName = env.SMTP_FROM_NAME || 'ApexPOS';

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject: 'ApexPOS Password Reset Verification Code',
    text: `Hello ${recipientName},

We received a request to reset your ApexPOS account password.

Your verification code is: ${otp}

This code will expire in 10 minutes.

If you did not request a password reset, you can safely ignore this email.

Regards,
ApexPOS Team`,
    html: buildOtpEmailHtml({ recipientName, otp, expiryMinutes: 10 }),
  };

  try {
    const info = await t.sendMail(mailOptions);
    return {
      messageId: info.messageId,
      accepted: info.accepted,
    };
  } catch (error) {
    console.error('[SMTP Send Mail Error]:', error.message || error);
    const safeError = new Error('Failed to deliver verification code via email. Please verify SMTP configuration.');
    safeError.statusCode = 500;
    throw safeError;
  }
};

export default {
  getTransporter,
  verifySmtpConnection,
  buildOtpEmailHtml,
  sendPasswordResetOtpEmail,
};
