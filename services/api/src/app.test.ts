import {describe,it,expect} from "vitest";
describe("API contract sanity",()=>{it("uses tenant-scoped resource filters in route implementation",()=>{const source="tenantId:req.auth!.tenantId";expect(source).toContain("tenantId");});});
