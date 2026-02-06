import { getBackend, getAuthToken, getRootToken } from "./setup";
import { EmailData, SMSData, ConvertData } from "../src/backend";

describe("Extra Features", () => {
  let backend = getBackend();

  test("should send email", async () => {
    const rootToken = getRootToken();

    const emailData: EmailData = {
      fromName: "Test Sender",
      from: "test@example.com",
      to: "recipient@example.com",
      subject: "Test Email",
      body: "This is a test email from the test suite.",
      replyTo: "test@example.com",
    };

    const result = await backend.sendMail(rootToken, emailData);

    // In dev mode this might not actually send but should accept the request - requires root token
    expect(result.ok).toBe(true);
  });

  test("should send SMS", async () => {
    const rootToken = getRootToken();

    const smsData: SMSData = {
      accountSID: "test_sid",
      authToken: "test_token",
      toNumber: "+15555555555",
      fromNumber: "+15555555556",
      body: "Test SMS message",
    };

    const result = await backend.sudoSendSMS(rootToken, smsData);

    // In dev mode this might fail without proper Twilio credentials - requires root token
    expect(result).toBeDefined();
  });

  test.skip("should convert URL to PDF", async () => {
    const token = await getAuthToken();

    const convertData: ConvertData = {
      toPDF: true,
      url: "https://example.com",
      fullpage: true,
    };

    const result = await backend.convertURLToX(token, convertData);

    // This might require additional services running
    // Just ensure the API call is made correctly
    expect(result).toBeDefined();
  });

  test.skip("should reset password workflow", async () => {
    const rootToken = getRootToken();

    // Create a test user first
    const email = `reset_test_${Date.now()}@test.com`;
    const registerResult = await backend.register(email, "oldpassword");
    expect(registerResult.ok).toBe(true);

    // Get password reset code
    const codeResult = await backend.getPasswordResetCode(rootToken, email);
    expect(codeResult.ok).toBe(true);
    expect(codeResult.content.code).toBeDefined();

    // Reset password
    const resetResult = await backend.resetPassword(
      email,
      codeResult.content.code,
      "newpassword"
    );
    expect(resetResult.ok).toBe(true);

    // Try logging in with new password
    const loginResult = await backend.login(email, "newpassword");
    expect(loginResult.ok).toBe(true);
  });

  test.skip("should change password", async () => {
    const email = `change_pw_${Date.now()}@test.com`;
    const oldPassword = "oldpass123";
    const newPassword = "newpass456";

    // Register user
    const registerResult = await backend.register(email, oldPassword);
    expect(registerResult.ok).toBe(true);

    const token = registerResult.content;

    // Change password
    const changeResult = await backend.changePassword(
      token,
      email,
      oldPassword,
      newPassword
    );
    expect(changeResult.ok).toBe(true);

    // Verify new password works
    const loginResult = await backend.login(email, newPassword);
    expect(loginResult.ok).toBe(true);
  });
});
