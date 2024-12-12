import { Elysia } from "elysia";
import chalk from "chalk";

const Logging = new Elysia({ name: "logging" })
  .onAfterResponse(({ server, route, request }) => {
    const client = server?.requestIP(request);

    console.log(
      chalk.gray(`[server]:`), 
      chalk.blue(`${server?.hostname}:${server?.port}${route}`), 
      chalk.green(request.method), 
      chalk.magenta(`- ${client?.address}`)
    );
  })
  .as("global");

export default Logging;