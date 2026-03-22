import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, UserRole, AppointmentStatus } from "@medflow/db";
import {
  ForbiddenError,
  NotFoundError,
  UnprocessableError,
} from "../../lib/errors.js";
import { audit } from "../../plugins/audit.js";

export default async function prescriptionRoutes(app: FastifyInstance) {
  // GET /prescriptions — patient sees own, doctor sees issued
  app.get("/", async (request) => {
    await request.authenticate();
    const { user } = request;

    const query = z
      .object({
        status: z.enum(["ACTIVE", "EXPIRED", "CANCELLED", "DISPENSED"]).optional(),
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(20),
      })
      .parse(request.query);

    const where: any = {};
    if (user.role === UserRole.PATIENT) where.patientId = user.profileId;
    else if (user.role === UserRole.DOCTOR) where.doctorId = user.profileId;

    if (query.status) where.status = query.status;

    const [prescriptions, total] = await prisma.$transaction([
      prisma.prescription.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { issuedAt: "desc" },
        include: {
          medications: true,
          doctor: { select: { firstName: true, lastName: true, specialty: true } },
          patient: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.prescription.count({ where }),
    ]);

    return { prescriptions, total, page: query.page, limit: query.limit };
  });

  // GET /prescriptions/:id
  app.get("/:id", async (request) => {
    await request.authenticate();
    const { id } = z.object({ id: z.string() }).parse(request.params);

    const rx = await prisma.prescription.findUnique({
      where: { id },
      include: {
        medications: true,
        doctor: { select: { firstName: true, lastName: true, specialty: true, licenseNumber: true } },
        patient: { select: { firstName: true, lastName: true, dateOfBirth: true } },
      },
    });

    if (!rx) throw new NotFoundError("Prescription", id);

    const { user } = request;
    const hasAccess =
      (user.role === UserRole.PATIENT && rx.patientId === user.profileId) ||
      (user.role === UserRole.DOCTOR && rx.doctorId === user.profileId) ||
      user.role === UserRole.ADMIN;

    if (!hasAccess) throw new ForbiddenError();

    await audit({
      userId: user.id,
      action: "RECORD_ACCESSED",
      resourceType: "Prescription",
      resourceId: id,
    });

    return rx;
  });

  // POST /prescriptions — doctors only, tied to an appointment
  app.post("/", async (request, reply) => {
    await request.authenticate();
    request.requireRole(UserRole.DOCTOR);

    const body = z
      .object({
        appointmentId: z.string().min(1),
        diagnosis: z.string().min(1).max(500),
        notes: z.string().optional(),
        expiresAt: z.string().datetime(),
        medications: z
          .array(
            z.object({
              medicationName: z.string().min(1),
              dosage: z.string().min(1),
              frequency: z.string().min(1),
              durationDays: z.number().int().positive(),
              refillsAllowed: z.number().int().min(0).max(5).default(0),
              instructions: z.string().optional(),
            }),
          )
          .min(1),
      })
      .parse(request.body);

    // Verify appointment belongs to this doctor and is completed
    const appt = await prisma.appointment.findUnique({
      where: { id: body.appointmentId },
      select: { doctorId: true, patientId: true, status: true },
    });

    if (!appt) throw new NotFoundError("Appointment", body.appointmentId);
    if (appt.doctorId !== request.user.profileId) throw new ForbiddenError();
    if (appt.status !== AppointmentStatus.CONFIRMED && appt.status !== AppointmentStatus.COMPLETED) {
      throw new UnprocessableError(
        "Prescriptions can only be written for confirmed or completed appointments",
      );
    }

    const existingRx = await prisma.prescription.findUnique({
      where: { appointmentId: body.appointmentId },
    });
    if (existingRx) {
      throw new UnprocessableError("A prescription already exists for this appointment");
    }

    const rx = await prisma.prescription.create({
      data: {
        appointmentId: body.appointmentId,
        doctorId: request.user.profileId!,
        patientId: appt.patientId,
        diagnosis: body.diagnosis,
        notes: body.notes,
        expiresAt: new Date(body.expiresAt),
        medications: { create: body.medications },
      },
      include: { medications: true },
    });

    await audit({
      userId: request.user.id,
      action: "PRESCRIPTION_ISSUED",
      resourceType: "Prescription",
      resourceId: rx.id,
      metadata: { patientId: appt.patientId, medicationCount: body.medications.length },
    });

    return reply.status(201).send(rx);
  });

  // PATCH /prescriptions/:id/status — doctor or admin
  app.patch("/:id/status", async (request) => {
    await request.authenticate();
    request.requireRole(UserRole.DOCTOR, UserRole.ADMIN);

    const { id } = z.object({ id: z.string() }).parse(request.params);
    const { status } = z
      .object({ status: z.enum(["ACTIVE", "EXPIRED", "CANCELLED", "DISPENSED"]) })
      .parse(request.body);

    const rx = await prisma.prescription.findUnique({ where: { id } });
    if (!rx) throw new NotFoundError("Prescription", id);

    if (request.user.role === UserRole.DOCTOR && rx.doctorId !== request.user.profileId) {
      throw new ForbiddenError();
    }

    const updated = await prisma.prescription.update({
      where: { id },
      data: { status: status as any },
    });

    await audit({
      userId: request.user.id,
      action: "UPDATE",
      resourceType: "Prescription",
      resourceId: id,
      metadata: { status: { from: rx.status, to: status } },
    });

    return updated;
  });
}
