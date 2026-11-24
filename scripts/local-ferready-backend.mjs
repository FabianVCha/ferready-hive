/**
 * Local-only launcher for this derived project. It never trusts an inherited
 * DATABASE_URL and never writes Docker credentials into repository files.
 */
import { execFileSync, spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";

const allowed = {
  dev: ["develop"],
  migrate: ["db:migrate"],
  search: ["db:migrate:search"],
  import: ["exec", "./src/scripts/import-catalog.ts"],
};
const command = allowed[process.argv[2] ?? "dev"];
if (!command) throw new Error("Use dev, migrate, search or import");
const [container] = JSON.parse(execFileSync("docker", ["inspect", "hive-web-db"], { encoding: "utf8" }));
const binding = container.NetworkSettings.Ports["5432/tcp"]?.[0];
if (binding?.HostIp !== "127.0.0.1" || binding?.HostPort !== "55433") {
  throw new Error("Refusing an unexpected database listener");
}
const values = Object.fromEntries(container.Config.Env.map((item) => {
  const at = item.indexOf("=");
  return [item.slice(0, at), item.slice(at + 1)];
}));
if (!values.POSTGRES_USER || !values.POSTGRES_PASSWORD) throw new Error("Missing local database credentials");
const token = () => randomBytes(32).toString("hex");
const env = {
  ...process.env,
  DATABASE_URL: `postgres://${encodeURIComponent(values.POSTGRES_USER)}:${encodeURIComponent(values.POSTGRES_PASSWORD)}@127.0.0.1:55433/ferready_hive`,
  STORE_CORS: "http://localhost:8000",
  ADMIN_CORS: "http://localhost:9000",
  AUTH_CORS: "http://localhost:8000,http://localhost:9000",
  JWT_SECRET: token(),
  COOKIE_SECRET: token(),
};
console.log(`Using local ferready_hive on 127.0.0.1:55433 (${process.argv[2] ?? "dev"}).`);
const child = spawn("npx", ["--no-install", "medusa", ...command], {
  cwd: fileURLToPath(new URL("../apps/backend/", import.meta.url)),
  env,
  stdio: "inherit",
});
child.on("exit", (code) => { process.exitCode = code ?? 1; });
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
