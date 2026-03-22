import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, UserRole } from "@medflow/db";
import { ForbiddenError, NotFoundError, ValidationError } from "../../lib/errors.js";
import { encryptToString, decryptFromString } from "../../lib/crypto.js";
import { audit } from "../../plugins/audit.js";
import { uploadFile, deleteFile, getPresignedDownloadUrl, buildFileKey } from "../../lib/storage.js";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export default async function healthRecordRoutes(app: FastifyInstance) {
  // GET /health-records — patient sees own, doctor sees their patients', admin sees all
  app.get("/", async (request) => {
    await request.authenticate();
    const { user } = request;

    const query = z
      .object({
        patientId: z.string().optional(),
        type: z
          .enum([
            "CONSULTATION_NOTE","LAB_RESULT","IMAGING","VACCINATION",
            "ALLERGY","SURGERY","CHRONIC_CONDITION","GENERAL",
          ])
          .optional(),
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(20),
      })
      .parse(request.query);

    const skip = (query.page - 1) * query.limit;
    const where: any = {};

    if (user.role === UserRole.PATIENT) {
      where.patientId = user.profileId;
    } else if (user.role === UserRole.DOCTOR) {
      if (query.patientId) where.patientId = query.patientId;
      where.doctorId = user.profileId;
    } else if (query.patientId) {
      where.patientId = query.patientId;
    }

    if (query.type) where.type = query.type;

    const [records, total] = await prisma.$transaction([
      prisma.healthRecord.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          patientId: true,
          doctorId: true,
          type: true,
          title: true,
          isSensitive: true,
          createdAt: true,
          updatedAt: true,
          doctor: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.healthRecord.count({ where }),
    ]);

    return { records, total, page: query.page, limit: query.limit };
  });

  // GET /health-records/:id
  app.get("/:id", async (request) => {
    await request.authenticate();
    const { id } = z.object({ id: z.string() }).parse(request.params);

    const record = await prisma.healthRecord.findUnique({
      where: { id },
      include: {
        doctor: { select: { firstName: true, lastName: true } },
        documents: { select: { id: true, fileName: true, mimeType: true, sizeBytes: true, createdAt: true } },
      },
    });

    if (!record) throw new NotFoundError("Health record", id);

    const { user } = request;
    const hasAccess =
      (user.role === UserRole.PATIENT && record.patientId === user.profileId) ||
      (user.role === UserRole.DOCTOR && record.doctorId === user.profileId) ||
      user.role === UserRole.ADMIN;

    if (!hasAccess) throw new ForbiddenError();

    await audit({
      userId: user.id,
      action: "RECORD_ACCESSED",
      resourceType: "HealthRecord",
      resourceId: id,
    });

    // Decrypt content for authorized viewer
    const decryptedContent = decryptFromString(record.content);
    return { ...record, content: decryptedContent };
  });

  // POST /health-records — doctors only
  app.post("/", async (request, reply) => {
    await request.authenticate();
    request.requireRole(UserRole.DOCTOR);

    const body = z
      .object({
        patientId: z.string().min(1),
        type: z.enum([
          "CONSULTATION_NOTE","LAB_RESULT","IMAGING","VACCINATION",
          "ALLERGY","SURGERY","CHRONIC_CONDITION","GENERAL",
        ]),
        title: z.string().min(1).max(200),
        content: z.string().min(1),
        isSensitive: z.boolean().default(false),
        appointmentId: z.string().optional(),
      })
      .parse(request.body);

    const encryptedContent = encryptToString(body.content);

    const record = await prisma.healthRecord.create({
      data: {
        ...body,
        content: encryptedContent,
        doctorId: request.user.profileId!,
      },
    });

    await audit({
      userId: request.user.id,
      action: "CREATE",
      resourceType: "HealthRecord",
      resourceId: record.id,
      metadata: { type: body.type, patientId: body.patientId },
    });

    return reply.status(201).send({ ...record, content: body.content });
  });

  // PATCH /health-records/:id — doctor who created it
  app.patch("/:id", async (request) => {
    await request.authenticate();
    request.requireRole(UserRole.DOCTOR);

    const { id } = z.object({ id: z.string() }).parse(request.params);
    const body = z
      .object({
        title: z.string().min(1).max(200).optional(),
        content: z.string().min(1).optional(),
        isSensitive: z.boolean().optional(),
      })
      .parse(request.body);

    const record = await prisma.healthRecord.findUnique({ where: { id } });
    if (!record) throw new NotFoundError("Health record", id);
    if (record.doctorId !== request.user.profileId) throw new ForbiddenError();

    const updateData: any = { ...body };
    if (body.content) {
      updateData.content = encryptToString(body.content);
    }

    const updated = await prisma.healthRecord.update({ where: { id }, data: updateData });

    await audit({
      userId: request.user.id,
      action: "UPDATE",
      resourceType: "HealthRecord",
      resourceId: id,
      metadata: { fields: Object.keys(body) },
    });

    return { ...updated, content: body.content ?? decryptFromString(updated.content) };
  });

  // POST /health-records/:id/vitals
  app.post("/:patientId/vitals", async (request, reply) => {
    await request.authenticate();

    const { patientId } = z
      .object({ patientId: z.string() })
      .parse(request.params);

    const { user } = request;
    const isOwner = user.role === UserRole.PATIENT && user.profileId === patientId;
    const isDoctor = user.role === UserRole.DOCTOR;
    const isAdmin = user.role === UserRole.ADMIN;

    if (!isOwner && !isDoctor && !isAdmin) throw new ForbiddenError();

    const body = z
      .object({
        recordedAt: z.string().datetime(),
        systolic: z.number().int().min(40).max(300).optional(),
        diastolic: z.number().int().min(20).max(200).optional(),
        heartRate: z.number().int().min(20).max(300).optional(),
        temperature: z.number().min(30).max(45).optional(),
        oxygenSat: z.number().int().min(50).max(100).optional(),
        weight: z.number().positive().optional(),
        height: z.number().positive().optional(),
        glucoseLevel: z.number().positive().optional(),
        notes: z.string().optional(),
      })
      .parse(request.body);

    const { recordedAt, ...rest } = body;
    const vital = await prisma.vital.create({
      data: {
        patientId,
        recordedBy: user.id,
        recordedAt: new Date(recordedAt),
        ...rest,
      },
    });

    return reply.status(201).send(vital);
  });

  // POST /health-records/:id/documents — upload a file attached to a health record
  app.post("/:id/documents", async (request, reply) => {
    await request.authenticate();

    const { id } = z.object({ id: z.string() }).parse(request.params);

    const record = await prisma.healthRecord.findUnique({ where: { id } });
    if (!record) throw new NotFoundError("Health record", id);

    const { user } = request;
    const hasAccess =
      (user.role === UserRole.PATIENT && record.patientId === user.profileId) ||
      (user.role === UserRole.DOCTOR && record.doctorId === user.profileId) ||
      user.role === UserRole.ADMIN;

    if (!hasAccess) throw new ForbiddenError();

    const part = await request.file();
    if (!part) throw new ValidationError("No file uploaded");

    if (!ALLOWED_MIME_TYPES.has(part.mimetype)) {
      throw new ValidationError(
        `File type "${part.mimetype}" is not allowed. Accepted: PDF, JPEG, PNG, WebP, DOC, DOCX`,
      );
    }

    const buffer = await part.toBuffer();
    const fileKey = buildFileKey(record.patientId, "health-records", part.filename);

    await uploadFile(fileKey, buffer, part.mimetype);

    const doc = await prisma.medicalDocument.create({
      data: {
        patientId: record.patientId,
        healthRecordId: id,
        uploadedBy: user.id,
        fileName: part.filename,
        fileKey,
        mimeType: part.mimetype,
        sizeBytes: buffer.byteLength,
      },
    });

    await audit({
      userId: user.id,
      action: "CREATE",
      resourceType: "MedicalDocument",
      resourceId: doc.id,
      metadata: { healthRecordId: id, mimeType: part.mimetype, sizeBytes: buffer.byteLength },
    });

    return reply.status(201).send({
      id: doc.id,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      sizeBytes: doc.sizeBytes,
      createdAt: doc.createdAt,
    });
  });

  // GET /health-records/documents/:docId/download — presigned download URL
  app.get("/documents/:docId/download", async (request) => {
    await request.authenticate();

    const { docId } = z.object({ docId: z.string() }).parse(request.params);

    const doc = await prisma.medicalDocument.findUnique({
      where: { id: docId },
      include: { healthRecord: { select: { patientId: true, doctorId: true } } },
    });

    if (!doc) throw new NotFoundError("Document", docId);

    const { user } = request;
    const patientId = doc.patientId;
    const doctorId = doc.healthRecord?.doctorId;

    const hasAccess =
      (user.role === UserRole.PATIENT && user.profileId === patientId) ||
      (user.role === UserRole.DOCTOR && user.profileId === doctorId) ||
      user.role === UserRole.ADMIN;

    if (!hasAccess) throw new ForbiddenError();

    await audit({
      userId: user.id,
      action: "RECORD_ACCESSED",
      resourceType: "MedicalDocument",
      resourceId: docId,
    });

    const url = await getPresignedDownloadUrl(doc.fileKey, 900); // 15 min
    return { url, expiresIn: 900 };
  });

  // DELETE /health-records/documents/:docId — remove document
  app.delete("/documents/:docId", async (request, reply) => {
    await request.authenticate();

    const { docId } = z.object({ docId: z.string() }).parse(request.params);

    const doc = await prisma.medicalDocument.findUnique({
      where: { id: docId },
      include: { healthRecord: { select: { doctorId: true } } },
    });

    if (!doc) throw new NotFoundError("Document", docId);

    const { user } = request;
    const isDoctorOwner = user.role === UserRole.DOCTOR && user.profileId === doc.healthRecord?.doctorId;
    const isAdmin = user.role === UserRole.ADMIN;

    if (!isDoctorOwner && !isAdmin) throw new ForbiddenError();

    await deleteFile(doc.fileKey);
    await prisma.medicalDocument.delete({ where: { id: docId } });

    await audit({
      userId: user.id,
      action: "DELETE",
      resourceType: "MedicalDocument",
      resourceId: docId,
    });

    return reply.status(204).send();
  });
}
