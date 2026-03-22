import type { FastifyInstance } from "fastify";
import { z } from "zod";
import * as authService from "../../services/auth.service.js";
import { emailQueue } from "../../jobs/queues.js";

export default async function authRoutes(app: FastifyInstance) {
  // POST /auth/register/patient
  app.post("/register/patient", async (request, reply) => {
    const body = z
      .object({
        email: z.string().email(),
        password: z.string().min(8),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]),
        phoneNumber: z.string().optional(),
      })
      .parse(request.body);

    const { userId, verificationToken } = await authService.registerPatient(body);

    emailQueue.add("email-verification", {
      to: body.email,
      data: { firstName: body.firstName, token: verificationToken },
    }).catch((err) => console.error("Failed to enqueue email-verification:", err));

    return reply.status(201).send({
      message: "Registration successful. Please verify your email.",
      userId,
      // Only expose token in non-production for testing
      ...(process.env["NODE_ENV"] !== "production" && { verificationToken }),
    });
  });

  // POST /auth/register/doctor
  app.post("/register/doctor", async (request, reply) => {
    const body = z
      .object({
        email: z.string().email(),
        password: z.string().min(8),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        specialty: z.string().min(1),
        licenseNumber: z.string().min(1),
        licenseState: z.string().min(2),
        consultationFee: z.number().positive(),
        yearsExperience: z.number().int().positive(),
        bio: z.string().optional(),
        languages: z.array(z.string()).default([]),
      })
      .parse(request.body);

    const { userId, verificationToken } = await authService.registerDoctor(body);

    emailQueue.add("email-verification", {
      to: body.email,
      data: { firstName: body.firstName, token: verificationToken },
    }).catch((err) => console.error("Failed to enqueue email-verification:", err));

    return reply.status(201).send({
      message:
        "Registration successful. Please verify your email. Your account will be reviewed by an admin before you can see patients.",
      userId,
      ...(process.env["NODE_ENV"] !== "production" && { verificationToken }),
    });
  });

  // POST /auth/verify-email
  app.post("/verify-email", async (request, reply) => {
    const { token } = z
      .object({ token: z.string().min(1) })
      .parse(request.body);

    await authService.verifyEmail(token);
    return { message: "Email verified successfully" };
  });

  // POST /auth/login
  app.post("/login", async (request, reply) => {
    const { email, password } = z
      .object({ email: z.string().email(), password: z.string().min(1) })
      .parse(request.body);

    const result = await authService.login(email, password, {
      ipAddress: request.ip,
      userAgent: request.headers["user-agent"],
    });

    return reply.status(200).send(result);
  });

  // POST /auth/logout  (requires auth)
  app.post("/logout", async (request, reply) => {
    await request.authenticate();
    const authHeader = request.headers["authorization"]!;
    const token = authHeader.slice(7);
    await authService.logout(token, request.user.id);
    return { message: "Logged out successfully" };
  });

  // POST /auth/forgot-password
  app.post("/forgot-password", async (request, reply) => {
    const { email } = z
      .object({ email: z.string().email() })
      .parse(request.body);

    const resetResult = await authService.requestPasswordReset(email);
    if (resetResult) {
      emailQueue.add("password-reset", {
        to: resetResult.email,
        data: { firstName: resetResult.firstName, token: resetResult.token },
      }).catch((err) => console.error("Failed to enqueue password-reset:", err));
    }
    // Always return success to prevent email enumeration
    return {
      message: "If that email exists, a password reset link has been sent.",
    };
  });

  // POST /auth/reset-password
  app.post("/reset-password", async (request, reply) => {
    const { token, newPassword } = z
      .object({ token: z.string().min(1), newPassword: z.string().min(8) })
      .parse(request.body);

    await authService.resetPassword(token, newPassword);
    return { message: "Password reset successfully. Please log in." };
  });

  // GET /auth/me
  app.get("/me", async (request, reply) => {
    await request.authenticate();
    return request.user;
  });
}
