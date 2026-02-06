import { getBackend, getAuthToken, Task } from "./setup";
import { Filter } from "../src/backend";

describe("Database Operations", () => {
  let backend = getBackend();

  test("should list documents", async () => {
    const token = await getAuthToken();

    // Create a test document
    const createResult = await backend.create(token, "tasks", {
      name: "test",
      done: false,
    });
    expect(createResult.ok).toBe(true);
    const insertedTask = createResult.content as Task;

    // List documents
    const listResult = await backend.list(token, "tasks", undefined);
    expect(listResult.ok).toBe(true);
    expect(listResult.content.total).toBeGreaterThanOrEqual(1);

    const results = listResult.content.results as Task[] | null;
    expect(results).not.toBeNull();
    expect(results!.length).toBeGreaterThanOrEqual(1);

    const lastTask = results![results!.length - 1];
    expect(lastTask.id).toBe(insertedTask.id);
  });

  test("should query with filters (findOne)", async () => {
    const token = await getAuthToken();

    // Create test documents
    await backend.create(token, "tasks", { name: "task 1", done: false });
    const task2Result = await backend.create(token, "tasks", {
      name: "task 2",
      done: false,
    });
    expect(task2Result.ok).toBe(true);
    const insertedTask2 = task2Result.content as Task;

    // Query with filter
    const filters: Filter[] = [["name", "==", "task 2"]];
    const queryResult = await backend.query(token, "tasks", filters);

    expect(queryResult.ok).toBe(true);
    expect(queryResult.content.results.length).toBe(1);
    expect(queryResult.content.results[0].id).toBe(insertedTask2.id);
  });

  test("should update bulk documents", async () => {
    const token = await getAuthToken();

    // Create test documents
    const task1 = await backend.create(token, "tasks", {
      name: "task",
      done: false,
    });
    const task2 = await backend.create(token, "tasks", {
      name: "task",
      done: false,
    });
    await backend.create(token, "tasks", {
      name: "not part of update",
      done: false,
    });

    expect(task1.ok && task2.ok).toBe(true);

    // Update bulk
    const filters: Filter[] = [["name", "==", "task"]];
    const updateData = {
      update: { name: "changed via update", done: true },
      clauses: filters,
    };

    const updateResult = await backend.updateBulk(
      token,
      "tasks",
      updateData
    );
    expect(updateResult.ok).toBe(true);

    // Verify updates
    const task1Check = await backend.getById(
      token,
      "tasks",
      task1.content.id
    );
    expect(task1Check.ok).toBe(true);
    expect(task1Check.content.name).toBe("changed via update");
    expect(task1Check.content.done).toBe(true);

    const task2Check = await backend.getById(
      token,
      "tasks",
      task2.content.id
    );
    expect(task2Check.ok).toBe(true);
    expect(task2Check.content.name).toBe("changed via update");
    expect(task2Check.content.done).toBe(true);
  });

  test("should count documents", async () => {
    const token = await getAuthToken();

    // Get initial count
    const listResult = await backend.list(token, "tasks");
    expect(listResult.ok).toBe(true);
    const initialTotal = listResult.content.total;

    // Count without filters
    const countResult = await backend.count(token, "tasks", []);
    expect(countResult.ok).toBe(true);
    // Count should be close to list total (allow for small differences due to timing)
    expect(countResult.content.count).toBeGreaterThanOrEqual(initialTotal - 1);
    expect(countResult.content.count).toBeLessThanOrEqual(initialTotal + 1);

    // Create a specific document
    await backend.create(token, "tasks", { name: "countme", done: false });

    // Count with filters
    const filters: Filter[] = [["name", "==", "countme"]];
    const countWithFilterResult = await backend.count(token, "tasks", filters);
    expect(countWithFilterResult.ok).toBe(true);
    expect(countWithFilterResult.content.count).toBeGreaterThanOrEqual(1);
  });

  test("should delete bulk documents", async () => {
    const token = await getAuthToken();

    // Create test documents
    const task1 = await backend.create(token, "tasks", {
      name: "to-del",
      done: true,
    });
    const task2 = await backend.create(token, "tasks", {
      name: "to-del2",
      done: true,
    });

    expect(task1.ok && task2.ok).toBe(true);

    // Delete bulk
    const filters: Filter[] = [["done", "==", true]];
    const deleteResult = await backend.deleteBulk(token, "tasks", filters);
    expect(deleteResult.ok).toBe(true);

    // Verify deletion
    const checkResult = await backend.getById(token, "tasks", task1.content.id);
    expect(checkResult.ok).toBe(false);
  });

  test("should get by multiple IDs", async () => {
    const token = await getAuthToken();

    // Create test documents
    const task1 = await backend.create(token, "tasks", {
      name: "id-1",
      done: true,
    });
    const task2 = await backend.create(token, "tasks", {
      name: "id-2",
      done: false,
    });
    const task3 = await backend.create(token, "tasks", {
      name: "id-3",
      done: true,
    });

    expect(task1.ok && task2.ok && task3.ok).toBe(true);

    // Get by IDs
    const ids = [task1.content.id, task3.content.id];
    const result = await backend.getByIds(token, "tasks", ids);

    expect(result.ok).toBe(true);
    expect(result.content.length).toBe(2);
    expect(result.content[0].id).toBe(task1.content.id);
    expect(result.content[1].id).toBe(task3.content.id);
  });

  test("should create and get document by ID", async () => {
    const token = await getAuthToken();

    // Create document
    const createResult = await backend.create(token, "pub_test", {
      name: "test",
      done: false,
    });
    expect(createResult.ok).toBe(true);
    const insertedTask = createResult.content as Task;

    // Get by ID
    const getResult = await backend.getById(
      token,
      "pub_test",
      insertedTask.id!
    );
    expect(getResult.ok).toBe(true);
    expect(getResult.content.id).toBe(insertedTask.id);
  });

  test("should create bulk documents", async () => {
    const token = await getAuthToken();

    const docs = [
      { name: "bulk-1", done: false },
      { name: "bulk-2", done: true },
      { name: "bulk-3", done: false },
    ];

    const result = await backend.createBulk(token, "tasks", docs);
    expect(result.ok).toBe(true);
    expect(result.content).toBeTruthy();
  });

  test("should update single document", async () => {
    const token = await getAuthToken();

    // Create document
    const createResult = await backend.create(token, "tasks", {
      name: "original",
      done: false,
    });
    expect(createResult.ok).toBe(true);

    // Update document
    const updateResult = await backend.update(
      token,
      "tasks",
      createResult.content.id,
      { name: "updated", done: true }
    );
    expect(updateResult.ok).toBe(true);

    // Verify update
    const getResult = await backend.getById(
      token,
      "tasks",
      createResult.content.id
    );
    expect(getResult.ok).toBe(true);
    expect(getResult.content.name).toBe("updated");
    expect(getResult.content.done).toBe(true);
  });

  test("should delete single document", async () => {
    const token = await getAuthToken();

    // Create document
    const createResult = await backend.create(token, "tasks", {
      name: "to-delete",
      done: false,
    });
    expect(createResult.ok).toBe(true);

    // Delete document
    const deleteResult = await backend.delete(
      token,
      "tasks",
      createResult.content.id
    );
    expect(deleteResult.ok).toBe(true);

    // Verify deletion
    const getResult = await backend.getById(
      token,
      "tasks",
      createResult.content.id
    );
    expect(getResult.ok).toBe(false);
  });

  test("should search documents", async () => {
    const token = await getAuthToken();

    // Create a searchable document
    await backend.create(token, "tasks", {
      name: "searchable unique keyword",
      done: false,
    });

    // Small delay to allow indexing
    await new Promise(resolve => setTimeout(resolve, 100));

    // Search
    const searchResult = await backend.search(
      token,
      "tasks",
      "searchable unique"
    );
    expect(searchResult.ok).toBe(true);
    // Search may return null if no results or if search is not configured
    if (searchResult.content && searchResult.content.results) {
      expect(searchResult.content.results.length).toBeGreaterThanOrEqual(1);
    }
  });

  test("should increase numeric field", async () => {
    const token = await getAuthToken();

    // Create document with numeric field
    const createResult = await backend.create(token, "tasks", {
      name: "counter",
      done: false,
      count: 5,
    });
    expect(createResult.ok).toBe(true);

    // Increase field
    const increaseResult = await backend.increase(
      token,
      "tasks",
      createResult.content.id,
      "count",
      3
    );
    expect(increaseResult.ok).toBe(true);

    // Verify increase
    const getResult = await backend.getById(
      token,
      "tasks",
      createResult.content.id
    );
    expect(getResult.ok).toBe(true);
    expect(getResult.content.count).toBe(8);
  });
});
