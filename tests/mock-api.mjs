// Contract fixture only. Never imported by the application.
import http from "node:http";
import { randomUUID } from "node:crypto";
const users = new Map();
const accessTokens = new Map();
const refreshTokens = new Map();
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
        "Set-Cookie": `refresh_token=${refresh}; Path=/user-service; HttpOnly; Secure; SameSite=Lax`,
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
    return send(200, user);
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
    return send(200, { detail: "Logged out successfully" });
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
  send(404, { detail: "Not found" });
});
server.listen(8100, "127.0.0.1");
