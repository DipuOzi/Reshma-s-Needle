#!/usr/bin/env node
// Setup checker for Reshma's Needle.   Run:  node scripts/doctor.mjs
// Tells you exactly what is wrong (if anything) before you start the site.

import { existsSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);
const require = createRequire(path.join(root, "package.json"));

const EXPECTED_IMAGES = [
  "hero-editorial.jpg",
  "collection-three-piece.jpg",
  "collection-two-piece.jpg",
  "collection-tops.jpg",
  "atelier-craftsmanship.jpg",
  "product-velvet-wine.jpg",
  "product-ivory-zari.jpg",
  "product-sage-co-ord.jpg",
  "product-wine-tunic.jpg",
  "tailoring-mannequin-3d.jpg",
];

let failures = 0;
const ok = (message) => console.log(`  \u2714  ${message}`);
const info = (message) => console.log(`  \u2139  ${message}`);
const fail = (message, fix) => {
  failures += 1;
  console.log(`  \u2716  ${message}`);
  if (fix) console.log(`       \u2192 ${fix}`);
};

function loadEnvFile(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (match && !(match[1] in process.env)) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

console.log("\nReshma's Needle \u2014 setup check\n");

// 1. Node.js version -------------------------------------------------------
console.log("Node.js");
const [major, minor] = process.versions.node.split(".").map(Number);
if (major > 20 || (major === 20 && minor >= 9)) {
  ok(`Node ${process.versions.node}`);
} else {
  fail(
    `Node ${process.versions.node} is too old (need 20.9 or newer)`,
    "Install the current LTS from https://nodejs.org and run this again."
  );
}

// 2. Dependencies ----------------------------------------------------------
console.log("\nDependencies");
if (!existsSync("node_modules/next/package.json")) {
  fail("node_modules is missing", "Run: npm install");
} else {
  const natives = [
    ["lightningcss", "styles"],
    ["@tailwindcss/oxide", "Tailwind CSS"],
    ["sharp", "image tools"],
    ["@electric-sql/pglite", "built-in database"],
    ["pg", "PostgreSQL client"],
  ];
  let broken = false;
  for (const [pkg, label] of natives) {
    try {
      require(pkg);
    } catch (error) {
      broken = true;
      fail(
        `${label} (${pkg}) cannot load: ${String(error.message).split("\n")[0]}`
      );
    }
  }
  if (broken) {
    console.log(
      "       \u2192 node_modules was probably copied from another computer. Delete the\n" +
        "         node_modules and .next folders, then run: npm install"
    );
  } else {
    ok("all packages load on this computer");
  }
}

// 3. Images ----------------------------------------------------------------
console.log("\nImages (public/images)");
const missing = EXPECTED_IMAGES.filter((file) => {
  const full = path.join("public", "images", file);
  return !existsSync(full) || statSync(full).size < 1000;
});
const notEmbedded = EXPECTED_IMAGES.filter(
  (file) =>
    !existsSync(
      path.join("src", "lib", "embeddedImages", "data", `${file.replace(/[^a-zA-Z0-9]+/g, "_")}.ts`)
    )
);
if (missing.length === 0) {
  ok(`all ${EXPECTED_IMAGES.length} boutique images are present`);
} else if (missing.every((file) => !notEmbedded.includes(file))) {
  info(`${missing.length} picture file(s) not found in public/images: ${missing.join(", ")}`);
  ok("no problem: built-in copies stored inside the code will be shown instead");
} else {
  fail(
    `${missing.length} image file(s) missing, and no built-in copy exists for: ${notEmbedded.join(", ")}`,
    "Copy the whole project folder again (including src/lib/embeddedImages and public)."
  );
}

// 4. Database --------------------------------------------------------------
console.log("\nDatabase");
loadEnvFile(".env.local");
loadEnvFile(".env");
const url = (process.env.DATABASE_URL || "").trim();
const driver = (process.env.DB_DRIVER || "auto").toLowerCase();

async function canConnect(connectionString) {
  const { Client } = require("pg");
  const client = new Client({ connectionString, connectionTimeoutMillis: 3000 });
  try {
    await client.connect();
    await client.end();
    return null;
  } catch (error) {
    return String(error.message).split("\n")[0];
  }
}

if (driver === "embedded" || driver === "pglite") {
  ok("DB_DRIVER=embedded \u2192 using the built-in local database (.data/pglite)");
} else if (!url) {
  ok("no DATABASE_URL \u2192 using the built-in local database (.data/pglite)");
} else {
  const safeUrl = url.replace(/(:\/\/[^:]+:)[^@]+@/, "$1****@");
  let problem = null;
  try {
    problem = await canConnect(url);
  } catch (error) {
    problem = String(error.message);
  }
  if (!problem) {
    ok(`PostgreSQL reachable (${safeUrl})`);
  } else if (driver === "postgres") {
    fail(`PostgreSQL not reachable (${safeUrl}): ${problem}`, "Start PostgreSQL or remove DB_DRIVER=postgres.");
  } else {
    info(`PostgreSQL not reachable (${safeUrl}): ${problem}`);
    ok("the site will automatically use the built-in local database (.data/pglite)");
  }
}

// 5. Port ------------------------------------------------------------------
console.log("\nPort");
const portFree = await new Promise((resolve) => {
  const server = net.createServer();
  server.once("error", () => resolve(false));
  server.once("listening", () => server.close(() => resolve(true)));
  server.listen(3000, "0.0.0.0");
});
if (portFree) ok("port 3000 is free");
else info("port 3000 is busy \u2014 start the site on another port: npm run dev -- -p 3001");

console.log(
  failures === 0
    ? "\nAll good. Start the site with:  npm run dev   \u2192 http://localhost:3000\n"
    : `\n${failures} problem(s) found. Fix the items marked \u2716 above, then run this check again.\n`
);
process.exit(failures === 0 ? 0 : 1);
