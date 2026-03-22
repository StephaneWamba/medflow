import { prisma, AppointmentStatus, UserRole } from "@medflow/db";
import { broadcastAppointmentUpdate } from "../realtime/socket.server.js";
import {
  NotFoundError,
  ForbiddenError,
  UnprocessableError,
} from "../lib/errors.js";
import { assertNoConflict, assertWithinAvailability } from "./scheduler.service.js";
import { audit } from "../plugins/audit.js";
import { scheduleAppointmentReminders, cancelReminders } from "../jobs/reminder.job.js";
import { createRoom, deleteRoom } from "../lib/livekit.js";
import { emailQueue, notificationQueue } from "../jobs/queues.js";
import { randomBytes } from "crypto";
import type { AuthUser } from "../types/auth.js";

export async function bookAppointment(
  actor: AuthUser,
  data: {
    doctorId: string;
    scheduledAt: Date;
    durationMinutes?: number;
    type?: string;
    chiefComplaint?: string;
  },
) {
  const patientId = actor.profileId;
  if (!patientId) throw new UnprocessableError("Patient profile not found");

  const doctor = await prisma.doctor.findUnique({
    where: { id: data.doctorId },
    select: { id: true, isVerified: true, isAcceptingNew: true },
  });
  if (!doctor) throw new NotFoundError("Doctor", data.doctorId);
  if (!doctor.isVerified) throw new UnprocessableError("Doctor is not yet verified");
  if (!doctor.isAcceptingNew) throw new UnprocessableError("Doctor is not accepting new patients");

  const scheduledAt = data.scheduledAt;
  const duration = data.durationMinutes ?? 30;

  // Must be at least 2 hours in the future
  const minAdvance = new Date(Date.now() + 2 * 60 * 60 * 1000);
  if (scheduledAt < minAdvance) {
    throw new UnprocessableError("Appointments must be booked at least 2 hours in advance");
  }

  await assertWithinAvailability(data.doctorId, scheduledAt, duration);
  await assertNoConflict(data.doctorId, scheduledAt, duration);

  const appointment = await prisma.appointment.create({
    data: {
      patientId,
      doctorId: data.doctorId,
      scheduledAt,
      durationMinutes: duration,
      type: (data.type as any) ?? "VIDEO",
      chiefComplaint: data.chiefComplaint,
      status: AppointmentStatus.PENDING,
    },
    include: {
      doctor: { select: { firstName: true, lastName: true } },
      patient: { select: { firstName: true, lastName: true } },
    },
  });

  // Schedule reminders
  await scheduleAppointmentReminders(appointment.id, scheduledAt);

  await audit({
    userId: actor.id,
    action: "APPOINTMENT_BOOKED",
    resourceType: "Appointment",
    resourceId: appointment.id,
    metadata: { doctorId: data.doctorId, scheduledAt: scheduledAt.toISOString() },
  });

  // Notify doctor of new booking + confirm receipt to patient (non-blocking)
  prisma.doctor.findUnique({ where: { id: data.doctorId }, select: { userId: true, firstName: true, lastName: true } })
    .then((d) => {
      if (!d) return;
      notificationQueue.add("appointment-booked", {
        userId: d.userId,
        title: "New appointment request",
        body: `${appointment.patient.firstName} ${appointment.patient.lastName} has requested an appointment.`,
        type: "appointment_booked",
        data: { appointmentId: appointment.id },
      }).catch(() => {});
      notificationQueue.add("appointment-booked-receipt", {
        userId: actor.id,
        title: "Appointment request sent",
        body: `Your request with Dr. ${d.firstName} ${d.lastName} is awaiting confirmation.`,
        type: "appointment_booked_receipt",
        data: { appointmentId: appointment.id },
      }).catch(() => {});
    })
    .catch(() => {});

  return appointment;
}

