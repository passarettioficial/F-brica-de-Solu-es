import { describe, it, expect, vi } from "vitest";

// checkPrivilegedFieldUpdate é uma função pura, mas vive em adminAuth.ts junto com
// requireAdmin(), que importa @workspace/db (lança se DATABASE_URL ausente) e ./auth
// (que por sua vez importa @clerk/express, ./stripe, etc). Mocka a cadeia toda para
// isolar só a função pura sob teste — nenhum desses mocks é exercitado pelos testes.
vi.mock("@workspace/db", () => ({ db: {}, usersTable: {} }));
vi.mock("./auth", () => ({ ensureUser: vi.fn() }));

const { checkPrivilegedFieldUpdate } = await import("./adminAuth");

describe("checkPrivilegedFieldUpdate", () => {
  it("bloqueia admin comum (isSuperuser=false) tentando alterar isSuperuser de outra conta", () => {
    const result = checkPrivilegedFieldUpdate(
      { clerkId: "admin_1", isSuperuser: false },
      "victim_1",
      { isSuperuser: true },
    );
    expect(result.allowed).toBe(false);
  });

  it("bloqueia admin comum tentando conceder plano pago a si mesmo (bypass de billing)", () => {
    const result = checkPrivilegedFieldUpdate(
      { clerkId: "admin_1", isSuperuser: false },
      "admin_1",
      { plan: "studio" },
    );
    expect(result.allowed).toBe(false);
  });

  it("bloqueia superuser legítimo tentando se auto-promover/auto-alterar (nunca self-target)", () => {
    const result = checkPrivilegedFieldUpdate(
      { clerkId: "super_1", isSuperuser: true },
      "super_1",
      { isSuperuser: true },
    );
    expect(result.allowed).toBe(false);
  });

  it("bloqueia superuser tentando alterar o próprio plano", () => {
    const result = checkPrivilegedFieldUpdate(
      { clerkId: "super_1", isSuperuser: true },
      "super_1",
      { plan: "founder" },
    );
    expect(result.allowed).toBe(false);
  });

  it("permite superuser legítimo alterar isAdmin/isSuperuser/plan de OUTRA conta", () => {
    const result = checkPrivilegedFieldUpdate(
      { clerkId: "super_1", isSuperuser: true },
      "target_1",
      { isAdmin: true, isSuperuser: false, plan: "founder" },
    );
    expect(result.allowed).toBe(true);
  });

  it("permite admin comum editar apenas displayName (campo não sensível) de outra conta", () => {
    const result = checkPrivilegedFieldUpdate(
      { clerkId: "admin_1", isSuperuser: false },
      "target_1",
      {},
    );
    expect(result.allowed).toBe(true);
  });

  it("permite superuser editar o próprio displayName (não é campo privilegiado)", () => {
    const result = checkPrivilegedFieldUpdate(
      { clerkId: "super_1", isSuperuser: true },
      "super_1",
      {},
    );
    expect(result.allowed).toBe(true);
  });

  it("bloqueia superuser tentando setar um plano desconhecido (input arbitrário, não é um dos PLANS)", () => {
    const result = checkPrivilegedFieldUpdate(
      { clerkId: "super_1", isSuperuser: true },
      "target_1",
      { plan: "plano-inventado" },
    );
    expect(result.allowed).toBe(false);
  });

  it("trata isAdmin/isSuperuser explicitamente false como alteração privilegiada (revogação também é sensível)", () => {
    const result = checkPrivilegedFieldUpdate(
      { clerkId: "admin_1", isSuperuser: false },
      "target_1",
      { isAdmin: false },
    );
    expect(result.allowed).toBe(false);
  });
});
