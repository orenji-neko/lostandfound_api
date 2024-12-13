import { Elysia } from "elysia";
import Session from "../session";
import path from 'path';

const File = new Elysia({ prefix: "file" })
  .use(Session)
  .get("/:filename", ({ params: { filename } }) => {

    return Bun.file(path.join(process.cwd(), 'file', filename));
  }, {
    protected: true
  });

export default File;