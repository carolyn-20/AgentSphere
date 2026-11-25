import { describe,it,expect } from "vitest";
import { encryptSecret,decryptSecret } from "./security";
describe("secret encryption",()=>{it("round trips encrypted values",()=>{process.env.ENCRYPTION_KEY="0123456789abcdef0123456789abcdef";const c=encryptSecret("provider-secret");expect(c).not.toContain("provider-secret");expect(decryptSecret(c)).toBe("provider-secret");});});
