import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import {
  drizzle as drizzleNodePg,
  type NodePgDatabase,
} from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import { Pool } from "pg";

/**
 * Database connection with zero-setup local development.
 *
 *  - DATABASE_URL reachable            -> normal PostgreSQL (production/hosting)
 *  - DATABASE_URL missing, or pointing at a local PostgreSQL that is not
 *    running / not accepting the credentials
 *                                      -> built-in embedded PostgreSQL
 *                                         (PGlite) stored in ./.data/pglite
 *
 * Environment overrides:
 *  - DB_DRIVER=postgres   always use DATABASE_URL, never fall back
 *  - DB_DRIVER=embedded   always use the built-in local database
 *  - PGLITE_DATA_DIR=...  where the built-in database keeps its files
 */

export type DatabaseKind = "postgres" | "embedded";

interface DbState {
  db: NodePgDatabase;
  kind: DatabaseKind;
  pool?: Pool;
  pglite?: PGlite;
}

const globalForDb = globalThis as typeof globalThis & {
  __reshmasNeedleDb?: DbState;
};

// Runs in a child process so the choice can be made synchronously at import.
// Exit codes: 0 = connected, 2 = could not connect (message on stderr).
const PROBE_SCRIPT = `
const { Client } = require(process.env.RN_PG_MODULE);
const client = new Client({
  connectionString: process.env.RN_PG_URL,
  connectionTimeoutMillis: 3000,
});
setTimeout(() => { console.error("connection timed out"); process.exit(2); }, 4500);
client.connect()
  .then(() => client.end())
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error && error.message ? error.message : String(error));
    process.exit(2);
  });
`;

function isLocalUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^\[|\]$/g, "");
    return ["localhost", "127.0.0.1", "::1", "0.0.0.0"].includes(host);
  } catch {
    return false;
  }
}

function probePostgres(url: string): { ok: true } | { ok: false; reason: string } {
  try {
    const requireFromProject = createRequire(
      path.join(process.cwd(), "package.json")
    );
    const result = spawnSync(process.execPath, ["-e", PROBE_SCRIPT], {
      cwd: process.cwd(),
      encoding: "utf8",
      timeout: 9000,
      env: {
        ...process.env,
        RN_PG_MODULE: requireFromProject.resolve("pg"),
        RN_PG_URL: url,
      },
    });
    if (result.status === 2) {
      const reason = (result.stderr || "").trim().split("\n").pop() || "unknown";
      return { ok: false, reason };
    }
  } catch {
    // The probe itself could not run: trust the configured database.
  }
  return { ok: true };
}

function createLazyPglite(dataDir: string, reason: string): PGlite {
  let instance: PGlite | null = null;

  const getInstance = (): PGlite => {
    if (!instance) {
      mkdirSync(dataDir, { recursive: true });
      console.log(
        `[db] Using the built-in local database (${reason}). Data folder: ${dataDir}`
      );
      instance = new PGlite(dataDir);
    }
    return instance;
  };

  // Created on first query so builds and idle processes never open the files.
  return new Proxy({} as PGlite, {
    get(_target, property) {
      if (property === "then") return undefined;
      const real = getInstance();
      const value = Reflect.get(real, property, real);
      return typeof value === "function" ? value.bind(real) : value;
    },
  });
}

function createState(): DbState {
  const url = process.env.DATABASE_URL?.trim();
  const mode = (process.env.DB_DRIVER || "auto").toLowerCase();
  const dataDir =
    process.env.PGLITE_DATA_DIR || path.join(process.cwd(), ".data", "pglite");

  let embeddedReason: string | null = null;

  if (mode === "embedded" || mode === "pglite") {
    embeddedReason = "DB_DRIVER=embedded";
  } else if (!url) {
    if (mode === "postgres") {
      throw new Error("DATABASE_URL is required when DB_DRIVER=postgres");
    }
    embeddedReason = "DATABASE_URL is not set";
  } else if (mode !== "postgres" && isLocalUrl(url)) {
    const probe = probePostgres(url);
    if (!probe.ok) {
      embeddedReason = `could not connect to local PostgreSQL: ${probe.reason}`;
    }
  }

  if (embeddedReason) {
    const client = createLazyPglite(dataDir, embeddedReason);
    const db = drizzlePglite({ client }) as unknown as NodePgDatabase;
    return { db, kind: "embedded", pglite: client };
  }

  const pool = new Pool({ connectionString: url });
  return { db: drizzleNodePg(pool), kind: "postgres", pool };
}

const state = globalForDb.__reshmasNeedleDb ?? createState();
globalForDb.__reshmasNeedleDb = state;

export const db = state.db;
export const databaseKind: DatabaseKind = state.kind;

/** Run raw (multi-statement) SQL such as schema creation. */
export async function execRaw(statements: string): Promise<void> {
  if (state.pglite) {
    await state.pglite.exec(statements);
    return;
  }
  await state.pool!.query(statements);
}
