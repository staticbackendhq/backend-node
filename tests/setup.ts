import { Backend } from "../src/backend";

export interface Task {
  id?: string;
  accountId?: string;
  name: string;
  done: boolean;
}

let backendInstance: Backend;
let authToken: string;

export function getBackend(): Backend {
  if (!backendInstance) {
    backendInstance = new Backend("dev_memory_pk", "dev");
  }
  return backendInstance;
}

export async function getAuthToken(): Promise<string> {
  if (authToken) {
    return authToken;
  }

  const backend = getBackend();
  const result = await backend.login("admin@dev.com", "devpw1234");

  if (!result.ok) {
    throw new Error(`Unable to login: ${result.content}`);
  }

  authToken = result.content;
  return authToken;
}

export function getRootToken(): string {
  return "safe-to-use-in-dev-root-token";
}

export async function cleanupTasks(): Promise<void> {
  const backend = getBackend();
  const token = await getAuthToken();

  const result = await backend.list(token, "tasks", {
    page: 1,
    size: 500,
    descending: false,
  });

  if (!result.ok) {
    // Collection might not exist yet
    if (result.content?.includes("collection not found")) {
      return;
    }
    throw new Error(`Failed to list tasks: ${result.content}`);
  }

  const tasks = result.content.results as Task[] | null;

  if (tasks && Array.isArray(tasks)) {
    for (const task of tasks) {
      if (task.id) {
        await backend.delete(token, "tasks", task.id);
      }
    }
  }
}

// Setup before all tests
beforeAll(async () => {
  await getAuthToken();
  await cleanupTasks();
});
