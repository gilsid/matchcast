import { test, expect } from "@playwright/test";
import { loginUser, createTournament } from "./helpers";

test.describe("GET /tournaments list", () => {
  test("returns empty list for new user", async ({ request }) => {
    const { token } = await loginUser(request);
    const res = await request.get("/tournaments", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data).toHaveLength(0);
  });

  test("returns user's tournaments sorted by newest first", async ({ request }) => {
    const { token } = await loginUser(request);
    const t1 = await createTournament(request, token, "Tournament A");
    const t2 = await createTournament(request, token, "Tournament B");
    const res = await request.get("/tournaments", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.data).toHaveLength(2);
    expect(body.data[0].name).toBe("Tournament B"); // newest first (createdAt desc)
    expect(body.data[1].name).toBe("Tournament A");
  });

  test("excludes other users' tournaments", async ({ request }) => {
    const user1 = await loginUser(request);
    await createTournament(request, user1.token, "User1 Tourney");
    const user2 = await loginUser(request);
    const res = await request.get("/tournaments", {
      headers: { Authorization: `Bearer ${user2.token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.data).toHaveLength(0);
  });
});
