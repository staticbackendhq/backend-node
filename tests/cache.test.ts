import { getBackend, getAuthToken, Task } from "./setup";

describe("Real-time Messaging", () => {
  let backend = getBackend();

  test.skip("should publish message", async () => {
    const token = await getAuthToken();

    const fakeTask: Task = {
      name: "not real",
      done: true,
    };

    const result = await backend.publish(
      token,
      "test-channel",
      "test-type",
      fakeTask
    );

    expect(result.ok).toBe(true);
  });
});
