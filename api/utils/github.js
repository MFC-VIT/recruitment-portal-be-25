// Thin GitHub REST helpers (Node 18+ fetch, no extra dependency).
const API = "https://api.github.com";

const gh = async (path, { token, method = "GET", body } = {}) => {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "mfc-recruitment-portal",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
};

// OAuth web flow: swap the ?code from GitHub's redirect for a user token.
const exchangeCode = async (code) => {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  const data = await res.json().catch(() => ({}));
  return data.access_token || null;
};

// Invites a GitHub user id to the club org. Needs GITHUB_ORG and an org-admin
// token in GITHUB_ORG_TOKEN (fine-grained: Members read/write).
const inviteToOrg = async (githubUserId) => {
  const org = process.env.GITHUB_ORG;
  const token = process.env.GITHUB_ORG_TOKEN;
  if (!org || !token) return { status: "disabled", detail: "GitHub org invites are not configured" };
  const res = await gh(`/orgs/${org}/invitations`, {
    token,
    method: "POST",
    body: { invitee_id: githubUserId, role: "direct_member" },
  });
  if (res.ok) return { status: "invited", detail: `Invitation sent to join ${org}` };
  const message = res.data?.errors?.[0]?.message || res.data?.message || `HTTP ${res.status}`;
  if (/already a part|already a member/i.test(message)) {
    return { status: "already-member", detail: `Already in ${org}` };
  }
  return { status: "failed", detail: message };
};

module.exports = { gh, exchangeCode, inviteToOrg };
