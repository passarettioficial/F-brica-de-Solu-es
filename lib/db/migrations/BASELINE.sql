-- Baseline de adoção de migrations versionadas — rodar UMA VEZ, manualmente, contra o
-- banco de produção (Replit) que já foi construído inteiramente via `drizzle-kit push`.
--
-- Por quê: `drizzle-kit migrate` (e o `db.migrate()` do drizzle-orm que ele usa por baixo)
-- decide o que aplicar comparando a tabela de controle `drizzle.__drizzle_migrations` com
-- os arquivos em migrations/. Sem esse passo, ele tentaria rodar 0000_elite_rage.sql do
-- zero — e todo CREATE TABLE falharia com "relation already exists", porque essas tabelas
-- já existem (foram criadas via push).
--
-- Este script marca a migration 0000_elite_rage (que representa o schema exatamente como
-- ele está hoje) como "já aplicada", sem executar nenhum CREATE TABLE/ALTER de verdade.
-- Não apaga nem altera nenhum dado existente.
--
-- O hash e o timestamp abaixo foram gerados junto com migrations/0000_elite_rage.sql
-- (rodando `pnpm --filter db run generate` neste commit) e são específicos DESSE arquivo —
-- se ele for regenerado/editado, este script fica desatualizado e não deve ser reutilizado.
--
-- ⚠️ ORDEM IMPORTA — rode nesta sequência, no Replit Shell (único lugar com acesso ao banco):
--   1. `pnpm --filter db run push` — AINDA é necessário rodar isso uma última vez antes do
--      baseline, para aplicar as colunas/tabela pendentes das Ondas 1 e 2 da auditoria de
--      segurança (pendingCheckoutSessionId, pendingCheckoutExpiresAt, webhook_events) que
--      só existem no código até agora. Sem isso, o baseline abaixo faria o drizzle achar
--      que o banco já tem essas colunas quando na verdade não tem — erros de "column does
--      not exist" em runtime, não no momento da migration.
--   2. `psql "$DATABASE_URL" -f lib/db/migrations/BASELINE.sql` (ou cole o conteúdo abaixo
--      num client SQL conectado ao banco).
--   3. A partir daqui, nunca mais rodar `push`/`push-force` — usar generate+migrate (ver
--      nota no fim deste arquivo).

CREATE SCHEMA IF NOT EXISTS drizzle;

CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
  id SERIAL PRIMARY KEY,
  hash text NOT NULL,
  created_at bigint
);

INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
VALUES (
  '978310e730f47ce01f7e9dc85ebb864def9cc8cd799325a990ef870bc4d10bd1',
  1785484291932
);

-- Depois de rodar isto uma vez: qualquer mudança de schema FUTURA deve ser feita editando
-- lib/db/src/schema/*.ts, rodando `pnpm --filter db run generate` (gera um novo arquivo
-- 0001_*.sql localmente, sem tocar no banco) e então `pnpm --filter db run migrate`
-- (aplica de verdade). Não usar mais `pnpm --filter db run push`/`push-force` a partir
-- daqui — misturar push com migrations versionadas causa drift entre o que o banco real
-- tem e o que os arquivos de migration dizem que deveria ter.
