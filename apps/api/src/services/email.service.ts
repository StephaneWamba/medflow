import { Resend } from "resend";
import { env } from "../env.js";

export async function sendEmailVerification(
  email: string,
  token: string,
  firstName: string,
): Promise<void> {
  const resend = new Resend(env.RESEND_API_KEY);
  const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;

  try {
    await resend.emails.send({
      from: env.EMAIL_FROM,
      to: email,
      subject: "Verify your MedFlow email",
      html: `
        <p>Hi ${firstName},</p>
        <p>Please verify your MedFlow email address by clicking the link below:</p>
        <p><a href="${verifyUrl}">${verifyUrl}</a></p>
        <p>If you did not create a MedFlow account, you can safely ignore this email.</p>
      `,
    });
  } catch (err) {
    console.error("Failed to send email verification email:", err);
  }
}

export async function sendPasswordReset(
  email: string,
  token: string,
  firstName: string,
): Promise<void> {
  const resend = new Resend(env.RESEND_API_KEY);
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;

  try {
    await resend.emails.send({
      from: env.EMAIL_FROM,
      to: email,
      subject: "Reset your MedFlow password",
      html: `
        <p>Hi ${firstName},</p>
        <p>We received a request to reset your MedFlow password. Click the link below to set a new password:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link expires in 1 hour.</p>
        <p>If you did not request a password reset, you can safely ignore this email.</p>
      `,
    });
  } catch (err) {
    console.error("Failed to send password reset email:", err);
  }
}

export async function sendAppointmentReminder(
  to: string,
  data: {
    patientFirstName: string;
    doctorName: string;
    scheduledAt: string;
    appointmentId: string;
    type: string;
  },
): Promise<void> {
  const resend = new Resend(env.RESEND_API_KEY);
  const joinUrl = `${env.FRONTEND_URL}/appointments/${data.appointmentId}`;
  const isVideo = data.type === "VIDEO";

  try {
    await resend.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject: "Upcoming appointment reminder",
      html: `
        <p>Hi ${data.patientFirstName},</p>
        <p>This is a reminder about your upcoming appointment with ${data.doctorName}.</p>
        <ul>
          <li><strong>Date &amp; Time:</strong> ${data.scheduledAt}</li>
          <li><strong>Type:</strong> ${data.type === "VIDEO" ? "Video consultation" : "In-person visit"}</li>
          <li><strong>Doctor:</strong> ${data.doctorName}</li>
        </ul>
        ${isVideo ? `<p>Join your video appointment here: <a href="${joinUrl}">${joinUrl}</a></p>` : ""}
        <p>If you need to reschedule or cancel, please visit your MedFlow dashboard.</p>
      `,
    });
  } catch (err) {
    console.error("Failed to send appointment reminder email:", err);
  }
}

export async function sendDoctorVerificationStatus(
  email: string,
  firstName: string,
  isVerified: boolean,
): Promise<void> {
  const resend = new Resend(env.RESEND_API_KEY);
  const dashboardUrl = `${env.FRONTEND_URL}/dashboard`;

  try {
    await resend.emails.send({
      from: env.EMAIL_FROM,
      to: email,
      subject: isVerified ? "Your MedFlow account has been approved" : "MedFlow account status update",
      html: isVerified
        ? `
          <p>Hi Dr. ${firstName},</p>
          <p>Great news — your MedFlow doctor account has been <strong>approved</strong>.</p>
          <p>You can now set your availability and start accepting patient appointments.</p>
          <p><a href="${dashboardUrl}">Go to your dashboard</a></p>
        `
        : `
          <p>Hi Dr. ${firstName},</p>
          <p>Your MedFlow doctor account verification has been <strong>revoked</strong>.</p>
          <p>Please contact our support team if you believe this is a mistake.</p>
        `,
    });
  } catch (err) {
    console.error("Failed to send doctor verification email:", err);
  }
}

export async function sendAppointmentConfirmation(
  to: string,
  data: {
    patientFirstName: string;
    doctorName: string;
    scheduledAt: string;
    appointmentId: string;
    type: string;
  },
): Promise<void> {
  const resend = new Resend(env.RESEND_API_KEY);

  try {
    await resend.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject: "Appointment confirmed",
      html: `
        <p>Hi ${data.patientFirstName},</p>
        <p>Your appointment has been confirmed.</p>
        <ul>
          <li><strong>Date &amp; Time:</strong> ${data.scheduledAt}</li>
          <li><strong>Type:</strong> ${data.type === "VIDEO" ? "Video consultation" : "In-person visit"}</li>
          <li><strong>Doctor:</strong> ${data.doctorName}</li>
        </ul>
        <p>We look forward to seeing you. You can manage your appointment at any time from your MedFlow dashboard.</p>
      `,
    });
  } catch (err) {
    console.error("Failed to send appointment confirmation email:", err);
  }
}
