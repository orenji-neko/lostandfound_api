import swagger from "@elysiajs/swagger";
import chalk from "chalk";
import { Elysia } from "elysia";

// Custom Plugins
import Session from "./plugins/session";
import Logging from "./plugins/logging";

// Routes
import User from "./api/user";
import Item from "./api/item";
import File from "./api/file";

const app = new Elysia()
  .use(swagger())     // endpoint documentation
  .use(Logging)       // Logging
  .use(Session)       // Login API
  .use(User)          // User API
  .use(Item)          // Item API
  .use(File)          // File API
  .listen({hostname: "127.0.0.1", port: 3000});

console.log(
  chalk.gray("[server]:"), "Running at", chalk.blue(`${app.server?.hostname}:${app.server?.port}`)
);