export async function confirmAppointment(appointmentId: string, actor: AuthUser) {
  const appt = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appt) throw new NotFoundError("Appointment", appointmentId);

  // Only the doctor of this appointment can confirm
  if (actor.role === UserRole.DOCTOR && appt.doctorId !== actor.profileId) {
    throw new ForbiddenError();
  }

  if (appt.status !== AppointmentStatus.PENDING) {
    throw new UnprocessableError(`Cannot confirm an appointment in status: ${appt.status}`);
  }

  // Create LiveKit room for video appointments
  let videoRoomName: string | undefined;
  if (appt.type === "VIDEO") {
    videoRoomName = `appt_${appointmentId}_${randomBytes(4).toString("hex")}`;
    await createRoom(videoRoomName);
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: AppointmentStatus.CONFIRMED,
      videoRoomName,
    },
    include: {
      patient: { select: { userId: true, firstName: true, lastName: true, user: { select: { email: true } } } },
      doctor: { select: { userId: true, firstName: true, lastName: true } },
    },
  });

  // Create a conversation for this appointment and add both participants
  const conversation = await prisma.conversation.upsert({
    where: { appointmentId },
    create: { appointmentId },
    update: {},
  });
  await Promise.all([
    prisma.conversationParticipant.upsert({
      where: { conversationId_userId: { conversationId: conversation.id, userId: updated.patient.userId } },
      create: { conversationId: conversation.id, userId: updated.patient.userId },
      update: {},
    }),
    prisma.conversationParticipant.upsert({
      where: { conversationId_userId: { conversationId: conversation.id, userId: updated.doctor.userId } },
      create: { conversationId: conversation.id, userId: updated.doctor.userId },
      update: {},
    }),
  ]);

  await audit({
    userId: actor.id,
    action: "UPDATE",
    resourceType: "Appointment",
    resourceId: appointmentId,
    metadata: { status: { from: "PENDING", to: "CONFIRMED" } },
  });

  // Broadcast status update to both participants (non-blocking)
  broadcastAppointmentUpdate(updated.patient.userId, updated.doctor.userId, {
    appointmentId,
    status: AppointmentStatus.CONFIRMED,
    videoRoomName: updated.videoRoomName ?? undefined,
  });

  // Persist in-app notification for patient (non-blocking)
  notificationQueue.add("appointment-confirmed", {
    userId: updated.patient.userId,
    title: "Appointment confirmed",
    body: `Your appointment with Dr. ${updated.doctor.firstName} ${updated.doctor.lastName} has been confirmed.`,
    type: "appointment_confirmed",
    data: { appointmentId },
  }).catch((err) => console.error("Failed to enqueue appointment-confirmed notification:", err));

  // Send confirmation email to patient (non-blocking)
  emailQueue.add("appointment-confirmed", {
    to: updated.patient.user.email,
    data: {
      patientFirstName: updated.patient.firstName,
      doctorName: `Dr. ${updated.doctor.firstName} ${updated.doctor.lastName}`,
      scheduledAt: updated.scheduledAt.toISOString(),
      appointmentId,
      type: updated.type,
    },
  }).catch((err) => console.error("Failed to enqueue appointment-confirmed email:", err));

  return updated;
}

export async function cancelAppointment(
  appointmentId: string,
  actor: AuthUser,
  reason?: string,
) {
  const appt = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appt) throw new NotFoundError("Appointment", appointmentId);

  // Patients can only cancel their own
  if (actor.role === UserRole.PATIENT && appt.patientId !== actor.profileId) {
    throw new ForbiddenError();
  }
  // Doctors can only cancel their own
  if (actor.role === UserRole.DOCTOR && appt.doctorId !== actor.profileId) {
    throw new ForbiddenError();
  }

  if (
    appt.status === AppointmentStatus.CANCELLED ||
    appt.status === AppointmentStatus.COMPLETED
  ) {
    throw new UnprocessableError(`Appointment already ${appt.status.toLowerCase()}`);
  }

  // Cancel BullMQ reminder jobs
  await cancelReminders(appointmentId);

  // Delete LiveKit room if it was created
  if (appt.videoRoomName) {
    try {
      await deleteRoom(appt.videoRoomName);
    } catch {
      // Non-fatal
    }
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: AppointmentStatus.CANCELLED,
      cancelReason: reason,
      cancelledBy: actor.id,
    },
  });

  await audit({
    userId: actor.id,
    action: "APPOINTMENT_CANCELLED",
    resourceType: "Appointment",
    resourceId: appointmentId,
    metadata: { reason },
  });

  // Broadcast and notify both participants (non-blocking, best-effort)
  prisma.patient.findUnique({ where: { id: appt.patientId }, select: { userId: true, firstName: true } })
    .then((p) => prisma.doctor.findUnique({ where: { id: appt.doctorId }, select: { userId: true, firstName: true, lastName: true } })
      .then((d) => {
        if (!p || !d) return;
        broadcastAppointmentUpdate(p.userId, d.userId, { appointmentId, status: AppointmentStatus.CANCELLED, reason });
        // Notify the other party (not the one who cancelled)
        const notifyUserId = actor.id === p.userId ? d.userId : p.userId;
        const cancellerLabel = actor.id === p.userId ? `${p.firstName}` : `Dr. ${d.firstName} ${d.lastName}`;
        notificationQueue.add("appointment-cancelled", {
          userId: notifyUserId,
          title: "Appointment cancelled",
          body: `Your appointment has been cancelled${reason ? `: ${reason}` : ""}.`,
          type: "appointment_cancelled",
          data: { appointmentId, cancelledBy: cancellerLabel },
        }).catch(() => {});
      }))
    .catch(() => {});

  return updated;
}

