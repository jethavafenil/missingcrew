import { env } from '@/lib/env'
import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
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
      ...(options.replyTo ? { replyTo: options.replyTo } : {}),
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

// --- Email templates -------------------------------------------------------

export function siteUrl(): string {
  return (env.NEXT_PUBLIC_SITE_URL || 'https://missingcrew.vercel.app').replace(/\/+$/, '')
}

// User-controlled text (names, project titles) is interpolated into HTML emails.
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function layout(title: string, bodyHtml: string, cta?: { label: string; href: string }) {
  const button = cta
    ? `<a href="${cta.href}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">${escapeHtml(cta.label)}</a>`
    : ''
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #2563eb;">${escapeHtml(title)}</h2>
      ${bodyHtml}
      ${button}
      <p>Best regards,<br/>The MissingCrew Team</p>
    </div>
  `
}

export function createApplicationEmail(employerEmail: string, crewName: string, projectName: string, crewEmail: string) {
  const subject = `New Application: ${crewName} applied to your project ${projectName}`;
  const name = escapeHtml(crewName)
  const project = escapeHtml(projectName)
  const html = layout('New Application Received', `
      <p>Hello,</p>
      <p>${name} (${escapeHtml(crewEmail)}) has applied to your project: <strong>${project}</strong>.</p>
      <div style="margin: 20px 0; padding: 15px; background-color: #f3f4f6; border-radius: 6px;">
        <h3 style="margin-top: 0;">Application Details</h3>
        <p><strong>Applicant:</strong> ${name}</p>
        <p><strong>Email:</strong> ${escapeHtml(crewEmail)}</p>
        <p><strong>Project:</strong> ${project}</p>
      </div>
      <p>You can review the application and contact the crew member through the MissingCrew platform.</p>`,
    { label: 'Go to Dashboard', href: `${siteUrl()}/employer/dashboard` })
  return { subject, html };
}

// #22 — crew is told they were shortlisted.
export function createShortlistEmail(crewName: string, employerName: string, projectName: string) {
  const subject = `You've been shortlisted for ${projectName}`
  const html = layout('Great news — you have been shortlisted!', `
      <p>Hi ${escapeHtml(crewName)},</p>
      <p><strong>${escapeHtml(employerName)}</strong> has shortlisted you for <strong>${escapeHtml(projectName)}</strong>.</p>
      <p>Keep your profile up to date and your availability current — the producer may reach out to you soon.</p>`,
    { label: 'View my applications', href: `${siteUrl()}/dashboard?tab=applications` })
  return { subject, html }
}

// #23 email 1 — sent when a producer posts a project.
export function createProjectLiveEmail(employerName: string, projectName: string) {
  const subject = `Your project "${projectName}" is live on MissingCrew`
  const html = layout('Your project is live', `
      <p>Hi ${escapeHtml(employerName)},</p>
      <p>Your project <strong>${escapeHtml(projectName)}</strong> is now visible to crew members on MissingCrew.</p>
      <p>As applications arrive you can review each applicant, view their profile and shortlist the best fits from your dashboard.</p>`,
    { label: 'Review applications', href: `${siteUrl()}/employer/dashboard` })
  return { subject, html }
}

// #23 email 2 — sent once the project reaches 5 applications.
export function createApplicationsMilestoneEmail(employerName: string, projectName: string, count: number) {
  const subject = `${count} crew members have applied to "${projectName}"`
  const html = layout(`${count} applications received`, `
      <p>Hi ${escapeHtml(employerName)},</p>
      <p>Your project <strong>${escapeHtml(projectName)}</strong> has received <strong>${count} applications</strong>.</p>
      <p>Now is a great time to review the applicants and shortlist the ones you like before they get booked elsewhere.</p>`,
    { label: 'Review applicants', href: `${siteUrl()}/employer/dashboard` })
  return { subject, html }
}

// Hire flow: the crew member is asked to join a project.
export function createHireRequestEmail(crewName: string, producerName: string, projectName: string, role: string | null, message: string) {
  const subject = `${producerName} wants to hire you for ${projectName}`
  const html = layout('You have a new hire request', `
      <p>Hi ${escapeHtml(crewName)},</p>
      <p><strong>${escapeHtml(producerName)}</strong> would like to hire you${role ? ` as <strong>${escapeHtml(role)}</strong>` : ''} for <strong>${escapeHtml(projectName)}</strong>.</p>
      <blockquote style="margin: 16px 0; padding: 12px 16px; background-color: #f3f4f6; border-left: 4px solid #2563eb; white-space: pre-wrap;">${escapeHtml(message)}</blockquote>
      <p>Open your dashboard to accept or decline the request.</p>`,
    { label: 'Review hire request', href: `${siteUrl()}/dashboard?tab=requests` })
  return { subject, html }
}

// Producer -> crew direct message (reply goes to the producer through Reply-To).
export function createDirectMessageEmail(crewName: string, producerName: string, message: string) {
  const subject = `${producerName} sent you a message on MissingCrew`
  const html = layout('You have a new message', `
      <p>Hi ${escapeHtml(crewName)},</p>
      <p><strong>${escapeHtml(producerName)}</strong> sent you a message:</p>
      <blockquote style="margin: 16px 0; padding: 12px 16px; background-color: #f3f4f6; border-left: 4px solid #2563eb; white-space: pre-wrap;">${escapeHtml(message)}</blockquote>
      <p>Reply to this email to answer them directly.</p>`,
    { label: 'Open MissingCrew', href: `${siteUrl()}/dashboard` })
  return { subject, html }
}

// Hire flow: the producer hears the crew member's answer.
export function createHireResponseEmail(producerName: string, crewName: string, projectName: string, accepted: boolean) {
  const subject = accepted
    ? `${crewName} accepted your hire request for ${projectName}`
    : `${crewName} declined your hire request for ${projectName}`
  const html = layout(accepted ? 'Hire request accepted' : 'Hire request declined', `
      <p>Hi ${escapeHtml(producerName)},</p>
      <p><strong>${escapeHtml(crewName)}</strong> has <strong>${accepted ? 'accepted' : 'declined'}</strong> your hire request for <strong>${escapeHtml(projectName)}</strong>.</p>
      ${accepted ? '<p>They are now confirmed on the project and the credit will appear on their profile.</p>' : '<p>You can browse more crew members and send another request.</p>'}`,
    { label: accepted ? 'Open dashboard' : 'Browse crew', href: `${siteUrl()}${accepted ? '/employer/dashboard' : '/browse-crew'}` })
  return { subject, html }
}
