import swagger from "@elysiajs/swagger";
import chalk from "chalk";
import { Elysia } from "elysia";

// Custom Plugins
import Session from "./session";
import Logging from "./logging";

// Routes
import User from "./api/users";
import Item from "./api/item";

const app = new Elysia()
  .use(swagger())     // endpoint documentation
  .use(Logging)       // Logging
  .use(Session)       // Login API
  .use(User)          // User API
  .use(Item)          // Item API
  .listen({hostname: "127.0.0.1", port: 3000});

console.log(
  chalk.gray("[server]:"), "Running at", chalk.blue(`${app.server?.hostname}:${app.server?.port}`)
);
