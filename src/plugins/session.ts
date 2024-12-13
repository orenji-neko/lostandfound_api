import jwt from "@elysiajs/jwt";
import { Elysia, t } from "elysia";
import { PrismaClient } from "@prisma/client";

const Session = new Elysia({ name: "auth", prefix: "auth" })
  .decorate("prisma", new PrismaClient())
  .use(jwt({
    name: "jwt",
    secret: Bun.env.JWT_SECRET || "default",
  }))
  .model({
    login: t.Object({
      email:    t.String({ minLength: 1 }),
      password: t.String({ minLength: 8 })
    }),
    register: t.Object({
      email:      t.String({ minLength: 1 }),
      password:   t.String({ minLength: 8 }),
      lastname:   t.String({ minLength: 1 }),
      firstname:  t.String({ minLength: 1 }),
      phone:      t.String({ minLength: 1 }),
    })
  })
  .macro(({ onBeforeHandle }) => ({
    protected(enabled: boolean) {
      if(!enabled) 
        return

      onBeforeHandle(async ({ jwt, error, cookie: { token } }) => {
        if(!token.value)
          return error(401, {
            message: "Unauthorized"
          })

        const profile = await jwt.verify(token.value);
        const { id, email } = profile as { id: string, email: string };

        if(!id && !email)
          return error(401, {
            message: "Unauthorized"
          })
      });
    }
  }))
  .derive({ as: "global" }, async ({ jwt, prisma, cookie: { token } }) => {
    const profile = await jwt.verify(token.value);
    const { id, email } = profile as { id: string, email: string };

    if(!profile) {
      return {
        user: null
      }
    }

    if(!id && !email) {
      return {
        user: null
      }
    }

    const user = await prisma.user.findUnique({
      where: {
        id: id
      }
    });

    return {
      user: user
    }
  })
  .as("global");

export default Session;