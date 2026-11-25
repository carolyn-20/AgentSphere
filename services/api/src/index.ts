import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { randomUUID } from "node:crypto";
import { Prisma, PrismaClient, Role } from "@prisma/client";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authenticate, allow, AuthRequest } from "./security";
const app=express(), db=new PrismaClient();
const jsonValueSchema: z.ZodType<Prisma.InputJsonValue | null> = z.lazy(() =>
 z.union([z.string(),z.number(),z.boolean(),z.null(),z.array(jsonValueSchema),z.record(jsonValueSchema)])
);
app.use(helmet()); app.use(cors({origin:true})); app.use(express.json({limit:"1mb"}));
app.use((req,res,next)=>{const id=randomUUID();res.setHeader("x-request-id",id);next();});
const fail=(res:any,status:number,code:string,message:string)=>res.status(status).json({error:{code,message}});
app.get("/health",async(_req,res)=>{try{await db.$queryRaw`SELECT 1`;res.json({status:"ok",database:"ok"});}catch{fail(res,503,"NOT_READY","Database unavailable");}});
app.post("/auth/register",async(req,res)=>{
 const parsed=z.object({email:z.string().email(),password:z.string().min(12),tenantName:z.string().min(2)}).safeParse(req.body);
 if(!parsed.success)return fail(res,400,"VALIDATION_ERROR","Invalid registration details");
 try {const user=await db.user.create({data:{email:parsed.data.email,passwordHash:await bcrypt.hash(parsed.data.password,12)}});
 const tenant=await db.tenant.create({data:{name:parsed.data.tenantName,members:{create:{userId:user.id,role:Role.OWNER}}}});
 const access=jwt.sign({tenantId:tenant.id},process.env.JWT_ACCESS_SECRET!,{subject:user.id,expiresIn:"15m"});
 res.status(201).json({accessToken:access,user:{id:user.id,email:user.email},tenant:{id:tenant.id,name:tenant.name}});
 }catch{return fail(res,409,"REGISTRATION_FAILED","Email may already be registered");}
});
app.post("/auth/login",async(req,res)=>{
 const p=z.object({email:z.string().email(),password:z.string(),tenantId:z.string().optional()}).safeParse(req.body);
 if(!p.success)return fail(res,400,"VALIDATION_ERROR","Invalid credentials");
 const user=await db.user.findUnique({where:{email:p.data.email}});
 if(!user||!(await bcrypt.compare(p.data.password,user.passwordHash)))return fail(res,401,"INVALID_CREDENTIALS","Email or password is incorrect");
 const membership=await db.membership.findFirst({where:{userId:user.id,...(p.data.tenantId?{tenantId:p.data.tenantId}:{})}});
 if(!membership)return fail(res,403,"TENANT_ACCESS_DENIED","No matching organization membership");
 res.json({accessToken:jwt.sign({tenantId:membership.tenantId},process.env.JWT_ACCESS_SECRET!,{subject:user.id,expiresIn:"15m"}),role:membership.role,tenantId:membership.tenantId});
});
app.use(authenticate);
app.get("/me",(req:AuthRequest,res)=>res.json({userId:req.auth!.userId,tenantId:req.auth!.tenantId,role:req.auth!.role}));
app.get("/agents",async(req:AuthRequest,res)=>res.json(await db.agent.findMany({where:{tenantId:req.auth!.tenantId},orderBy:{createdAt:"desc"}})));
app.post("/agents",allow(Role.OWNER,Role.BUILDER),async(req:AuthRequest,res)=>{
 const p=z.object({name:z.string().min(2).max(80),description:z.string().max(500).optional(),systemPrompt:z.string().min(1).max(12000),maxSteps:z.number().int().min(1).max(12).default(5)}).safeParse(req.body);
 if(!p.success)return fail(res,400,"VALIDATION_ERROR","Invalid agent configuration");
 const a=await db.agent.create({data:{...p.data,tenantId:req.auth!.tenantId}});
 await db.auditEvent.create({data:{tenantId:req.auth!.tenantId,actorId:req.auth!.userId,action:"agent.created",resourceType:"Agent",resourceId:a.id}});
 res.status(201).json(a);
});
app.get("/agents/:id",async(req:AuthRequest,res)=>{const a=await db.agent.findFirst({where:{id:req.params.id,tenantId:req.auth!.tenantId},include:{prompts:true}});return a?res.json(a):fail(res,404,"NOT_FOUND","Agent not found");});
app.post("/agents/:id/prompts",allow(Role.OWNER,Role.BUILDER),async(req:AuthRequest,res)=>{
 const p=z.object({content:z.string().min(1).max(12000)}).safeParse(req.body); if(!p.success)return fail(res,400,"VALIDATION_ERROR","Invalid prompt");
 const a=await db.agent.findFirst({where:{id:req.params.id,tenantId:req.auth!.tenantId}});if(!a)return fail(res,404,"NOT_FOUND","Agent not found");
 const version=(await db.promptVersion.count({where:{agentId:a.id}}))+1;
 res.status(201).json(await db.promptVersion.create({data:{agentId:a.id,version,content:p.data.content}}));
});
app.post("/agents/:id/prompts/:promptId/activate",allow(Role.OWNER,Role.BUILDER),async(req:AuthRequest,res)=>{
 const a=await db.agent.findFirst({where:{id:req.params.id,tenantId:req.auth!.tenantId}});if(!a)return fail(res,404,"NOT_FOUND","Agent not found");
 const p=await db.promptVersion.findFirst({where:{id:req.params.promptId,agentId:a.id}});if(!p)return fail(res,404,"NOT_FOUND","Prompt version not found");
 await db.$transaction([db.promptVersion.updateMany({where:{agentId:a.id},data:{active:false}}),db.promptVersion.update({where:{id:p.id},data:{active:true}})]);
 res.json({activePromptId:p.id,version:p.version});
});

