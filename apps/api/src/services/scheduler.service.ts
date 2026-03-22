/**
 * Scheduling engine:
 *  - Generate available time slots for a doctor on a given date
 *  - Detect conflicts before booking
 */
import { prisma, type DayOfWeek, AppointmentStatus } from "@medflow/db";
import { UnprocessableError } from "../lib/errors.js";

const DAY_MAP: Record<number, DayOfWeek> = {
  0: "SUNDAY",
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
  6: "SATURDAY",
};

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

/**
 * Returns all possible time slots for a doctor on a specific date,
 * marking each as available or taken.
 */
export async function getDoctorSlots(
  doctorId: string,
  date: Date,
): Promise<TimeSlot[]> {
  const dayOfWeek = DAY_MAP[date.getDay()];
  if (!dayOfWeek) return [];

  // Get the doctor's availability rule for this day
  const availability = await prisma.doctorAvailability.findUnique({
    where: { doctorId_dayOfWeek: { doctorId, dayOfWeek } },
  });
  if (!availability) return [];

  // Check if the doctor has time off covering this date
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const timeOff = await prisma.doctorTimeOff.findFirst({
    where: {
      doctorId,
      startDate: { lte: endOfDay },
      endDate: { gte: startOfDay },
    },
  });
  if (timeOff) return [];

  // Get existing confirmed/pending appointments
  const existing = await prisma.appointment.findMany({
    where: {
      doctorId,
      scheduledAt: { gte: startOfDay, lte: endOfDay },
      status: {
        in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
      },
    },
    select: { scheduledAt: true, durationMinutes: true },
  });

  // Build the slot grid
  const [startHour, startMin] = availability.startTime.split(":").map(Number);
  const [endHour, endMin] = availability.endTime.split(":").map(Number);
  const slotDuration = availability.slotDuration;

  const slots: TimeSlot[] = [];
  const cursor = new Date(date);
  cursor.setHours(startHour ?? 9, startMin ?? 0, 0, 0);

  const endCursor = new Date(date);
  endCursor.setHours(endHour ?? 17, endMin ?? 0, 0, 0);

  while (cursor < endCursor) {
    const slotStart = new Date(cursor);
    const slotEnd = new Date(cursor.getTime() + slotDuration * 60 * 1000);

    if (slotEnd > endCursor) break;

    const isBooked = existing.some((appt) => {
      const apptStart = appt.scheduledAt;
      const apptEnd = new Date(
        apptStart.getTime() + appt.durationMinutes * 60 * 1000,
      );
      return slotStart < apptEnd && slotEnd > apptStart;
    });

    const isPast = slotStart <= new Date();

    slots.push({ start: slotStart, end: slotEnd, available: !isBooked && !isPast });
    cursor.setTime(cursor.getTime() + slotDuration * 60 * 1000);
  }

  return slots;
}

/**
 * Checks if a specific datetime conflicts with existing appointments.
 * Throws if there is a conflict.
 */
export async function assertNoConflict(
  doctorId: string,
  scheduledAt: Date,
  durationMinutes: number,
  excludeAppointmentId?: string,
): Promise<void> {
  const slotEnd = new Date(scheduledAt.getTime() + durationMinutes * 60 * 1000);

  const conflict = await prisma.appointment.findFirst({
    where: {
      doctorId,
      ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
      status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
      AND: [
        { scheduledAt: { lt: slotEnd } },
        {
          // scheduledAt + duration > requested scheduledAt
          // Prisma doesn't support computed fields in where, so we check overlap
          // by fetching candidates and filtering in memory for the end boundary
          scheduledAt: {
            gt: new Date(scheduledAt.getTime() - 24 * 60 * 60 * 1000), // within 24h window
          },
        },
      ],
    },
    select: { id: true, scheduledAt: true, durationMinutes: true },
  });

  if (conflict) {
    const conflictEnd = new Date(
      conflict.scheduledAt.getTime() + conflict.durationMinutes * 60 * 1000,
    );
    const overlaps =
      scheduledAt < conflictEnd && slotEnd > conflict.scheduledAt;
    if (overlaps) {
      throw new UnprocessableError(
        "This time slot is no longer available. Please choose another slot.",
      );
    }
  }
}

/**
 * Validates the requested slot falls within the doctor's defined availability.
 */
export async function assertWithinAvailability(
  doctorId: string,
  scheduledAt: Date,
  durationMinutes: number,
): Promise<void> {
  const dayOfWeek = DAY_MAP[scheduledAt.getDay()];
  if (!dayOfWeek) {
    throw new UnprocessableError("Doctor is not available on this day");
  }

  const availability = await prisma.doctorAvailability.findUnique({
    where: { doctorId_dayOfWeek: { doctorId, dayOfWeek } },
  });

  if (!availability) {
    throw new UnprocessableError("Doctor is not available on this day");
  }

  const [sh, sm] = availability.startTime.split(":").map(Number);
  const [eh, em] = availability.endTime.split(":").map(Number);

  const dayStart = new Date(scheduledAt);
  dayStart.setHours(sh ?? 9, sm ?? 0, 0, 0);

  const dayEnd = new Date(scheduledAt);
  dayEnd.setHours(eh ?? 17, em ?? 0, 0, 0);

  const slotEnd = new Date(scheduledAt.getTime() + durationMinutes * 60 * 1000);

  if (scheduledAt < dayStart || slotEnd > dayEnd) {
    throw new UnprocessableError(
      `Doctor is only available between ${availability.startTime} and ${availability.endTime}`,
    );
  }

  // Check time off
  const timeOff = await prisma.doctorTimeOff.findFirst({
    where: {
      doctorId,
      startDate: { lte: scheduledAt },
      endDate: { gte: scheduledAt },
    },
  });

  if (timeOff) {
    throw new UnprocessableError("Doctor is on time off for this period");
  }
}