export async function completeAppointment(
  appointmentId: string,
  actor: AuthUser,
  notes?: string,
) {
  const appt = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appt) throw new NotFoundError("Appointment", appointmentId);

  if (actor.role === UserRole.DOCTOR && appt.doctorId !== actor.profileId) {
    throw new ForbiddenError();
  }

  if (appt.status !== AppointmentStatus.CONFIRMED) {
    throw new UnprocessableError("Only confirmed appointments can be completed");
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: AppointmentStatus.COMPLETED, notes },
  });

  await audit({
    userId: actor.id,
    action: "UPDATE",
    resourceType: "Appointment",
    resourceId: appointmentId,
    metadata: { status: { from: "CONFIRMED", to: "COMPLETED" } },
  });

  // Broadcast completion and notify patient (non-blocking, best-effort)
  prisma.patient.findUnique({ where: { id: appt.patientId }, select: { userId: true, firstName: true } })
    .then((p) => prisma.doctor.findUnique({ where: { id: appt.doctorId }, select: { userId: true, firstName: true, lastName: true } })
      .then((d) => {
        if (!p || !d) return;
        broadcastAppointmentUpdate(p.userId, d.userId, { appointmentId, status: AppointmentStatus.COMPLETED });
        notificationQueue.add("appointment-completed", {
          userId: p.userId,
          title: "Appointment completed",
          body: `Your appointment with Dr. ${d.firstName} ${d.lastName} has been marked as completed.`,
          type: "appointment_completed",
          data: { appointmentId },
        }).catch(() => {});
      }))
    .catch(() => {});

  return updated;
}

export async function getAppointmentVideoToken(
  appointmentId: string,
  actor: AuthUser,
) {
  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: { select: { firstName: true, lastName: true } },
      doctor: { select: { firstName: true, lastName: true } },
    },
  });
  if (!appt) throw new NotFoundError("Appointment", appointmentId);

  // Only participant of this appointment
  const isParticipant =
    (actor.role === UserRole.PATIENT && appt.patientId === actor.profileId) ||
    (actor.role === UserRole.DOCTOR && appt.doctorId === actor.profileId);

  if (!isParticipant) throw new ForbiddenError();

  if (appt.status !== AppointmentStatus.CONFIRMED) {
    throw new UnprocessableError("Video is only available for confirmed appointments");
  }

  if (!appt.videoRoomName) {
    throw new UnprocessableError("Video room not yet created");
  }

  const { createVideoToken } = await import("../lib/livekit.js");

  let displayName: string;
  if (actor.role === UserRole.PATIENT) {
    displayName = `${appt.patient.firstName} ${appt.patient.lastName}`;
  } else {
    displayName = `Dr. ${appt.doctor.firstName} ${appt.doctor.lastName}`;
  }

  const token = await createVideoToken({
    roomName: appt.videoRoomName,
    participantIdentity: actor.id,
    participantName: displayName,
  });

  await audit({
    userId: actor.id,
    action: "VIDEO_SESSION_STARTED",
    resourceType: "Appointment",
    resourceId: appointmentId,
  });

  return { token, roomName: appt.videoRoomName, livekitUrl: process.env["LIVEKIT_URL"] };
}
