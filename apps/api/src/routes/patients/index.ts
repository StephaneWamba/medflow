import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, UserRole } from "@medflow/db";
import { ForbiddenError, NotFoundError } from "../../lib/errors.js";
import { audit } from "../../plugins/audit.js";

export default async function patientRoutes(app: FastifyInstance) {
  // GET /patients/me
  app.get("/me", async (request) => {
    await request.authenticate();
    request.requireRole(UserRole.PATIENT);

    const patient = await prisma.patient.findUnique({
      where: { userId: request.user.id },
      include: {
        user: { select: { email: true, emailVerified: true, createdAt: true } },
      },
    });

    if (!patient) throw new NotFoundError("Patient profile");
    return patient;
  });

  // PATCH /patients/me
  app.patch("/me", async (request) => {
    await request.authenticate();
    request.requireRole(UserRole.PATIENT);

    const body = z
      .object({
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        phoneNumber: z.string().optional(),
        bloodType: z
          .enum([
            "A_POSITIVE","A_NEGATIVE","B_POSITIVE","B_NEGATIVE",
            "AB_POSITIVE","AB_NEGATIVE","O_POSITIVE","O_NEGATIVE","UNKNOWN",
          ])
          .optional(),
        allergies: z.array(z.string()).optional(),
        chronicConditions: z.array(z.string()).optional(),
        emergencyContact: z
          .object({ name: z.string(), relationship: z.string(), phone: z.string() })
          .optional(),
        address: z
          .object({
            street: z.string(),
            city: z.string(),
            state: z.string(),
            country: z.string(),
            zip: z.string(),
          })
          .optional(),
      })
      .parse(request.body);

    const updated = await prisma.patient.update({
      where: { userId: request.user.id },
      data: body,
    });

    await audit({
      userId: request.user.id,
      action: "UPDATE",
      resourceType: "Patient",
      resourceId: updated.id,
      metadata: { fields: Object.keys(body) },
    });

    return updated;
  });

  // GET /patients/:id — doctor or admin only
  app.get("/:id", async (request) => {
    await request.authenticate();
    request.requireRole(UserRole.DOCTOR, UserRole.ADMIN);

    const { id } = z.object({ id: z.string() }).parse(request.params);

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, emailVerified: true, createdAt: true } },
      },
    });

    if (!patient) throw new NotFoundError("Patient", id);

    await audit({
      userId: request.user.id,
      action: "RECORD_ACCESSED",
      resourceType: "Patient",
      resourceId: id,
    });

    return patient;
  });
}
