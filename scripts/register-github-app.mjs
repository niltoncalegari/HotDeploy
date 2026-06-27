#!/usr/bin/env node
/**
 * Register the HotDeploy GitHub App (device flow) and write GITHUB_APP_CLIENT_ID to .env.
 * Prefer the in-app "Register GitHub App" button in Settings → GitHub & CI.
 * Opens the browser once to confirm app creation on GitHub.
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { createServer as createHttpServer } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env");
const callbackPort = 19736;
const callbackPath = "/github-app/callback";
const startPath = "/github-app/start";
const baseUrl = `http://127.0.0.1:${callbackPort}`;
const callbackUrl = `${baseUrl}${callbackPath}`;
const startUrl = `${baseUrl}${startPath}`;
const appHomepage = "https://github.com/niltoncalegari/HotDeploy";

const manifest = {
  name: "HotDeploy Desktop",
  url: appHomepage,
  description:
    "Desktop control panel for Docker Compose deployments on VPS (Hostinger-first)",
  hook_attributes: {
    url: `${appHomepage}/webhook`,
    active: false,
  },
  redirect_url: callbackUrl,
  callback_urls: [callbackUrl],
  public: true,
  default_permissions: {
    actions: "write",
    administration: "write",
    contents: "write",
    environments: "write",
    metadata: "read",
    secrets: "write",
  },
  default_events: [],
  request_oauth_on_install: false,
};

const startPageHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Register HotDeploy GitHub App</title>
  </head>
  <body>
    <p>Redirecting to GitHub to register HotDeploy Desktop…</p>
    <script>
      const manifest = ${JSON.stringify(manifest)};
      const form = document.createElement("form");
      form.method = "post";
      form.action = "https://github.com/settings/apps/new";
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = "manifest";
      input.value = JSON.stringify(manifest);
      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
    </script>
  </body>
</html>`;

function readEnvClientId() {
  try {
    const content = readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const [key, ...rest] = trimmed.split("=");
      if (key?.trim() === "GITHUB_APP_CLIENT_ID") {
        return rest.join("=").trim().replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // .env may not exist yet
  }
  return "";
}

async function deviceFlowWorks(clientId) {
  const body = new URLSearchParams({ client_id: clientId });
  const response = await fetch("https://github.com/login/device/code", {
    method: "POST",
    headers: { Accept: "application/json" },
    body,
  });
  return response.ok;
}

function upsertEnvClientId(clientId) {
  let lines = [];
  try {
    lines = readFileSync(envPath, "utf8").split("\n");
  } catch {
    lines = [
      "# HotDeploy local development flags (optional)",
      "VITE_APP_ENV=development",
    ];
  }

  let found = false;
  const next = lines.map((line) => {
    if (line.startsWith("GITHUB_APP_CLIENT_ID=")) {
      found = true;
      return `GITHUB_APP_CLIENT_ID=${clientId}`;
    }
    return line;
  });

  if (!found) {
    next.push(`GITHUB_APP_CLIENT_ID=${clientId}`);
  }

  writeFileSync(envPath, `${next.join("\n").replace(/\n*$/, "")}\n`, "utf8");
}

function openBrowser(url) {
  if (process.platform === "darwin") {
    execSync(`open "${url}"`);
    return;
  }
  if (process.platform === "win32") {
    execSync(`start "" "${url}"`, { shell: true });
    return;
  }
  execSync(`xdg-open "${url}"`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForDeviceFlow(clientId, slug) {
  if (await deviceFlowWorks(clientId)) {
    return;
  }

  const settingsUrl = `https://github.com/settings/apps/${slug}`;
  console.log("Enable Device Flow in GitHub App settings (one-time)…");
  openBrowser(settingsUrl);

  for (let attempt = 0; attempt < 24; attempt += 1) {
    await sleep(5000);
    if (await deviceFlowWorks(clientId)) {
      console.log("Device flow enabled.");
      return;
    }
  }

  console.warn(
    "Device flow is still disabled. Enable it under Identifying and authorizing users, or use GitHub CLI fallback in the app.",
  );
}

async function registerApp() {
  const code = await new Promise((resolve, reject) => {
    const server = createHttpServer((req, res) => {
      const url = new URL(req.url ?? "/", baseUrl);

      if (url.pathname === startPath) {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(startPageHtml);
        return;
      }

      if (url.pathname !== callbackPath) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      const manifestCode = url.searchParams.get("code");
      if (!manifestCode) {
        res.writeHead(400);
        res.end("Missing code");
        reject(new Error("GitHub callback did not include a code parameter."));
        server.close();
        return;
      }

      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(
        "<h1>HotDeploy GitHub App registered</h1><p>You can close this tab and return to the terminal.</p>",
      );
      resolve(manifestCode);
      server.close();
    });

    server.listen(callbackPort, "127.0.0.1", () => {
      console.log(`Open this URL if the browser did not launch: ${startUrl}`);
      console.log("Confirm app creation on GitHub when prompted…");
      openBrowser(startUrl);
    });

    server.on("error", reject);
    setTimeout(() => {
      server.close();
      reject(
        new Error("Timed out waiting for GitHub callback (5 minutes). Try again."),
      );
    }, 5 * 60 * 1000);
  });

  const conversion = await fetch(
    `https://api.github.com/app-manifests/${code}/conversions`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );

  if (!conversion.ok) {
    const text = await conversion.text();
    throw new Error(
      `GitHub manifest conversion failed (${conversion.status}): ${text}`,
    );
  }

  const payload = await conversion.json();
  if (!payload.client_id) {
    throw new Error("GitHub did not return client_id");
  }

  return payload;
}

async function main() {
  const existing = readEnvClientId();
  if (existing && existing !== "Ov23liHotDeployDesktop") {
    const works = await deviceFlowWorks(existing);
    if (works) {
      console.log(`GITHUB_APP_CLIENT_ID already configured (${existing}).`);
      return;
    }
    console.warn(`Existing client ID ${existing} is invalid — re-registering…`);
  }

  const payload = await registerApp();
  upsertEnvClientId(payload.client_id);
  console.log(`Wrote GITHUB_APP_CLIENT_ID=${payload.client_id} to .env`);

  if (payload.slug) {
    await waitForDeviceFlow(payload.client_id, payload.slug);
  }

  console.log("Restart `pnpm tauri:dev` so Rust picks up the new client ID.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
