import "dotenv/config";
import {PrismaClient,Role} from "@prisma/client";
import bcrypt from "bcryptjs";
const db=new PrismaClient();
async function main(){
 const email=process.env.SEED_EMAIL||"owner@example.test";
 const password=process.env.SEED_PASSWORD||"ChangeMe123!";
 const user=await db.user.upsert({where:{email},update:{},create:{email,passwordHash:await bcrypt.hash(password,12)}});
 let tenant=await db.tenant.findFirst({where:{name:"AgentSphere Demo"}});
 if(!tenant)tenant=await db.tenant.create({data:{name:"AgentSphere Demo",members:{create:{userId:user.id,role:Role.OWNER}}}});
 console.log(`Seeded ${email} / tenant ${tenant.id}. Change demo password immediately.`);
}
main().finally(()=>db.$disconnect());
