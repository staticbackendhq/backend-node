import { getBackend, getAuthToken, getRootToken } from "./setup";
import * as fs from "fs";
import * as path from "path";

describe("Storage Operations", () => {
  let backend = getBackend();

  test("should upload file", async () => {
    const token = await getAuthToken();

    // Read this test file as the upload content
    const filePath = __filename;
    const fileContent = fs.readFileSync(filePath);

    // Upload file - pass Buffer directly, not .buffer
    const result = await backend.storeFile(token, fileContent as any);

    expect(result.ok).toBe(true);
    expect(result.content.url).toBeDefined();
    expect(result.content.url).toContain("http://localhost:8099/localfs");
  });

  test("should delete file", async () => {
    const token = await getAuthToken();
    const rootToken = getRootToken();

    // First upload a file
    const filePath = __filename;
    const fileContent = fs.readFileSync(filePath);
    const uploadResult = await backend.storeFile(token, fileContent as any);

    expect(uploadResult.ok).toBe(true);

    // Extract file ID from the response
    const fileId = uploadResult.content.id;

    // Delete file using root token
    const deleteResult = await backend.deleteFile(rootToken, fileId);
    expect(deleteResult.ok).toBe(true);
  });

  test.skip("should resize image", async () => {
    const token = await getAuthToken();

    // For this test, we'll use a minimal valid PNG file (1x1 transparent pixel)
    // This is a base64 encoded PNG
    const minimalPng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64",
    );

    const result = await backend.resizeImage(token, 100, minimalPng as any);

    expect(result.ok).toBe(true);
    expect(result.content.url).toBeDefined();
  });
});
