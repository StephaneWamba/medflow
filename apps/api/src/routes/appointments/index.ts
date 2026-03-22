import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { UserRole, prisma, AppointmentStatus } from "@medflow/db";
import * as appointmentService from "../../services/appointment.service.js";
import { getDoctorSlots } from "../../services/scheduler.service.js";
import { ForbiddenError, NotFoundError } from "../../lib/errors.js";

export default async function appointmentRoutes(app: FastifyInstance) {
  // GET /appointments — list appointments for the authenticated user
  app.get("/", async (request) => {
    await request.authenticate();
    const { user } = request;

    const query = z
      .object({
        status: z.nativeEnum(AppointmentStatus).optional(),
        from: z.string().datetime().optional(),
        to: z.string().datetime().optional(),
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(20),
      })
      .parse(request.query);

    const skip = (query.page - 1) * query.limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.from || query.to) {
      where.scheduledAt = {};
      if (query.from) where.scheduledAt.gte = new Date(query.from);
      if (query.to) where.scheduledAt.lte = new Date(query.to);
    }

    if (user.role === UserRole.PATIENT) where.patientId = user.profileId;
    else if (user.role === UserRole.DOCTOR) where.doctorId = user.profileId;
    // Admin sees all

    const [appointments, total] = await prisma.$transaction([
      prisma.appointment.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { scheduledAt: "asc" },
        include: {
          doctor: { select: { firstName: true, lastName: true, specialty: true } },
          patient: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.appointment.count({ where }),
    ]);

    return { appointments, total, page: query.page, limit: query.limit };
  });

  // GET /appointments/slots — available slots for a doctor on a date
  app.get("/slots", async (request) => {
    await request.authenticate();

    const { doctorId, date } = z
      .object({
        doctorId: z.string().min(1),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      })
      .parse(request.query);

    const slots = await getDoctorSlots(doctorId, new Date(date));
    return { slots };
  });

  // GET /appointments/:id
  app.get("/:id", async (request) => {
    await request.authenticate();
    const { id } = z.object({ id: z.string() }).parse(request.params);

    const appt = await prisma.appointment.findUnique({
      where: { id },
      include: {
        doctor: { select: { firstName: true, lastName: true, specialty: true, profileImageUrl: true } },
        patient: { select: { firstName: true, lastName: true } },
        prescription: { include: { medications: true } },
        conversation: { select: { id: true } },
      },
    });

    if (!appt) throw new NotFoundError("Appointment", id);

    const { user } = request;
    const isParticipant =
      (user.role === UserRole.PATIENT && appt.patientId === user.profileId) ||
      (user.role === UserRole.DOCTOR && appt.doctorId === user.profileId) ||
      user.role === UserRole.ADMIN;

    if (!isParticipant) throw new ForbiddenError();

    return appt;
  });

  // POST /appointments — book
  app.post("/", async (request, reply) => {
    await request.authenticate();
    request.requireRole(UserRole.PATIENT);

    const body = z
      .object({
        doctorId: z.string().min(1),
        scheduledAt: z.string().datetime(),
        type: z.enum(["VIDEO", "IN_PERSON"]).default("VIDEO"),
        chiefComplaint: z.string().max(500).optional(),
        durationMinutes: z.number().int().min(15).default(30),
      })
      .parse(request.body);

    const appt = await appointmentService.bookAppointment(request.user, {
      ...body,
      scheduledAt: new Date(body.scheduledAt),
    });

    return reply.status(201).send(appt);
  });

  // PATCH /appointments/:id/confirm
  app.patch("/:id/confirm", async (request) => {
    await request.authenticate();
    request.requireRole(UserRole.DOCTOR, UserRole.ADMIN);
    const { id } = z.object({ id: z.string() }).parse(request.params);
    return appointmentService.confirmAppointment(id, request.user);
  });

  // PATCH /appointments/:id/cancel
  app.patch("/:id/cancel", async (request) => {
    await request.authenticate();
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const { reason } = z
      .object({ reason: z.string().max(500).optional() })
      .parse(request.body);
    return appointmentService.cancelAppointment(id, request.user, reason);
  });

  // PATCH /appointments/:id/complete
  app.patch("/:id/complete", async (request) => {
    await request.authenticate();
    request.requireRole(UserRole.DOCTOR);
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const { notes } = z
      .object({ notes: z.string().max(2000).optional() })
      .parse(request.body);
    return appointmentService.completeAppointment(id, request.user, notes);
  });

  // GET /appointments/:id/video-token
  app.get("/:id/video-token", async (request) => {
    await request.authenticate();
    const { id } = z.object({ id: z.string() }).parse(request.params);
    return appointmentService.getAppointmentVideoToken(id, request.user);
  });
}
