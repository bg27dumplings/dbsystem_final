import { getDbPool } from "@/lib/db";

// Generate a random 6-digit verification code
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store verification code in the database
export async function saveVerificationCode(email: string, code: string) {
  const pool = getDbPool();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
  
  await pool.execute(
    `INSERT INTO email_verifications (email, code, expires_at)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE code = VALUES(code), expires_at = VALUES(expires_at)`,
    [email, code, expiresAt]
  );
}

// Send the code to the user's email
export async function sendVerificationEmail(email: string, code: string): Promise<{ ok: boolean; error?: string }> {
  console.log(`
============================================================
[EMAIL VERIFICATION] Send to: ${email}
Verification Code: ${code}
============================================================
`);

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpUser || !smtpPass) {
    console.log("[SMTP] No SMTP credentials in env. Simulation mode. Code logged above.");
    return { ok: true }; // simulation success
  }

  try {
    const { default: nodemailer } = await import("nodemailer");
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_SECURE !== "false", // default true
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    await transporter.sendMail({
      from: `"${process.env.NEXT_PUBLIC_APP_NAME || "Campus Share"}" <${smtpUser}>`,
      to: email,
      subject: `校園共享平台 - 驗證碼 [${code}]`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #2f5a4f; margin-bottom: 20px;">歡迎使用校園共享平台</h2>
          <p>您好，以下是您的帳號驗證碼：</p>
          <div style="background-color: #f8f1d6; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #10231f; font-family: monospace;">${code}</span>
          </div>
          <p style="color: #64748b; font-size: 14px;">此驗證碼將在 10 分鐘後過期。如果您沒有請求此信件，請忽略它。</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">此為系統自動發送的信件，請勿直接回覆。</p>
        </div>
      `
    });

    return { ok: true };
  } catch (error: any) {
    console.error("[SMTP] Failed to send email via nodemailer:", error);
    return { ok: false, error: error.message || "Failed to send email" };
  }
}
