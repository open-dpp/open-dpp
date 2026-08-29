import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { HttpService } from "@nestjs/axios";
import { AxiosResponse } from "axios";
import { of, throwError } from "rxjs";
import { VirusScanFileValidator } from "./virus-scan.file-validator";

const file = {
  buffer: Buffer.from("hello"),
  originalname: "hello.txt",
} as Express.Multer.File;

function setEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}

describe("VirusScanFileValidator", () => {
  const originalEnv = {
    OPEN_DPP_CLAMAV_URL: process.env.OPEN_DPP_CLAMAV_URL,
    NODE_ENV: process.env.NODE_ENV,
  };
  let post: jest.SpiedFunction<HttpService["post"]>;
  let validator: VirusScanFileValidator;

  beforeEach(() => {
    post = jest.spyOn(HttpService.prototype, "post");
    validator = new VirusScanFileValidator({ storageType: "memory" });
  });

  afterEach(() => {
    post.mockRestore();
    setEnv("OPEN_DPP_CLAMAV_URL", originalEnv.OPEN_DPP_CLAMAV_URL);
    setEnv("NODE_ENV", originalEnv.NODE_ENV);
  });

  it("accepts the file without scanning when OPEN_DPP_CLAMAV_URL is unset", async () => {
    setEnv("OPEN_DPP_CLAMAV_URL", undefined);

    await expect(validator.isValid(file)).resolves.toBe(true);
    expect(post).not.toHaveBeenCalled();
  });

  it("accepts the file when ClamAV responds with 200", async () => {
    setEnv("OPEN_DPP_CLAMAV_URL", "http://clamav-rest:9000");
    post.mockReturnValue(of({ status: 200 } as AxiosResponse));

    await expect(validator.isValid(file)).resolves.toBe(true);
    expect(post).toHaveBeenCalledWith("http://clamav-rest:9000/scan", expect.anything());
  });

  it("rejects the file when ClamAV is unreachable", async () => {
    setEnv("OPEN_DPP_CLAMAV_URL", "http://clamav-rest:9000");
    setEnv("NODE_ENV", "LOCAL");
    post.mockReturnValue(
      throwError(() =>
        Object.assign(new Error("getaddrinfo ENOTFOUND"), { syscall: "getaddrinfo" }),
      ),
    );
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

    await expect(validator.isValid(file)).resolves.toBe(false);
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
