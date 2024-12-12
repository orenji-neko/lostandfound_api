import swagger from "@elysiajs/swagger";
import { PrismaClient } from "@prisma/client";
import { Elysia } from "elysia";
import Auth from "./api/Auth";

const app = new Elysia()
  .use(swagger())     // endpoint documentation
  .use(Auth)          // Login API
  .listen(3000);

console.log(
  `[server]: Running at ${app.server?.hostname}:${app.server?.port}`
);
