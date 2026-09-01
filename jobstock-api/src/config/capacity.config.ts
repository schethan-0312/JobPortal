type EnvironmentReader = (name: string) => string | undefined;

function readBoundedInteger(
  read: EnvironmentReader,
  name: string,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const rawValue = read(name);
  if (!rawValue) return fallback;

  const value = Number(rawValue);
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    console.warn(
      `${name} must be an integer between ${minimum} and ${maximum}; using ${fallback}.`,
    );
    return fallback;
  }

  return value;
}

/**
 * Runtime limits are intentionally environment-driven so a deployment can be
 * tuned without a code change. The defaults preserve the existing database and
 * rate-limit behaviour while placing a safer cap on JSON request bodies.
 */
export function getCapacityConfig(read: EnvironmentReader = (name) => process.env[name]) {
  return {
    bodyLimit: `${readBoundedInteger(read, 'API_BODY_LIMIT_MB', 2, 1, 20)}mb`,
    trustProxyHops: readBoundedInteger(read, 'TRUST_PROXY_HOPS', 0, 0, 10),
    rateLimit: {
      limit: readBoundedInteger(read, 'API_RATE_LIMIT_MAX', 60, 10, 100_000),
      ttlMs: readBoundedInteger(read, 'API_RATE_LIMIT_TTL_MS', 60_000, 1_000, 3_600_000),
    },
    databasePool: {
      max: readBoundedInteger(read, 'DATABASE_POOL_MAX', 10, 1, 100),
      idleTimeoutMs: readBoundedInteger(
        read,
        'DATABASE_POOL_IDLE_TIMEOUT_MS',
        10_000,
        1_000,
        300_000,
      ),
      connectionTimeoutMs: readBoundedInteger(
        read,
        'DATABASE_POOL_CONNECTION_TIMEOUT_MS',
        0,
        0,
        60_000,
      ),
    },
    ai: {
      maxConcurrent: readBoundedInteger(read, 'AI_MAX_CONCURRENT_REQUESTS', 4, 1, 50),
      maxQueued: readBoundedInteger(read, 'AI_MAX_QUEUED_REQUESTS', 10, 0, 100),
      documentUploadLimit: `${readBoundedInteger(
        read,
        'AI_DOCUMENT_MAX_MB',
        10,
        1,
        20,
      )}mb`,
    },
  };
}
