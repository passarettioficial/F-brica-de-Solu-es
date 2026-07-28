import { describe, it, expect, vi, beforeEach } from "vitest";

const transactionMock = vi.fn();

vi.mock("@workspace/db", () => ({
  db: { transaction: transactionMock },
}));

const { withAdvisoryLock } = await import("./distributed-lock");

function mockTx(acquired: boolean) {
  return {
    execute: vi.fn().mockResolvedValue({ rows: [{ acquired }] }),
  };
}

describe("withAdvisoryLock", () => {
  beforeEach(() => {
    transactionMock.mockReset();
  });

  it("runs fn when the advisory lock is acquired", async () => {
    const tx = mockTx(true);
    transactionMock.mockImplementationOnce((cb: (tx: unknown) => Promise<void>) => cb(tx));
    const fn = vi.fn().mockResolvedValue(undefined);

    await withAdvisoryLock("retention:test", fn);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("skips fn when another instance already holds the lock", async () => {
    const tx = mockTx(false);
    transactionMock.mockImplementationOnce((cb: (tx: unknown) => Promise<void>) => cb(tx));
    const fn = vi.fn().mockResolvedValue(undefined);

    await withAdvisoryLock("retention:test", fn);

    expect(fn).not.toHaveBeenCalled();
  });
});
