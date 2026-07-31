import { defineConfig } from "drizzle-kit";
import path from "path";

// generate/migrate/push precisam de privilégio de DDL (CREATE/ALTER/DROP) — use
// MIGRATIONS_DATABASE_URL para apontar pra uma credencial separada da que a aplicação usa
// em runtime (ver lib/db/db-user-separation.sql), sem duplicar .env em produção. Cai em
// DATABASE_URL se a separação ainda não tiver sido feita.
const migrationsUrl = process.env.MIGRATIONS_DATABASE_URL ?? process.env.DATABASE_URL;

if (!migrationsUrl) {
  throw new Error("DATABASE_URL (ou MIGRATIONS_DATABASE_URL), ensure the database is provisioned");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  out: path.join(__dirname, "./migrations"),
  dialect: "postgresql",
  dbCredentials: {
    url: migrationsUrl,
  },
});
