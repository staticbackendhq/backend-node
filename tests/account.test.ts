import { getBackend, getAuthToken } from "./setup";

describe("Account Management", () => {
  let backend = getBackend();

  test("should register and login", async () => {
    const email = `unit_${Date.now()}@test.com`;
    const password = "unit";

    // Register
    const registerResult = await backend.register(email, password);
    expect(registerResult.ok).toBe(true);

    // Login
    const loginResult = await backend.login(email, password);
    expect(loginResult.ok).toBe(true);
    expect(loginResult.content).toBeDefined();
    expect(typeof loginResult.content).toBe('string');

    const authToken = loginResult.content;

    // Add user
    const addUserResult = await backend.addUser(
      authToken,
      "user2@ok.com",
      "passwd1234"
    );
    expect(addUserResult.ok).toBe(true);

    // Get users
    const usersResult = await backend.users(authToken);
    expect(usersResult.ok).toBe(true);
    expect(Array.isArray(usersResult.content)).toBe(true);

    // Find the added user
    let userID: string | undefined;
    for (const user of usersResult.content) {
      if (user.email === "user2@ok.com") {
        userID = user.id;
        break;
      }
    }

    expect(userID).toBeDefined();

    // Remove user
    const token = await getAuthToken();
    const removeResult = await backend.removeUser(token, userID!);
    expect(removeResult.ok).toBe(true);

    // Verify user is removed
    const usersAfterRemove = await backend.users(token);
    expect(usersAfterRemove.ok).toBe(true);

    const found = usersAfterRemove.content.some(
      (user: any) => user.id === userID
    );
    expect(found).toBe(false);
  });

  test("should get user info with me()", async () => {
    const token = await getAuthToken();
    const result = await backend.me(token);

    expect(result.ok).toBe(true);
    expect(result.content).toBeDefined();
    expect(result.content.email).toBe("admin@dev.com");
  });
});
