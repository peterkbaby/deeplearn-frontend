// Contract fixture only. Never imported by the application.
import http from "node:http";
import { randomUUID } from "node:crypto";
const users = new Map();
const accessTokens = new Map();
const refreshTokens = new Map();
const documents = new Map();
const server = http.createServer(async (req, res) => {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  let body = {};
  try {
    body = JSON.parse(raw);
  } catch {}
  const path = req.url;
  const send = (status, data, headers = {}) => {
    res.writeHead(status, { "Content-Type": "application/json", ...headers });
    res.end(JSON.stringify(data));
  };
  const issue = (user) => {
    const access = randomUUID(),
      refresh = randomUUID();
    accessTokens.set(access, user);
    refreshTokens.set(refresh, user);
    send(
      200,
      { access_token: access, token_type: "bearer" },
      {
        "Set-Cookie": `refresh_token=${refresh}; Path=/; HttpOnly; SameSite=Lax`,
      },
    );
  };
  const refresh = req.headers.cookie?.match(/refresh_token=([^;]+)/)?.[1];
  if (path === "/user-service/register") {
    if (users.has(body.email))
      return send(400, { detail: "Email already registered" });
    const user = {
      id: randomUUID(),
      name: body.name,
      email: body.email,
      password: body.password,
      provider: "local",
      role: "user",
      onboarding: false,
      username: null,
      profile_pic_url: null,
      created_at: new Date().toISOString(),
    };
    users.set(user.email, user);
    return send(201, user);
  }
  if (path === "/user-service/login") {
    if (body.email === "limited@example.com")
      return send(429, { detail: "Rate limit exceeded" });
    const user = users.get(body.email);
    if (!user || user.password !== body.password)
      return send(401, { detail: "Invalid email or password" });
    return issue(user);
  }
  if (path === "/user-service/refresh") {
    const user = refreshTokens.get(refresh);
    if (!user) return send(401, { detail: "Invalid refresh token" });
    refreshTokens.delete(refresh);
    return issue(user);
  }
  if (path === "/user-service/logout") {
    refreshTokens.delete(refresh);
    return send(
      200,
      { detail: "Logged out successfully" },
      {
        "Set-Cookie":
          "refresh_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax",
      },
    );
  }
  const user = accessTokens.get(
    req.headers.authorization?.replace("Bearer ", ""),
  );
  if (!user) return send(401, { detail: "Invalid or expired token" });
  if (path === "/user-service/me") {
    const { password, ...publicUser } = user;
    void password;
    return send(200, publicUser);
  }
  if (path === "/user-service/onboarding") {
    user.onboarding = true;
    user.username = body.username;
    return send(200, { detail: "Onboarding completed successfully" });
  }
  if (path === "/user-service/profile/upload-pic")
    return send(200, {
      detail: "Profile picture uploaded successfully",
      profile_pic_url: null,
    });
  if (path === "/docmind/documents" && req.method === "GET")
    return send(200, {
      documents: [...documents.values()].filter(
        (document) => document.owner_id === user.id,
      ),
      total: documents.size,
    });
  if (path === "/docmind/documents/upload" && req.method === "POST") {
    const document = {
      id: randomUUID(),
      owner_id: user.id,
      filename: "sample.pdf",
      title: "sample.pdf",
      storage_key: `pdfs/${user.id}/sample.pdf`,
      page_count: 4,
      status: "ready",
      created_at: new Date().toISOString(),
    };
    documents.set(document.id, document);
    return send(200, {
      data: document,
      summary: {
        document_id: document.id,
        summary: "**Main idea**\n\n- First point\n- Second point",
        source_pages: [1, 2],
      },
    });
  }
  const contentMatch = path?.match(/^\/docmind\/documents\/([^/]+)\/content$/);
  if (contentMatch && req.method === "GET") {
    const document = documents.get(contentMatch[1]);
    if (!document || document.owner_id !== user.id)
      return send(404, { detail: "Document not found" });
    res.writeHead(200, {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="sample.pdf"',
    });
    return res.end(Buffer.from("%PDF-1.4 sample preview"));
  }
  const documentMatch = path?.match(/^\/docmind\/documents\/([^/]+)$/);
  if (documentMatch) {
    const document = documents.get(documentMatch[1]);
    if (!document || document.owner_id !== user.id)
      return send(404, { detail: "Document not found" });
    if (req.method === "DELETE") {
      documents.delete(document.id);
      return send(200, { detail: "Document deleted" });
    }
    return send(200, document);
  }
  const summaryMatch = path?.match(
    /^\/summaries\/documents\/([^/]+)\/summary$/,
  );
  if (summaryMatch && req.method === "POST") {
    const document = documents.get(summaryMatch[1]);
    if (!document || document.owner_id !== user.id)
      return send(404, { detail: "Document not found" });
    return send(200, {
      document_id: document.id,
      summary: "**Main idea**\n\n- First point\n- Second point",
      source_pages: [1, 2],
    });
  }
  if (path === "/docmind/chat" && req.method === "POST")
    return send(200, {
      answer: `The document answers: ${body.question}`,
      source_pages: [2],
      chunks_used: 3,
    });
  send(404, { detail: "Not found" });
});
server.listen(8100, "127.0.0.1");
