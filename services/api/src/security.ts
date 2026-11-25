import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { PrismaClient, Role } from "@prisma/client";
const prisma = new PrismaClient();
const key = () => {
  const value = process.env.ENCRYPTION_KEY || "";
  if (Buffer.byteLength(value) !== 32) throw new Error("ENCRYPTION_KEY must be exactly 32 bytes");
  return Buffer.from(value);
};
export function encryptSecret(plain: string) {
  const iv=crypto.randomBytes(12), cipher=crypto.createCipheriv("aes-256-gcm",key(),iv);
  const data=Buffer.concat([cipher.update(plain,"utf8"),cipher.final()]);
  return [iv.toString("base64"),cipher.getAuthTag().toString("base64"),data.toString("base64")].join(".");
}
export function decryptSecret(value: string) {
  const [iv,tag,data]=value.split(".");
  const decipher=crypto.createDecipheriv("aes-256-gcm",key(),Buffer.from(iv,"base64"));
  decipher.setAuthTag(Buffer.from(tag,"base64"));
  return Buffer.concat([decipher.update(Buffer.from(data,"base64")),decipher.final()]).toString("utf8");
}
export type AuthRequest = Request & { auth?: { userId:string; tenantId:string; role:Role } };
export async function authenticate(req:AuthRequest,res:Response,next:NextFunction) {
  try {
    const token=(req.headers.authorization||"").replace(/^Bearer\s+/,"");
    const claims=jwt.verify(token,process.env.JWT_ACCESS_SECRET!) as any;
    const membership=await prisma.membership.findFirst({where:{userId:claims.sub,tenantId:claims.tenantId}});
    if(!membership) return res.status(403).json({error:{code:"TENANT_ACCESS_DENIED",message:"Tenant access denied"}});
    req.auth={userId:claims.sub,tenantId:claims.tenantId,role:membership.role}; next();
  } catch { return res.status(401).json({error:{code:"UNAUTHENTICATED",message:"Authentication required"}}); }
}
export function allow(...roles:Role[]) { return (req:AuthRequest,res:Response,next:NextFunction) => {
  if(!req.auth || !roles.includes(req.auth.role)) return res.status(403).json({error:{code:"FORBIDDEN",message:"Insufficient permissions"}});
  next();
};}
