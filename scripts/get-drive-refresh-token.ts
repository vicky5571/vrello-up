#!/usr/bin/env tsx
/**
 * scripts/get-drive-refresh-token.ts
 *
 * One-time CLI tool to generate a Google Drive OAuth2 Refresh Token for the developer account.
 * Uses native Node.js http and child_process. Zero external dependencies.
 *
 * Usage:
 *   npm run drive:token
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { exec } from "node:child_process";

const PORT = 3333;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;
const SCOPE = "https://www.googleapis.com/auth/drive.file";

function loadEnvFile(filePath: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!fs.existsSync(filePath)) return result;
  const content = fs.readFileSync(filePath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx <= 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    result[key] = val;
  }
  return result;
}

const ROOT = process.cwd();
const envLocal = loadEnvFile(path.join(ROOT, ".env.local"));
const envBase = loadEnvFile(path.join(ROOT, ".env"));
const mergedEnv = { ...envBase, ...envLocal, ...process.env };

const clientId =
  mergedEnv.GOOGLE_CLIENT_ID ||
  mergedEnv.AUTH_GOOGLE_ID ||
  mergedEnv.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  "";

const clientSecret =
  mergedEnv.GOOGLE_CLIENT_SECRET ||
  mergedEnv.AUTH_GOOGLE_SECRET ||
  "";

console.log("\n=======================================================");
console.log(" Google Drive Refresh Token Generator (Developer Setup) ");
console.log("=======================================================\n");

if (!clientId) {
  console.error("❌ Missing Google Client ID.");
  console.error("Please ensure AUTH_GOOGLE_ID or NEXT_PUBLIC_GOOGLE_CLIENT_ID is defined in .env.local\n");
  process.exit(1);
}

if (!clientSecret) {
  console.error("❌ Missing Google Client Secret.");
  console.error("Please add AUTH_GOOGLE_SECRET or GOOGLE_CLIENT_SECRET in .env.local to continue.\n");
  process.exit(1);
}

console.log(`Using Client ID: ${clientId.slice(0, 24)}...`);
console.log(`Callback URI:    ${REDIRECT_URI}\n`);
console.log("⚠️  IMPORTANT: Make sure this URI is in your Google Cloud Console:");
console.log(`   APIs & Services > Credentials > Your OAuth 2.0 Client`);
console.log(`   Under 'Authorized redirect URIs', add: ${REDIRECT_URI}\n`);

const authUrl =
  `https://accounts.google.com/o/oauth2/v2/auth?` +
  new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
  }).toString();

const server = http.createServer(async (req, res) => {
  if (!req.url) return;
  const parsed = new URL(req.url, `http://localhost:${PORT}`);

  if (parsed.pathname === "/callback") {
    const code = parsed.searchParams.get("code");
    const error = parsed.searchParams.get("error");

    if (error) {
      res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`<h3>❌ Authorization failed: ${error}</h3><p>You can close this tab.</p>`);
      console.error(`\n❌ Authorization returned error: ${error}\n`);
      server.close();
      process.exit(1);
    }

    if (!code) {
      res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
      res.end("<h3>❌ No code received in callback</h3>");
      return;
    }

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(
      `<div style="font-family: system-ui, sans-serif; padding: 40px; text-align: center;">` +
        `<h2 style="color: #16a34a;">✅ Authorization Successful!</h2>` +
        `<p>Your Google Drive Refresh Token has been generated in your terminal.</p>` +
        `<p style="color: #64748b;">You can safely close this browser window and return to your terminal.</p>` +
        `</div>`
    );

    console.log("Exchanging authorization code for tokens with Google...");

    try {
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: REDIRECT_URI,
          grant_type: "authorization_code",
        }),
      });

      const tokenData = await tokenRes.json();

      if (!tokenRes.ok || tokenData.error) {
        console.error("❌ Token exchange failed:", tokenData);
        server.close();
        process.exit(1);
      }

      const refreshToken = tokenData.refresh_token;

      if (!refreshToken) {
        console.warn("⚠️  Google did not return a refresh token.");
        console.warn("This happens if access was already granted without prompt=consent.");
        console.warn("Response payload:", tokenData);
      } else {
        console.log("\n=======================================================");
        console.log("🎉 SUCCESS! Add this to your .env.local file:");
        console.log("=======================================================\n");
        console.log(`GOOGLE_DRIVE_REFRESH_TOKEN="${refreshToken}"\n`);
        console.log("=======================================================\n");
      }
    } catch (err) {
      console.error("❌ Failed to contact Google token endpoint:", err);
    } finally {
      server.close();
      process.exit(0);
    }
  }
});

server.listen(PORT, () => {
  console.log(`Waiting for authorization at ${REDIRECT_URI}...`);
  console.log(`Opening browser to Google authorization screen:\n${authUrl}\n`);
  
  const startCmd =
    process.platform === "darwin"
      ? `open "${authUrl}"`
      : process.platform === "win32"
      ? `start "" "${authUrl}"`
      : `xdg-open "${authUrl}"`;

  exec(startCmd, (err) => {
    if (err) {
      console.log("ℹ️  Could not open browser automatically. Please open the URL manually above.");
    }
  });
});

