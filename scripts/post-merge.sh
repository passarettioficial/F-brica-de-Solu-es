#!/bin/bash
set -e
pnpm install --frozen-lockfile

# `pnpm --filter db push` foi removido deliberadamente daqui (auditoria de
# 2026-07-29): aplicar `drizzle-kit push` em produção a cada merge, sem
# revisão e sem migração versionada/reversível, arrisca perda de dados
# silenciosa em mudanças destrutivas de schema (coluna renomeada/removida).
#
# Ao mudar o schema em lib/db/src/schema/, aplique manualmente após revisar:
#   pnpm --filter db push
