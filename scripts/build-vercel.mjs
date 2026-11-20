// Builds the Vercel Build Output API layout in .vercel/output:
//   static/                      the Vite client build
//   functions/api.func/          the Express API, bundled into one ESM file
// Run from the repo root: `npm run build:vercel`.
import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import { cp, mkdir, rm, writeFile } from "node:fs/promises";

/* global console, process */
const out = ".vercel/output";
const fn = `${out}/functions/api.func`;

const client = spawnSync("npm", ["run", "build", "-w", "client"], { stdio: "inherit", shell: true });
if (client.status !== 0) process.exit(client.status ?? 1);

await rm(out, { recursive: true, force: true });
await mkdir(fn, { recursive: true });
await cp("client/dist", `${out}/static`, { recursive: true });

await build({
  entryPoints: ["server/src/serverless.ts"],
  outfile: `${fn}/index.mjs`,
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  // CommonJS deps bundled into ESM need a real require().
  banner: { js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);' },
  logLevel: "info",
});

await writeFile(
  `${fn}/.vc-config.json`,
  JSON.stringify({ runtime: "nodejs22.x", handler: "index.mjs", launcherType: "Nodejs", shouldAddHelpers: false }, null, 2),
);
await writeFile(`${fn}/package.json`, JSON.stringify({ type: "module" }));

await writeFile(
  `${out}/config.json`,
  JSON.stringify(
    {
      version: 3,
      routes: [
        { src: "/api/(.*)", dest: "/api" },
        { handle: "filesystem" },
        { src: "/(.*)", dest: "/index.html" },
      ],
    },
    null,
    2,
  ),
);

console.log("Vercel output ready in", out);
