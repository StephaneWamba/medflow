import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, UserRole, AppointmentStatus } from "@medflow/db";
import { NotFoundError, ForbiddenError, ValidationError, UnprocessableError } from "../../lib/errors.js";
import { audit } from "../../plugins/audit.js";
import { uploadFile, deleteFile } from "../../lib/storage.js";
import { env } from "../../env.js";

export default async function doctorRoutes(app: FastifyInstance) {
  // GET /doctors — public search
  app.get("/", async (request) => {
    const query = z
      .object({
        specialty: z.string().optional(),
        search: z.string().optional(),
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(50).default(20),
      })
      .parse(request.query);

    const skip = (query.page - 1) * query.limit;
    const where: any = { isVerified: true, isAcceptingNew: true };

    if (query.specialty) where.specialty = { contains: query.specialty, mode: "insensitive" };
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: "insensitive" } },
        { lastName: { contains: query.search, mode: "insensitive" } },
        { specialty: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [doctors, total] = await prisma.$transaction([
      prisma.doctor.findMany({
        where,
        skip,
        take: query.limit,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          specialty: true,
          subSpecialty: true,
          bio: true,
          profileImageUrl: true,
          consultationFee: true,
          yearsExperience: true,
          languages: true,
          rating: true,
          reviewCount: true,
          availability: { select: { dayOfWeek: true, startTime: true, endTime: true, slotDuration: true } },
        },
        orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
      }),
      prisma.doctor.count({ where }),
    ]);

    return { doctors, total, page: query.page, limit: query.limit };
  });

  // GET /doctors/:id — public profile
  app.get("/:id", async (request) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);

    const doctor = await prisma.doctor.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        specialty: true,
        subSpecialty: true,
        bio: true,
        profileImageUrl: true,
        consultationFee: true,
        yearsExperience: true,
        languages: true,
        rating: true,
        reviewCount: true,
        isVerified: true,
        isAcceptingNew: true,
        availability: { select: { dayOfWeek: true, startTime: true, endTime: true, slotDuration: true } },
        reviews: {
          take: 5,
          orderBy: { createdAt: "desc" },
          select: { rating: true, comment: true, createdAt: true },
        },
      },
    });

    if (!doctor) throw new NotFoundError("Doctor", id);
    return doctor;
  });

  // GET /doctors/me — authenticated doctor's own full profile
  app.get("/me", async (request) => {
    await request.authenticate();
    request.requireRole(UserRole.DOCTOR);

    const doctor = await prisma.doctor.findUnique({
      where: { id: request.user.profileId! },
      include: {
        availability: true,
        user: { select: { email: true, emailVerified: true, createdAt: true } },
      },
    });

    if (!doctor) throw new NotFoundError("Doctor profile");
    return doctor;
  });

  // PUT /doctors/me/availability — set availability schedule
  app.put("/me/availability", async (request) => {
    await request.authenticate();
    request.requireRole(UserRole.DOCTOR);

    const body = z
      .array(
        z.object({
          dayOfWeek: z.enum([
            "MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY",
          ]),
          startTime: z.string().regex(/^\d{2}:\d{2}$/),
          endTime: z.string().regex(/^\d{2}:\d{2}$/),
          slotDuration: z.number().int().min(15).max(120).default(30),
        }),
      )
      .parse(request.body);

    const doctorId = request.user.profileId!;

    // Upsert each day's rule
    await prisma.$transaction(
      body.map((slot) =>
        prisma.doctorAvailability.upsert({
          where: { doctorId_dayOfWeek: { doctorId, dayOfWeek: slot.dayOfWeek } },
          create: { doctorId, ...slot },
          update: { startTime: slot.startTime, endTime: slot.endTime, slotDuration: slot.slotDuration },
        }),
      ),
    );

    return { message: "Availability updated" };
  });

  // POST /doctors/me/time-off
  app.post("/me/time-off", async (request, reply) => {
    await request.authenticate();
    request.requireRole(UserRole.DOCTOR);

    const body = z
      .object({
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
        reason: z.string().optional(),
      })
      .parse(request.body);

    const doctorId = request.user.profileId!;
    const timeOff = await prisma.doctorTimeOff.create({
      data: {
        doctorId,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        reason: body.reason,
      },
    });

    return reply.status(201).send(timeOff);
  });

  // PATCH /doctors/me/profile
  app.patch("/me/profile", async (request) => {
    await request.authenticate();
    request.requireRole(UserRole.DOCTOR);

    const body = z
      .object({
        bio: z.string().optional(),
        consultationFee: z.number().positive().optional(),
        isAcceptingNew: z.boolean().optional(),
        languages: z.array(z.string()).optional(),
      })
      .parse(request.body);

    const doctorId = request.user.profileId!;
    const updated = await prisma.doctor.update({
      where: { id: doctorId },
      data: body,
    });

    await audit({
      userId: request.user.id,
      action: "UPDATE",
      resourceType: "Doctor",
      resourceId: doctorId,
      metadata: { fields: Object.keys(body) },
    });

    return updated;
  });

  // POST /doctors/me/profile-image — upload profile photo to R2
  app.post("/me/profile-image", async (request, reply) => {
    await request.authenticate();
    request.requireRole(UserRole.DOCTOR);

    const doctorId = request.user.profileId!;

    // Enforce 5 MB limit at stream level — avoids buffering 20 MB before rejecting
    const part = await request.file({ limits: { fileSize: 5 * 1024 * 1024 } });
    if (!part) throw new ValidationError("No file uploaded");

    const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!ALLOWED.has(part.mimetype)) {
      throw new ValidationError("Only JPEG, PNG, and WebP images are allowed for profile photos");
    }

    const buffer = await part.toBuffer();
    if ((part.file as any).truncated) {
      throw new ValidationError("Profile image must be under 5 MB");
    }

    // Delete old image from R2 if present
    const current = await prisma.doctor.findUnique({ where: { id: doctorId }, select: { profileImageUrl: true } });
    if (current?.profileImageUrl) {
      const prefix = `${env.R2_PUBLIC_URL}/`;
      if (current.profileImageUrl.startsWith(prefix)) {
        await deleteFile(current.profileImageUrl.slice(prefix.length)).catch(() => {});
      }
    }

    const ts = Date.now();
    const sanitized = part.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileKey = `doctors/${doctorId}/profile/${ts}_${sanitized}`;

    await uploadFile(fileKey, buffer, part.mimetype);
    const profileImageUrl = `${env.R2_PUBLIC_URL}/${fileKey}`;

    await prisma.doctor.update({ where: { id: doctorId }, data: { profileImageUrl } });

    await audit({
      userId: request.user.id,
      action: "UPDATE",
      resourceType: "Doctor",
      resourceId: doctorId,
      metadata: { fields: ["profileImageUrl"] },
    });

    return reply.status(200).send({ profileImageUrl });
  });

  // GET /doctors/:doctorId/reviews — paginated public reviews
  app.get("/:doctorId/reviews", async (request) => {
    const { doctorId } = z.object({ doctorId: z.string() }).parse(request.params);
    const query = z
      .object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(50).default(10),
      })
      .parse(request.query);

    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId }, select: { id: true } });
    if (!doctor) throw new NotFoundError("Doctor", doctorId);

    const [reviews, total] = await prisma.$transaction([
      prisma.doctorReview.findMany({
        where: { doctorId },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: "desc" },
        select: { id: true, rating: true, comment: true, createdAt: true },
      }),
      prisma.doctorReview.count({ where: { doctorId } }),
    ]);

    return { reviews, total, page: query.page, limit: query.limit };
  });

  // POST /doctors/:doctorId/reviews — patient submits review after completed appointment
  app.post("/:doctorId/reviews", async (request, reply) => {
    await request.authenticate();
    request.requireRole(UserRole.PATIENT);

    const { doctorId } = z.object({ doctorId: z.string() }).parse(request.params);
    const body = z
      .object({
        appointmentId: z.string().min(1),
        rating: z.number().int().min(1).max(5),
        comment: z.string().max(1000).optional(),
      })
      .parse(request.body);

    const patientId = request.user.profileId!;

    // Verify the appointment: must be COMPLETED, belong to this patient + doctor
    const appt = await prisma.appointment.findUnique({
      where: { id: body.appointmentId },
      select: { patientId: true, doctorId: true, status: true },
    });
    if (!appt) throw new NotFoundError("Appointment", body.appointmentId);
    if (appt.patientId !== patientId) throw new ForbiddenError();
    if (appt.doctorId !== doctorId) throw new UnprocessableError("Appointment does not match this doctor");
    if (appt.status !== AppointmentStatus.COMPLETED) {
      throw new UnprocessableError("You can only review a completed appointment");
    }

    // Create review and recalculate doctor's aggregate rating in one transaction
    const review = await prisma.$transaction(async (tx) => {
      const created = await tx.doctorReview.create({
        data: { doctorId, patientId, appointmentId: body.appointmentId, rating: body.rating, comment: body.comment },
      });

      const agg = await tx.doctorReview.aggregate({
        where: { doctorId },
        _avg: { rating: true },
        _count: { id: true },
      });

      await tx.doctor.update({
        where: { id: doctorId },
        data: {
          rating: agg._avg.rating ?? body.rating,
          reviewCount: agg._count.id,
        },
      });

      return created;
    });

    await audit({
      userId: request.user.id,
      action: "CREATE",
      resourceType: "DoctorReview",
      resourceId: review.id,
      metadata: { doctorId, rating: body.rating },
    });

    return reply.status(201).send(review);
  });
}
