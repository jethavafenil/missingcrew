import { env } from '@/lib/env'
import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions) {
  // Check if email configuration is available
  if (!env.EMAIL_HOST || !env.EMAIL_USER || !env.EMAIL_PASSWORD) {
    console.log('Email configuration not available, skipping email sending');
    return { success: false, error: 'Email configuration not available' };
  }

  try {
    // Create a transporter using SMTP
    const transporter = nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT,
      secure: env.EMAIL_SECURE === 'true',
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASSWORD,
      },
      // Add connection timeout
      connectionTimeout: 5000,
      // Add greeting timeout
      greetingTimeout: 5000,
    });

    // Email options
    const mailOptions = {
      from: env.EMAIL_FROM || 'noreply@missingcrew.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    // Send email with timeout
    const sendPromise = transporter.sendMail(mailOptions);

    // Set a timeout for the email sending
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Email sending timed out'));
      }, 10000); // 10 second timeout
    });

    // Race between sending and timeout
    try {
      const info = await Promise.race([sendPromise, timeoutPromise]);
      // Type assertion since we know the structure of the response
      const result = info as { messageId: string };
      console.log('Email sent:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Email sending failed:', error);
      return { success: false, error };
    }
  } catch (error) {
    console.error('Error sending email:', error);
    // Don't throw the error, just log it
    return { success: false, error };
  }

  // If we get here, email sending failed or timed out
  return { success: false, error: 'Email sending failed or timed out' };
}

export function createApplicationEmail(employerEmail: string, crewName: string, projectName: string, crewEmail: string) {
  const subject = `New Application: ${crewName} applied to your project ${projectName}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #2563eb;">New Application Received</h2>
      <p>Hello,</p>
      <p>${crewName} (${crewEmail}) has applied to your project: <strong>${projectName}</strong>.</p>

      <div style="margin: 20px 0; padding: 15px; background-color: #f3f4f6; border-radius: 6px;">
        <h3 style="margin-top: 0;">Application Details</h3>
        <p><strong>Applicant:</strong> ${crewName}</p>
        <p><strong>Email:</strong> ${crewEmail}</p>
        <p><strong>Project:</strong> ${projectName}</p>
      </div>

      <p>You can review the application and contact the crew member through the MissingCrew platform.</p>

      <a href="https://missingcrew.vercel.app/dashboard" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">
        Go to Dashboard
      </a>

      <p>Best regards,<br/>The MissingCrew Team</p>
    </div>
  `;

  return { subject, html };
}
