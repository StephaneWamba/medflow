/**
 * MedFlow seed — run with: pnpm --filter @medflow/db db:seed
 * Requires DATABASE_URL and DIRECT_URL set in environment.
 * Falls back to loading apps/api/.env automatically.
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";
import { PrismaClient } from "../generated/client/index.js";

// ── Load .env from apps/api if DATABASE_URL not already set ───────────────────
if (!process.env["DATABASE_URL"]) {
  try {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const envPath = resolve(__dirname, "../../../apps/api/.env");
    const raw = readFileSync(envPath, "utf-8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m) {
        const val = m[2].trim().replace(/^["']|["']$/g, "");
        process.env[m[1]] = val;
      }
    }
    console.log("✓ Loaded .env from apps/api/.env");
  } catch {
    console.warn("⚠  Could not load apps/api/.env — ensure DATABASE_URL is set in environment");
  }
}

const prisma = new PrismaClient();
const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(32).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

// ── Seed data ─────────────────────────────────────────────────────────────────

const DOCTORS = [
  {
    firstName: "Emily",      lastName: "Carter",
    email: "emily.carter@medflow-demo.com",
    specialty: "Cardiology",  subSpecialty: "Interventional Cardiology",
    licenseNumber: "MD-SEED-001", licenseState: "NY",
    yearsExperience: 12, consultationFee: 130,
    languages: ["English", "Spanish"],
    rating: 4.9, reviewCount: 214,
    bio: "Dr. Carter specialises in diagnosing and treating complex heart conditions, with a focus on minimally invasive interventional procedures. Board-certified by the American Board of Internal Medicine.",
    photo: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&q=80&fit=crop&crop=face",
  },
  {
    firstName: "James",      lastName: "Okafor",
    email: "james.okafor@medflow-demo.com",
    specialty: "Internal Medicine", subSpecialty: "Preventive Medicine",
    licenseNumber: "MD-SEED-002", licenseState: "CA",
    yearsExperience: 9, consultationFee: 95,
    languages: ["English", "French"],
    rating: 4.8, reviewCount: 143,
    bio: "Dr. Okafor focuses on preventive care and management of chronic conditions. He takes a holistic approach to patient health, emphasising lifestyle and long-term wellness over reactive treatment.",
    photo: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&q=80&fit=crop&crop=face",
  },
  {
    firstName: "Priya",      lastName: "Sharma",
    email: "priya.sharma@medflow-demo.com",
    specialty: "Dermatology",  subSpecialty: "Cosmetic Dermatology",
    licenseNumber: "MD-SEED-003", licenseState: "TX",
    yearsExperience: 11, consultationFee: 115,
    languages: ["English", "Hindi"],
    rating: 4.9, reviewCount: 302,
    bio: "Dr. Sharma is a board-certified dermatologist with expertise in medical and cosmetic dermatology. She has particular interest in skin cancer screening, acne, and eczema management.",
    photo: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80&fit=crop&crop=face",
  },
  {
    firstName: "Marcus",     lastName: "Weber",
    email: "marcus.weber@medflow-demo.com",
    specialty: "Psychiatry",   subSpecialty: "Anxiety & Mood Disorders",
    licenseNumber: "MD-SEED-004", licenseState: "IL",
    yearsExperience: 16, consultationFee: 155,
    languages: ["English", "German"],
    rating: 4.8, reviewCount: 97,
    bio: "Dr. Weber specialises in evidence-based treatment of anxiety, depression, and bipolar disorder. He integrates CBT, pharmacotherapy, and mindfulness approaches tailored to each patient.",
    photo: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&q=80&fit=crop&crop=face",
  },
  {
    firstName: "Aisha",      lastName: "Hassan",
    email: "aisha.hassan@medflow-demo.com",
    specialty: "Pediatrics",   subSpecialty: "Developmental Pediatrics",
    licenseNumber: "MD-SEED-005", licenseState: "FL",
    yearsExperience: 8, consultationFee: 100,
    languages: ["English", "Arabic"],
    rating: 5.0, reviewCount: 188,
    bio: "Dr. Hassan is a compassionate pediatrician with a focus on child development milestones, vaccinations, and early intervention. She is passionate about empowering parents with evidence-based guidance.",
    photo: "https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=400&q=80&fit=crop&crop=face",
  },
  {
    firstName: "Wei",        lastName: "Zhang",
    email: "wei.zhang@medflow-demo.com",
    specialty: "Neurology",    subSpecialty: "Headache & Migraine",
    licenseNumber: "MD-SEED-006", licenseState: "WA",
    yearsExperience: 14, consultationFee: 160,
    languages: ["English", "Mandarin"],
    rating: 4.7, reviewCount: 121,
    bio: "Dr. Zhang is a neurologist specialising in headache disorders, epilepsy, and neurodegenerative conditions. He employs cutting-edge diagnostic techniques to deliver personalised treatment plans.",
    photo: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=80&fit=crop&crop=face",
  },
  {
    firstName: "Sofia",      lastName: "Ramirez",
    email: "sofia.ramirez@medflow-demo.com",
    specialty: "Gynecology",   subSpecialty: "Reproductive Endocrinology",
    licenseNumber: "MD-SEED-007", licenseState: "AZ",
    yearsExperience: 10, consultationFee: 125,
    languages: ["English", "Spanish"],
    rating: 4.9, reviewCount: 267,
    bio: "Dr. Ramirez specialises in women's health, hormonal disorders, and reproductive medicine. She advocates for thorough, compassionate care throughout every life stage from adolescence to menopause.",
    photo: "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=400&q=80&fit=crop&crop=face",
  },
  {
    firstName: "David",      lastName: "Kim",
    email: "david.kim@medflow-demo.com",
    specialty: "Orthopedics",  subSpecialty: "Sports Medicine",
    licenseNumber: "MD-SEED-008", licenseState: "CO",
    yearsExperience: 13, consultationFee: 155,
    languages: ["English", "Korean"],
    rating: 4.8, reviewCount: 174,
    bio: "Dr. Kim is an orthopedic specialist with expertise in sports injuries, joint replacement, and musculoskeletal rehabilitation. He works with athletes and everyday patients to restore full function.",
    photo: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&q=80&fit=crop&crop=face",
  },
  {
    firstName: "Rachel",     lastName: "Thompson",
    email: "rachel.thompson@medflow-demo.com",
    specialty: "Ophthalmology", subSpecialty: "Retinal Disease",
    licenseNumber: "MD-SEED-009", licenseState: "MA",
    yearsExperience: 7, consultationFee: 110,
    languages: ["English"],
    rating: 4.7, reviewCount: 89,
    bio: "Dr. Thompson is an ophthalmologist with clinical interest in retinal disorders, diabetic eye disease, and macular degeneration. She emphasises early detection to preserve long-term vision.",
    photo: "https://images.unsplash.com/photo-1590649880765-91b1956b8276?w=400&q=80&fit=crop&crop=face",
  },
  {
    firstName: "Kwame",      lastName: "Asante",
    email: "kwame.asante@medflow-demo.com",
    specialty: "General Practice", subSpecialty: "Preventive & Family Medicine",
    licenseNumber: "MD-SEED-010", licenseState: "GA",
    yearsExperience: 6, consultationFee: 85,
    languages: ["English", "French", "Twi"],
    rating: 4.9, reviewCount: 231,
    bio: "Dr. Asante provides comprehensive primary care for patients of all ages. His multilingual background and warm communication style make him a trusted first point of contact for many families.",
    photo: "https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=400&q=80&fit=crop&crop=face",
  },
  {
    firstName: "Nalini",     lastName: "Patel",
    email: "nalini.patel@medflow-demo.com",
    specialty: "Endocrinology", subSpecialty: "Diabetes & Thyroid",
    licenseNumber: "MD-SEED-011", licenseState: "OH",
    yearsExperience: 15, consultationFee: 140,
    languages: ["English", "Hindi", "Gujarati"],
    rating: 4.8, reviewCount: 156,
    bio: "Dr. Patel is an endocrinologist focused on diabetes management, thyroid disease, and adrenal disorders. She combines pharmacological treatment with personalised lifestyle coaching.",
    photo: "https://images.unsplash.com/photo-1643297654416-05795d62e39d?w=400&q=80&fit=crop&crop=face",
  },
  {
    firstName: "Thomas",     lastName: "Burke",
    email: "thomas.burke@medflow-demo.com",
    specialty: "Gastroenterology", subSpecialty: "IBD & Liver Disease",
    licenseNumber: "MD-SEED-012", licenseState: "PA",
    yearsExperience: 18, consultationFee: 145,
    languages: ["English"],
    rating: 4.7, reviewCount: 108,
    bio: "Dr. Burke is a gastroenterologist with two decades of experience in IBD, GERD, liver disease, and digestive system disorders. He prioritises minimally invasive diagnostic and treatment options.",
    photo: "https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=400&q=80&fit=crop&crop=face",
  },
  {
    firstName: "Amara",      lastName: "Diallo",
    email: "amara.diallo@medflow-demo.com",
    specialty: "Pulmonology",  subSpecialty: "Asthma & Sleep Disorders",
    licenseNumber: "MD-SEED-013", licenseState: "NC",
    yearsExperience: 9, consultationFee: 120,
    languages: ["English", "French"],
    rating: 4.8, reviewCount: 132,
    bio: "Dr. Diallo specialises in respiratory conditions including asthma, COPD, pulmonary fibrosis, and sleep-disordered breathing. She has particular expertise in managing complex asthma in adults.",
    photo: "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=400&q=80&fit=crop&crop=face",
  },
  {
    firstName: "Robert",     lastName: "Chen",
    email: "robert.chen@medflow-demo.com",
    specialty: "Oncology",     subSpecialty: "Breast & Lung Cancer",
    licenseNumber: "MD-SEED-014", licenseState: "CA",
    yearsExperience: 20, consultationFee: 175,
    languages: ["English", "Mandarin", "Cantonese"],
    rating: 4.9, reviewCount: 179,
    bio: "Dr. Chen is a medical oncologist with 20 years of experience in solid tumour treatment, specialising in breast and lung cancer. He leads multidisciplinary care teams to deliver comprehensive oncology support.",
    photo: "https://images.unsplash.com/photo-1571772996211-2f02c9727629?w=400&q=80&fit=crop&crop=face",
  },
  {
    firstName: "Isabella",   lastName: "Rossi",
    email: "isabella.rossi@medflow-demo.com",
    specialty: "Emergency Medicine", subSpecialty: "Urgent Care & Triage",
    licenseNumber: "MD-SEED-015", licenseState: "NY",
    yearsExperience: 11, consultationFee: 135,
    languages: ["English", "Italian"],
    rating: 4.7, reviewCount: 94,
    bio: "Dr. Rossi is a board-certified emergency physician now offering urgent telehealth consultations for acute, non-life-threatening conditions. She provides rapid assessment, diagnosis, and treatment guidance.",
    photo: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=400&q=80&fit=crop&crop=face",
  },
] as const;

const DAYS = [
  "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY",
] as const;

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Starting MedFlow seed...\n");

  const password = await hashPassword("Demo@1234!");
  let created = 0;
  let skipped = 0;

  for (const d of DOCTORS) {
    const existing = await prisma.user.findUnique({ where: { email: d.email } });
    if (existing) {
      console.log(`  ↳ skip  ${d.email} (already exists)`);
      skipped++;
      continue;
    }

    const user = await prisma.user.create({
      data: {
        email: d.email,
        emailVerified: true,
        passwordHash: password,
        role: "DOCTOR",
      },
    });

    const doctor = await prisma.doctor.create({
      data: {
        userId: user.id,
        firstName: d.firstName,
        lastName: d.lastName,
        specialty: d.specialty,
        subSpecialty: d.subSpecialty,
        licenseNumber: d.licenseNumber,
        licenseState: d.licenseState,
        yearsExperience: d.yearsExperience,
        consultationFee: d.consultationFee,
        languages: [...d.languages],
        rating: d.rating,
        reviewCount: d.reviewCount,
        bio: d.bio,
        profileImageUrl: d.photo,
        isVerified: true,
        isAcceptingNew: true,
      },
    });

    // Mon–Fri 09:00–17:00, 30-min slots
    await prisma.doctorAvailability.createMany({
      data: DAYS.map((day) => ({
        doctorId: doctor.id,
        dayOfWeek: day,
        startTime: "09:00",
        endTime:   "17:00",
        slotDuration: 30,
      })),
    });

    console.log(`  ✓ created Dr. ${d.firstName} ${d.lastName} (${d.specialty})`);
    created++;
  }

  console.log(`\n✅ Seed complete — ${created} created, ${skipped} skipped.`);
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
