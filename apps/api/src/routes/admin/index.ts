import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, UserRole } from "@medflow/db";
import { NotFoundError } from "../../lib/errors.js";
import { audit } from "../../plugins/audit.js";
import { notificationQueue, emailQueue } from "../../jobs/queues.js";

export default async function adminRoutes(app: FastifyInstance) {
  // All admin routes require ADMIN role — enforced at the top level in app.ts
  app.addHook("preHandler", async (request) => {
    await request.authenticate();
    request.requireRole(UserRole.ADMIN);
  });

  // GET /admin/users
  app.get("/users", async (request) => {
    const query = z
      .object({
        role: z.nativeEnum(UserRole).optional(),
        isActive: z
          .string()
          .transform((v) => v === "true")
          .optional(),
        search: z.string().optional(),
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(20),
      })
      .parse(request.query);

    const where: any = {};
    if (query.role) where.role = query.role;
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.search) {
      where.email = { contains: query.search, mode: "insensitive" };
    }

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          patient: { select: { firstName: true, lastName: true } },
          doctor: { select: { firstName: true, lastName: true, specialty: true, isVerified: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total, page: query.page, limit: query.limit };
  });

  // PATCH /admin/users/:id/activate
  app.patch("/users/:id/activate", async (request) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const { isActive } = z
      .object({ isActive: z.boolean() })
      .parse(request.body);

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError("User", id);

    await prisma.user.update({ where: { id }, data: { isActive } });

    await audit({
      userId: request.user.id,
      action: "UPDATE",
      resourceType: "User",
      resourceId: id,
      metadata: { isActive },
    });

    return { message: `User ${isActive ? "activated" : "deactivated"}` };
  });

  // GET /admin/doctors
  app.get("/doctors", async (request) => {
    const query = z
      .object({
        isVerified: z.string().transform((v) => v === "true").optional(),
        search: z.string().optional(),
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(20),
      })
      .parse(request.query);

    const where: any = {};
    if (query.isVerified !== undefined) where.isVerified = query.isVerified;
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: "insensitive" } },
        { lastName: { contains: query.search, mode: "insensitive" } },
        { licenseNumber: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [doctors, total] = await prisma.$transaction([
      prisma.doctor.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          specialty: true,
          licenseNumber: true,
          isVerified: true,
          yearsExperience: true,
          rating: true,
          reviewCount: true,
          createdAt: true,
          user: { select: { id: true, email: true, createdAt: true } },
        },
      }),
      prisma.doctor.count({ where }),
    ]);

    return { doctors, total, page: query.page, limit: query.limit };
  });

  // PATCH /admin/doctors/:id/verify
  app.patch("/doctors/:id/verify", async (request) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const { isVerified } = z
      .object({ isVerified: z.boolean() })
      .parse(request.body);

    const doctor = await prisma.doctor.findUnique({ where: { id } });
    if (!doctor) throw new NotFoundError("Doctor", id);

    await prisma.doctor.update({ where: { id }, data: { isVerified } });

    await audit({
      userId: request.user.id,
      action: "UPDATE",
      resourceType: "Doctor",
      resourceId: id,
      metadata: { isVerified },
    });

    // Notify and email the doctor about their verification status change (non-blocking)
    prisma.doctor.findUnique({
      where: { id },
      select: { userId: true, firstName: true, user: { select: { email: true } } },
    }).then((d) => {
      if (!d) return;
      const title = isVerified ? "Account approved" : "Account status changed";
      const body = isVerified
        ? "Your MedFlow doctor account has been approved. You can now accept patient appointments."
        : "Your MedFlow doctor account verification has been revoked. Please contact support.";
      notificationQueue.add("doctor-verified", { userId: d.userId, title, body, type: "doctor_verified", data: { isVerified } }).catch(() => {});
      emailQueue.add("doctor-verified", {
        to: d.user.email,
        data: { firstName: d.firstName, isVerified },
      }).catch(() => {});
    }).catch(() => {});

    return { message: `Doctor ${isVerified ? "verified" : "unverified"}` };
  });

  // GET /admin/audit-logs
  app.get("/audit-logs", async (request) => {
    const query = z
      .object({
        userId: z.string().optional(),
        action: z.string().optional(),
        resourceType: z.string().optional(),
        from: z.string().datetime().optional(),
        to: z.string().datetime().optional(),
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(50),
      })
      .parse(request.query);

    const where: any = {};
    if (query.userId) where.userId = query.userId;
    if (query.action) where.action = query.action;
    if (query.resourceType) where.resourceType = query.resourceType;
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }

    const [logs, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { email: true, role: true },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total, page: query.page, limit: query.limit };
  });

  // GET /admin/stats
  app.get("/stats", async () => {
    const [users, appointments, prescriptions, pendingDoctors] =
      await prisma.$transaction([
        prisma.user.groupBy({ by: ["role"], orderBy: { role: "asc" }, _count: { _all: true } }),
        prisma.appointment.groupBy({
          by: ["status"],
          orderBy: { status: "asc" },
          _count: { _all: true },
        }),
        prisma.prescription.groupBy({ by: ["status"], orderBy: { status: "asc" }, _count: { _all: true } }),
        prisma.doctor.count({ where: { isVerified: false } }),
      ]);

    return { users, appointments, prescriptions, pendingDoctors };
  });
}
