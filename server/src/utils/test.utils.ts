import { prisma } from "../configs/db.config";


async function testConnection() {
  const users = await prisma.user.findMany();
  console.log(users);
}

testConnection();