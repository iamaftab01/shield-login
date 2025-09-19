import { handleFailedAttempt } from "../src/services/authService";
import pool from "../src/db";

describe("AuthService - handleFailedAttempt logic", () => {
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    (pool.connect as jest.Mock).mockResolvedValue(mockClient);
  });

  it("should create a counter on first failure", async () => {
    mockClient.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    await handleFailedAttempt(mockClient, 1, "127.0.0.1");

    expect(mockClient.query).toHaveBeenCalledWith(
      "INSERT INTO login_counters (user_id, ip_address, fail_count, window_start) VALUES ($1, $2, 1, $3)",
      [1, "127.0.0.1", expect.any(String)]
    );
  });

  it("should increment fail_count within window", async () => {
    const recentTime = new Date().toISOString();

    mockClient.query.mockResolvedValueOnce({
      rowCount: 1,
      rows: [
        {
          id: 1,
          user_id: 1,
          ip_address: "127.0.0.1",
          fail_count: 2,
          window_start: recentTime,
        },
      ],
    });

    mockClient.query.mockResolvedValueOnce({});

    mockClient.query.mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ total: "3" }],
    });

    await handleFailedAttempt(mockClient, 1, "127.0.0.1");

    expect(mockClient.query).toHaveBeenCalledWith(
      "UPDATE login_counters SET fail_count=$1 WHERE id=$2",
      [3, 1]
    );
  });

  it("should suspend user if threshold exceeded", async () => {
    const recentTime = new Date().toISOString();

    mockClient.query.mockResolvedValueOnce({
      rowCount: 1,
      rows: [
        {
          id: 1,
          user_id: 1,
          ip_address: "127.0.0.1",
          fail_count: 5,
          window_start: recentTime,
        },
      ],
    });

    mockClient.query.mockResolvedValueOnce({});
    mockClient.query.mockResolvedValueOnce({});
    mockClient.query.mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ total: "105" }],
    });

    mockClient.query.mockResolvedValueOnce({});

    await handleFailedAttempt(mockClient, 1, "127.0.0.1");

    expect(mockClient.query).toHaveBeenCalledWith(
      "INSERT INTO suspensions (user_id, ip_address, suspended_until, suspension_type) VALUES ($1, NULL, $2, 'USER')",
      [1, expect.any(String)]
    );

    expect(mockClient.query).toHaveBeenCalledWith(
      "INSERT INTO suspensions (user_id, ip_address, suspended_until, suspension_type) VALUES (NULL, $1, $2, 'IP')",
      ["127.0.0.1", expect.any(String)]
    );
  });
});
