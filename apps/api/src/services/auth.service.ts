import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { prisma, UserRole } from "@medflow/db";
import { ConflictError, UnauthorizedError, NotFoundError } from "../lib/errors.js";
import { audit } from "../plugins/audit.js";

const scryptAsync = promisify(scrypt);

const SALT_BYTES = 32;
const KEYLEN = 64;
const SESSION_EXPIRY_DAYS = 30;
const PASSWORD_RESET_HOURS = 1;
const EMAIL_VERIFY_HOURS = 24;

// ─── Hashing ─────────────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES).toString("hex");
  const derived = (await scryptAsync(password, salt, KEYLEN)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  const [salt, stored] = hash.split(":");
  if (!salt || !stored) return false;
  const derived = (await scryptAsync(password, salt, KEYLEN)) as Buffer;
  const storedBuf = Buffer.from(stored, "hex");
  if (derived.length !== storedBuf.length) return false;
  return timingSafeEqual(derived, storedBuf);
}

// ─── Registration ─────────────────────────────────────────────────────────────

export async function registerPatient(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phoneNumber?: string;
}): Promise<{ userId: string; verificationToken: string }> {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new ConflictError("An account with this email already exists");

  const passwordHash = await hashPassword(data.password);
  const verificationToken = randomBytes(32).toString("hex");
  const verificationExpiry = new Date(
    Date.now() + EMAIL_VERIFY_HOURS * 60 * 60 * 1000,
  );

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      role: UserRole.PATIENT,
      patient: {
        create: {
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: new Date(data.dateOfBirth),
          gender: data.gender as any,
          phoneNumber: data.phoneNumber,
        },
      },
    },
  });

  await prisma.emailVerification.create({
    data: {
      email: data.email,
      token: verificationToken,
      expiresAt: verificationExpiry,
    },
  });

  await audit({
    userId: user.id,
    action: "CREATE",
    resourceType: "User",
    resourceId: user.id,
    metadata: { role: UserRole.PATIENT },
  });

  return { userId: user.id, verificationToken };
}

export async function registerDoctor(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  specialty: string;
  licenseNumber: string;
  licenseState: string;
  consultationFee: number;
  yearsExperience: number;
  bio?: string;
  languages?: string[];
}): Promise<{ userId: string; verificationToken: string }> {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new ConflictError("An account with this email already exists");

  const existingLicense = await prisma.doctor.findUnique({
    where: { licenseNumber: data.licenseNumber },
  });
  if (existingLicense) throw new ConflictError("License number already registered");

  const passwordHash = await hashPassword(data.password);
  const verificationToken = randomBytes(32).toString("hex");
  const verificationExpiry = new Date(
    Date.now() + EMAIL_VERIFY_HOURS * 60 * 60 * 1000,
  );

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      role: UserRole.DOCTOR,
      doctor: {
        create: {
          firstName: data.firstName,
          lastName: data.lastName,
          specialty: data.specialty,
          licenseNumber: data.licenseNumber,
          licenseState: data.licenseState,
          consultationFee: data.consultationFee,
          yearsExperience: data.yearsExperience,
          bio: data.bio,
          languages: data.languages ?? [],
        },
      },
    },
  });

  await prisma.emailVerification.create({
    data: {
      email: data.email,
      token: verificationToken,
      expiresAt: verificationExpiry,
    },
  });

  await audit({
    userId: user.id,
    action: "CREATE",
    resourceType: "User",
    resourceId: user.id,
    metadata: { role: UserRole.DOCTOR },
  });

  return { userId: user.id, verificationToken };
}

// ─── Email Verification ───────────────────────────────────────────────────────

export async function verifyEmail(token: string): Promise<void> {
  const record = await prisma.emailVerification.findUnique({ where: { token } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw new UnauthorizedError("Invalid or expired verification token");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { email: record.email },
      data: { emailVerified: true },
    }),
    prisma.emailVerification.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);
}

// ─── Login / Sessions ─────────────────────────────────────────────────────────

export async function login(
  email: string,
  password: string,
  meta: { ipAddress?: string; userAgent?: string },
): Promise<{ token: string; user: { id: string; email: string; role: string } }> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new UnauthorizedError("Invalid email or password");
  }

  if (!user.isActive) throw new UnauthorizedError("Account deactivated");

  const token = randomBytes(48).toString("hex");
  const expiresAt = new Date(
    Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  );

  await prisma.session.create({
    data: { userId: user.id, token, expiresAt, ...meta },
  });

  await audit({
    userId: user.id,
    action: "LOGIN",
    resourceType: "Session",
    metadata: { ipAddress: meta.ipAddress },
  });

  return { token, user: { id: user.id, email: user.email, role: user.role } };
}

export async function logout(token: string, userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { token } });
  await audit({ userId, action: "LOGOUT", resourceType: "Session" });
}

// ─── Password Reset ───────────────────────────────────────────────────────────

export async function requestPasswordReset(
  email: string,
): Promise<{ token: string; email: string; firstName: string } | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      patient: { select: { firstName: true } },
      doctor: { select: { firstName: true } },
    },
  });
  // Always return success to prevent email enumeration
  if (!user) return null;

  const firstName = user.patient?.firstName ?? user.doctor?.firstName ?? "User";
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_HOURS * 60 * 60 * 1000);

  await prisma.passwordReset.create({
    data: { userId: user.id, token, expiresAt },
  });

  return { token, email: user.email, firstName };
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<void> {
  const record = await prisma.passwordReset.findUnique({ where: { token } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw new UnauthorizedError("Invalid or expired reset token");
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordReset.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    // Invalidate all existing sessions for security
    prisma.session.deleteMany({ where: { userId: record.userId } }),
  ]);
}