app.get("/workflows",async(req:AuthRequest,res)=>res.json(await db.workflow.findMany({where:{tenantId:req.auth!.tenantId},include:{steps:{orderBy:{position:"asc"}}},orderBy:{createdAt:"desc"}})));
app.post("/workflows",allow(Role.OWNER,Role.BUILDER),async(req:AuthRequest,res)=>{
 const p=z.object({name:z.string().min(2).max(100),description:z.string().max(500).optional(),steps:z.array(z.object({kind:z.enum(["prompt","tool","approval","condition"]),config:z.record(jsonValueSchema)})).max(30)}).safeParse(req.body);
 if(!p.success)return fail(res,400,"VALIDATION_ERROR","Invalid workflow definition");
 const workflow=await db.workflow.create({data:{tenantId:req.auth!.tenantId,name:p.data.name,description:p.data.description||"",steps:{create:p.data.steps.map((step,position)=>({...step,position}))}},include:{steps:true}});
 res.status(201).json(workflow);
});
app.post("/workflows/:id/enable",allow(Role.OWNER,Role.BUILDER),async(req:AuthRequest,res)=>{
 const result=await db.workflow.updateMany({where:{id:req.params.id,tenantId:req.auth!.tenantId},data:{enabled:true,version:{increment:1}}});
 return result.count?res.json({enabled:true}):fail(res,404,"NOT_FOUND","Workflow not found");
});
app.get("/tools",async(req:AuthRequest,res)=>res.json(await db.tool.findMany({where:{tenantId:req.auth!.tenantId},select:{id:true,name:true,description:true,enabled:true}})));
app.post("/tools",allow(Role.OWNER,Role.BUILDER),async(req:AuthRequest,res)=>{
 const p=z.object({name:z.string().regex(/^[a-z][a-z0-9_-]{1,40}$/),description:z.string().max(300)}).safeParse(req.body);
 if(!p.success)return fail(res,400,"VALIDATION_ERROR","Invalid tool definition");
 res.status(201).json(await db.tool.create({data:{...p.data,tenantId:req.auth!.tenantId,enabled:false}}));
});
app.patch("/tools/:id",allow(Role.OWNER,Role.BUILDER),async(req:AuthRequest,res)=>{
 const p=z.object({enabled:z.boolean()}).safeParse(req.body);if(!p.success)return fail(res,400,"VALIDATION_ERROR","Invalid tool state");
 const t=await db.tool.updateMany({where:{id:req.params.id,tenantId:req.auth!.tenantId},data:p.data});
 return t.count?res.json({updated:true}):fail(res,404,"NOT_FOUND","Tool not found");
});
app.get("/documents",async(req:AuthRequest,res)=>res.json(await db.document.findMany({where:{tenantId:req.auth!.tenantId},select:{id:true,filename:true,status:true,createdAt:true}})));
app.post("/documents/register",allow(Role.OWNER,Role.BUILDER,Role.OPERATOR),async(req:AuthRequest,res)=>{
 const p=z.object({filename:z.string().min(1).max(255),contentHash:z.string().optional()}).safeParse(req.body);if(!p.success)return fail(res,400,"VALIDATION_ERROR","Invalid document");
 res.status(201).json(await db.document.create({data:{...p.data,tenantId:req.auth!.tenantId}}));
});
app.get("/executions",async(req:AuthRequest,res)=>res.json(await db.execution.findMany({where:{tenantId:req.auth!.tenantId},orderBy:{createdAt:"desc"},take:100})));
app.post("/executions",allow(Role.OWNER,Role.BUILDER,Role.OPERATOR),async(req:AuthRequest,res)=>{
 const p=z.object({agentId:z.string(),input:z.string().min(1).max(10000),requireApproval:z.boolean().default(false)}).safeParse(req.body);
 if(!p.success)return fail(res,400,"VALIDATION_ERROR","Invalid execution request");
 const agent=await db.agent.findFirst({where:{id:p.data.agentId,tenantId:req.auth!.tenantId,active:true}});
 if(!agent)return fail(res,404,"AGENT_NOT_FOUND","Agent not found or inactive");
 const usage=await db.usageRecord.aggregate({where:{tenantId:req.auth!.tenantId,createdAt:{gte:new Date(new Date().getFullYear(),new Date().getMonth(),1)}},_sum:{tokens:true}});
 const tenant=await db.tenant.findUnique({where:{id:req.auth!.tenantId}});
 if((usage._sum.tokens||0)>= (tenant?.monthlyTokenLimit||0))return fail(res,429,"USAGE_LIMIT","Monthly token limit reached");
 const execution=await db.execution.create({data:{tenantId:req.auth!.tenantId,agentId:agent.id,input:{text:p.data.input},status:p.data.requireApproval?"WAITING_APPROVAL":"QUEUED"}});
 if(p.data.requireApproval)await db.approval.create({data:{executionId:execution.id,requestedAction:"Run agent execution"}});
 res.status(202).json(execution);
});
app.post("/approvals/:id/decision",allow(Role.OWNER,Role.OPERATOR),async(req:AuthRequest,res)=>{
 const p=z.object({approved:z.boolean()}).safeParse(req.body);if(!p.success)return fail(res,400,"VALIDATION_ERROR","Invalid approval decision");
 const approval=await db.approval.findFirst({where:{id:req.params.id,execution:{tenantId:req.auth!.tenantId}}});
 if(!approval||approval.status!=="PENDING")return fail(res,404,"NOT_FOUND","Pending approval not found");
 await db.$transaction([db.approval.update({where:{id:approval.id},data:{status:p.data.approved?"APPROVED":"REJECTED",decidedBy:req.auth!.userId}}),db.execution.update({where:{id:approval.executionId},data:{status:p.data.approved?"QUEUED":"CANCELLED"}})]);
 res.json({status:p.data.approved?"APPROVED":"REJECTED"});
});
app.get("/usage",async(req:AuthRequest,res)=>{const records=await db.usageRecord.findMany({where:{tenantId:req.auth!.tenantId},orderBy:{createdAt:"desc"},take:100});const total=records.reduce((n,r)=>n+r.tokens,0);res.json({totalTokens:total,records});});
app.get("/audit",allow(Role.OWNER,Role.AUDITOR),async(req:AuthRequest,res)=>res.json(await db.auditEvent.findMany({where:{tenantId:req.auth!.tenantId},orderBy:{createdAt:"desc"},take:100})));
app.get("/billing",async(req:AuthRequest,res)=>{const t=await db.tenant.findUnique({where:{id:req.auth!.tenantId},select:{plan:true,monthlyTokenLimit:true}});res.json({simulation:true,...t,invoiceStatus:"NOT_CHARGED"});});
app.use((err:any,_req:any,res:any,_next:any)=>{res.status(500).json({error:{code:"INTERNAL_ERROR",message:"Unexpected server error"}});});
const port=Number(process.env.API_PORT||4000);app.listen(port,()=>console.log(`AgentSphere API listening on ${port}`));
export {app};
