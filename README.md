![Next.js](https://img.shields.io/badge/Next.js_16-black?style=flat-square&logo=next.js)
![Fastify](https://img.shields.io/badge/Fastify_5-000000?style=flat-square&logo=fastify)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)
![LiveKit](https://img.shields.io/badge/LiveKit-FF4F00?style=flat-square&logo=webrtc&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white)
![Fly.io](https://img.shields.io/badge/Fly.io-8B5CF6?style=flat-square&logo=fly.io&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)

# MedFlow

**Telemedicine platform** — patients book secure video consultations with licensed doctors, receive digital prescriptions, and manage their health records in one place.

**Live:** [medflow-five.vercel.app](https://medflow-five.vercel.app)

![MedFlow](./image.png)

---

## Architecture

```mermaid
graph TB
    subgraph Client["Browser"]
        Web["Next.js 16\nApp Router"]
    end

    subgraph Fly["Fly.io (iad)"]
        API["Fastify 5 API"]
        Redis["Redis\n(internal)"]
        Queue["BullMQ\nWorker"]
    end

    subgraph Data["Data Layer"]
        DB["PostgreSQL\n(Neon)"]
        R2["Cloudflare R2\nDocuments"]
    end

    subgraph Services["External Services"]
        LiveKit["LiveKit Cloud\nVideo SFU"]
        Resend["Resend\nEmail"]
    end

    Web -->|REST + Bearer| API
    Web <-->|Socket.io| API
    Web <-->|WebRTC| LiveKit
    API --> DB
    API --> Redis
    API --> R2
    API -->|Token generation| LiveKit
    Queue --> Resend
    Redis --> Queue
```

---

## Features

| Role | Capabilities |
|------|-------------|
| **Patient** | Browse verified doctors, book video appointments, receive prescriptions, upload/view health records, encrypted messaging |
| **Doctor** | Manage schedule & availability, conduct video consultations, write prescriptions, access patient records |
| **Admin** | Verify doctor licenses, suspend users, view audit logs, platform statistics |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, Framer Motion |
| State | TanStack Query v5, Zustand v5 |
| API | Fastify 5, Node.js 22, TypeScript |
| Database | PostgreSQL (Neon), Prisma 6 |
| Queue | BullMQ + Redis |
| Video | LiveKit Cloud (WebRTC) |
| Storage | Cloudflare R2 |
| Email | Resend |
| Monorepo | Turborepo + pnpm workspaces |
| Deploy | Vercel (web) · Fly.io (API + Redis) |

---

## Database Schema

```mermaid
erDiagram
    users ||--o| patients : "has profile"
    users ||--o| doctors : "has profile"
    users ||--o{ sessions : "authenticates via"
    users ||--o{ notifications : "receives"
    users ||--o{ audit_logs : "generates"

    doctors ||--o{ appointments : "attends"
    doctors ||--o{ doctor_availability : "sets"
    patients ||--o{ appointments : "books"

    appointments ||--o| prescriptions : "generates"
    appointments ||--o| conversations : "creates"

    conversations ||--o{ messages : "contains"

    patients ||--o{ health_records : "owns"
    health_records ||--o{ medical_documents : "stores"

    prescriptions ||--o{ prescription_items : "lists"
```

---

## Docs

- [Setup & environment variables](docs/setup.md)
- [API reference](docs/api.md)
- [Deployment](docs/deployment.md)
- [Security](docs/security.md)

---

## License

MIT
