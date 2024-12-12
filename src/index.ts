import swagger from "@elysiajs/swagger";
import chalk from "chalk";
import { Elysia } from "elysia";
import Auth from "./auth";
import User from "./api/user";
import Logging from "./logging";

const app = new Elysia()
  .use(swagger())     // endpoint documentation
  .use(Logging)       // Logging
  .use(Auth)          // Login API
  .use(User)          // User API
  .listen({hostname: "127.0.0.1", port: 3000});

console.log(
  chalk.gray("[server]:"), "Running at", chalk.blue(`${app.server?.hostname}:${app.server?.port}`)
);
