import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { AppError } from "../lib/errors.js";
import { ZodError } from "zod";

export default fp(async function errorHandler(app: FastifyInstance) {
  app.setErrorHandler((error, request, reply) => {
    // Zod validation errors
    if (error instanceof ZodError) {
      return reply.status(400).send({
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        errors: error.flatten().fieldErrors,
      });
    }

    // Domain errors
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        statusCode: error.statusCode,
        code: error.code,
        message: error.message,
      });
    }

    // Fastify validation errors (schema mismatch)
    const e = error as Record<string, unknown>;
    if (e["validation"]) {
      return reply.status(400).send({
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: typeof e["message"] === "string" ? e["message"] : "Validation failed",
      });
    }

    // Unexpected errors — never leak internals
    request.log.error(error);
    return reply.status(500).send({
      statusCode: 500,
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    });
  });
});
