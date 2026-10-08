import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const contract = JSON.parse(readFileSync(new URL("contracts/sdk-v1.json", root), "utf8"));

function sourceFiles(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? sourceFiles(path) : path.endsWith(".ts") ? [path] : [];
  });
}

const source = sourceFiles(fileURLToPath(new URL("src", root))).map((path) => readFileSync(path, "utf8")).join("\n");
const missing = [];

for (const operation of contract.operations.filter(({ consumers = [] }) => consumers.includes("node"))) {
  const sdkPath = operation.path.replace(/^\/v1/, "");
  const method = operation.method === "GET" ? "get" : "post";
  const methodPattern = new RegExp(`\\.${method}\\(\\s*["']${sdkPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`);
  const publicPostPattern = new RegExp(`\\.publicPost\\(\\s*["']${sdkPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`);

  if (!methodPattern.test(source) && !(operation.id === "checkout.create" && publicPostPattern.test(source))) {
    missing.push(`${operation.id}: ${operation.method} ${sdkPath}`);
  }
}

if (missing.length > 0) {
  console.error(`Node SDK contract ${contract.contract_version} failed:\n- ${missing.join("\n- ")}`);
  process.exit(1);
}

console.log(`Node SDK contract ${contract.contract_version} passed.`);
