import { getBackend, getAuthToken, getRootToken } from "./setup";
import { Filter } from "../src/backend";

describe("Sudo/Admin Operations", () => {
  let backend = getBackend();

  test("should get token for another account", async () => {
    const rootToken = getRootToken();

    // First create a test user
    const email = `sudo_test_${Date.now()}@test.com`;
    const registerResult = await backend.register(email, "password123");
    expect(registerResult.ok).toBe(true);

    const userToken = registerResult.content;

    // Get account info
    const meResult = await backend.me(userToken);
    expect(meResult.ok).toBe(true);
    const accountId = meResult.content.accountId;

    // Get token for that user via sudo
    const result = await backend.sudoGetToken(rootToken, accountId);
    expect(result.ok).toBe(true);
    expect(result.content).toBeDefined();
  });

  test("should list documents via sudo", async () => {
    const rootToken = getRootToken();

    const result = await backend.sudoList(rootToken, "tasks", {
      page: 1,
      size: 10,
      descending: false,
    });

    expect(result.ok).toBe(true);
    expect(result.content.results).toBeDefined();
  });

  test("should get document by ID via sudo", async () => {
    const token = await getAuthToken();
    const rootToken = getRootToken();

    // Create a document first
    const createResult = await backend.create(token, "tasks", {
      name: "sudo-test",
      done: false,
    });
    expect(createResult.ok).toBe(true);

    // Get via sudo
    const result = await backend.sudoGetById(
      rootToken,
      "tasks",
      createResult.content.id
    );
    expect(result.ok).toBe(true);
    expect(result.content.id).toBe(createResult.content.id);
  });

  test("should get documents by IDs via sudo", async () => {
    const token = await getAuthToken();
    const rootToken = getRootToken();

    // Create documents
    const task1 = await backend.create(token, "tasks", {
      name: "sudo-1",
      done: false,
    });
    const task2 = await backend.create(token, "tasks", {
      name: "sudo-2",
      done: false,
    });

    expect(task1.ok && task2.ok).toBe(true);

    const ids = [task1.content.id, task2.content.id];
    const result = await backend.sudoGetByIds(rootToken, "tasks", ids);

    expect(result.ok).toBe(true);
    expect(result.content.length).toBe(2);
  });

  test("should update document via sudo", async () => {
    const token = await getAuthToken();
    const rootToken = getRootToken();

    // Create a document first
    const createResult = await backend.create(token, "tasks", {
      name: "original",
      done: false,
    });
    expect(createResult.ok).toBe(true);

    // Update via sudo
    const updateResult = await backend.sudoUpdate(
      rootToken,
      "tasks",
      createResult.content.id,
      { name: "sudo-updated", done: true }
    );
    expect(updateResult.ok).toBe(true);

    // Verify
    const getResult = await backend.getById(
      token,
      "tasks",
      createResult.content.id
    );
    expect(getResult.ok).toBe(true);
    expect(getResult.content.name).toBe("sudo-updated");
  });

  test("should query documents via sudo", async () => {
    const token = await getAuthToken();
    const rootToken = getRootToken();

    // Create test documents
    await backend.create(token, "tasks", {
      name: "sudo-query-test",
      done: true,
    });

    const filters: Filter[] = [["name", "==", "sudo-query-test"]];
    const result = await backend.sudoQuery(rootToken, "tasks", filters);

    expect(result.ok).toBe(true);
    if (result.content.results) {
      expect(result.content.results.length).toBeGreaterThanOrEqual(1);
    }
  });

  test("should add index via sudo", async () => {
    const rootToken = getRootToken();

    const result = await backend.sudoAddIndex(rootToken, "tasks", "name");

    expect(result.ok).toBe(true);
  });

  test("should cache get and set", async () => {
    const rootToken = getRootToken();

    const key = `test_cache_${Date.now()}`;
    const value = { test: "data", number: 42 };

    // Set cache
    const setResult = await backend.cacheSet(rootToken, key, value);
    expect(setResult.ok).toBe(true);

    // Get cache
    const getResult = await backend.cacheGet(rootToken, key);
    expect(getResult.ok).toBe(true);
    expect(getResult.content).toBeDefined();

    const cachedValue = JSON.parse(getResult.content);
    expect(cachedValue.test).toBe("data");
    expect(cachedValue.number).toBe(42);
  });
});
