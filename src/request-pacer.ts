export function createRequestPacer(minimumIntervalMs: number): () => Promise<void> {
  if (!Number.isFinite(minimumIntervalMs) || minimumIntervalMs < 0) {
    throw new RangeError("The minimum request interval must be a non-negative number.");
  }

  let nextRequestAt = 0;
  let queue = Promise.resolve();

  return async () => {
    const previous = queue;
    let release!: () => void;
    queue = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      const delayMs = Math.max(0, nextRequestAt - Date.now());
      if (delayMs > 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
      }
      nextRequestAt = Date.now() + minimumIntervalMs;
    } finally {
      release();
    }
  };
}
