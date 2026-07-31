-- Separação de usuário de banco (app runtime vs. DDL/migration) — auditoria de segurança,
-- item deliberadamente estrutural. Rodar UMA VEZ, manualmente, com um usuário que já tenha
-- privilégio de administrador no banco (o mesmo usuário atual, dono das tabelas).
--
-- Por quê: hoje uma única credencial de banco é usada tanto pela aplicação (SELECT/INSERT/
-- UPDATE/DELETE do dia a dia) quanto para aplicar schema (CREATE/ALTER/DROP via push ou
-- migrate). Se a camada de aplicação for comprometida por qualquer vetor (injection, RCE,
-- vazamento da connection string), o atacante herda também o poder de alterar/apagar
-- tabelas inteiras — não só ler/escrever dados de negócio.
--
-- Depois deste script: a aplicação (DATABASE_URL) passa a rodar com um usuário que só
-- consegue SELECT/INSERT/UPDATE/DELETE nas tabelas — nunca CREATE/ALTER/DROP. Schema só
-- muda através de `pnpm --filter db run migrate`, usando MIGRATIONS_DATABASE_URL (a
-- credencial antiga/dona das tabelas, com privilégio completo).
--
-- IMPORTANTE: troque '<SENHA_FORTE_AQUI>' por uma senha gerada (ex: openssl rand -base64 32)
-- e '<NOME_DO_BANCO>' pelo nome real do banco (rode `SELECT current_database();` pra
-- descobrir) antes de rodar. Depois de rodar, atualize os Secrets do Replit:
--   DATABASE_URL              -> connection string usando foundersflow_app (a senha nova)
--   MIGRATIONS_DATABASE_URL   -> a connection string ATUAL (usuário dono das tabelas)
-- Teste a aplicação de ponta a ponta depois da troca antes de considerar concluído — se
-- algum fluxo silenciosamente dependia de privilégio de DDL em runtime (não deveria, mas
-- vale confirmar), ele vai começar a falhar com "permission denied" e vai aparecer nos logs.

CREATE ROLE foundersflow_app WITH LOGIN PASSWORD '<SENHA_FORTE_AQUI>';

GRANT CONNECT ON DATABASE "<NOME_DO_BANCO>" TO foundersflow_app;
GRANT USAGE ON SCHEMA public TO foundersflow_app;

-- Acesso às tabelas que já existem hoje.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO foundersflow_app;
-- Sequências (colunas serial/identity) precisam de USAGE+SELECT para gerar novos IDs.
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO foundersflow_app;

-- Garante que tabelas/sequências criadas por FUTURAS migrations (rodadas pelo usuário
-- dono, via MIGRATIONS_DATABASE_URL) já nasçam com esse mesmo acesso de runtime, sem
-- precisar rodar este script de novo a cada schema change.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO foundersflow_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO foundersflow_app;

-- Explicitamente NÃO concede: CREATE em public (não pode criar tabela nova), nada no
-- schema "drizzle" (tabela de controle de migrations — a aplicação nunca precisa tocar
-- nela). Isso é o núcleo da separação — não é preciso um REVOKE explícito porque
-- privilégios em Postgres são "deny by default": só existe o que foi concedido acima.

-- Verificação rápida depois de rodar (deve retornar 'f' para create_table e 'f' para o
-- schema drizzle não aparecer na lista de schemas com USAGE):
-- SELECT has_schema_privilege('foundersflow_app', 'public', 'CREATE'); -- esperado: f
-- SELECT has_schema_privilege('foundersflow_app', 'drizzle', 'USAGE'); -- esperado: f (ou erro se o schema drizzle ainda não existir)
