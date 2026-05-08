import type { Handler } from "@netlify/functions";

const REPO     = process.env.GITHUB_REPO ?? "";
const WORKFLOW = process.env.GITHUB_WORKFLOW ?? "";
const COOLDOWN_MS = 60_000; // 60 seconds between dispatches

let lastDispatchTime = 0;

const handler: Handler = async (event) => {
  if (!REPO || !WORKFLOW) {
    return { statusCode: 500, body: JSON.stringify({ error: "GITHUB_REPO or GITHUB_WORKFLOW not configured" }) };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const token = process.env.GITHUB_PAT;
  if (!token) {
    return { statusCode: 500, body: JSON.stringify({ error: "GITHUB_PAT not configured" }) };
  }

  // Simple cooldown — prevents rapid-fire dispatches
  const now = Date.now();
  if (now - lastDispatchTime < COOLDOWN_MS) {
    const waitSec = Math.ceil((COOLDOWN_MS - (now - lastDispatchTime)) / 1000);
    return {
      statusCode: 429,
      body: JSON.stringify({ ok: false, error: `Sync already triggered. Try again in ${waitSec}s.` }),
    };
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({ ref: "main" }),
      }
    );

    if (res.status === 204) {
      lastDispatchTime = now;
      return { statusCode: 200, body: JSON.stringify({ ok: true, message: "Sync triggered" }) };
    }

    const body = await res.text();
    return {
      statusCode: res.status,
      body: JSON.stringify({ ok: false, error: `GitHub API returned ${res.status}`, detail: body }),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: message }) };
  }
};

export { handler };
