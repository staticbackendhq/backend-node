import fetch from "node-fetch";
import { Backend, FunctionData } from "../src/backend";

jest.mock("node-fetch", () => jest.fn());

const mockedFetch = fetch as unknown as jest.Mock;

function mockResponse(content: any = true, contentType = "application/json") {
  const text = typeof content === "string" ? content : JSON.stringify(content);
  mockedFetch.mockResolvedValue({
    status: 200,
    text: jest.fn().mockResolvedValue(text),
    headers: {
      get: jest.fn().mockReturnValue(contentType),
    },
  });
}

function lastRequest() {
  return mockedFetch.mock.calls[mockedFetch.mock.calls.length - 1];
}

describe("API route construction", () => {
  let backend: Backend;

  beforeEach(() => {
    mockedFetch.mockReset();
    mockResponse();
    backend = new Backend("public-key", "dev");
  });

  test("uses current account and membership routes", async () => {
    await backend.emailExists("person+tag@example.com");
    expect(lastRequest()[0]).toBe(
      "http://localhost:8099/email?e=person%2Btag%40example.com",
    );

    await backend.getPasswordResetCode("root-token", "person@example.com");
    expect(lastRequest()[0]).toBe(
      "http://localhost:8099/password/resetcode?e=person%40example.com",
    );

    await backend.sudoGetUserAccounts("root-token", "person@example.com");
    expect(lastRequest()[0]).toBe(
      "http://localhost:8099/account/user-accounts?email=person%40example.com",
    );
  });

  test("uses current storage and publish routes", async () => {
    await backend.storageUsage("token");
    expect(lastRequest()[0]).toBe("http://localhost:8099/storage/usage");

    await backend.listFiles("token", { page: 2, sort: "size" });
    expect(lastRequest()[0]).toBe(
      "http://localhost:8099/storage/files?page=2&sort=size",
    );

    await backend.publish("root-token", "jobs", "created", { id: "123" });
    expect(lastRequest()[0]).toBe("http://localhost:8099/publish-message");
    expect(JSON.parse(lastRequest()[1].body).data).toBe('{"id":"123"}');
  });

  test("supports server-only database and function routes", async () => {
    await backend.sudoCreate("root-token", "tasks", { name: "created" });
    expect(lastRequest()[0]).toBe("http://localhost:8099/sudo/tasks");

    await backend.sudoListRepositories("root-token");
    expect(lastRequest()[0]).toBe("http://localhost:8099/sudolistall");

    await backend.sudoAddIndex("root-token", "tasks", "done", "boolean");
    expect(lastRequest()[0]).toBe(
      "http://localhost:8099/sudo/index?col=tasks&field=done&type=boolean",
    );

    const fn: FunctionData = {
      name: "sync-search",
      trigger: "tasks.created",
      code: "return true;",
    };
    await backend.addFunction("root-token", fn);
    expect(lastRequest()[0]).toBe("http://localhost:8099/fn/add");

    await backend.functionInfo("root-token", "sync-search");
    expect(lastRequest()[0]).toBe("http://localhost:8099/fn/info/sync-search");
  });

  test("treats successful empty responses as ok", async () => {
    mockedFetch.mockResolvedValue({
      status: 200,
      text: jest.fn().mockResolvedValue(""),
      headers: {
        get: jest.fn().mockReturnValue("text/plain"),
      },
    });

    const result = await backend.addFunction("root-token", {
      name: "empty-response",
      trigger: "jobs",
      code: "return true;",
    });

    expect(result).toEqual({ ok: true, content: true });
  });
});
