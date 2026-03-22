import type { UserRole } from "@medflow/db";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
  profileId: string | null; // patientId or doctorId
}
