import jwt from "@elysiajs/jwt";
import { Elysia, t } from "elysia";
import { PrismaClient } from "@prisma/client";

const Auth = new Elysia({ name: "auth", prefix: "auth" })
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
    user: t.Object({
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
            success: false,
            message: "Unauthorized"
          })

        const profile = await jwt.verify(token.value);
        const { email } = profile as { email: string };

        if(!email)
          return error(401, {
            success: false,
            message: "Unauthorized"
          })
      });
    }
  }))
  .post("/login", async ({ error, prisma, jwt, body: { email, password }, cookie: { token }, set }) => {

    const user = await prisma.user.findUnique({
      where: {
        email: email
      }
    });

    // No user
    if(!user) {
      return error(404, {
        success: false,
        message: "No user found with this email"
      })
    }

    // compare password
    const isEqual = await Bun.password.verify(password, user.password);
    if(!isEqual) {
      return error(404, {
        success: false,
        message: "Invalid password"
      })
    }

    token.value = await jwt.sign({
      email: email
    })

    set.status = 200
    return {
      success: true,
      message: "Authentication success"
    }
    
  }, {
    body: "login"
  })
  .post("/register", async ({ body, error, prisma }) => {
    const { email, password, lastname, firstname, phone } = body;

    // check if user already exists
    const tmp = await prisma.user.findUnique({
      where: {
        email: email
      }
    });

    if(!tmp) {
      return error(409, {
        success: false,
        message: "A user with this email already exists"
      })
    }

    const user = await prisma.user.create({
      data: {
        email: email,
        password: await Bun.password.hash(password, "bcrypt"),
        lastname: lastname,
        firstname: firstname,
        phone: phone
      }
    });

    return {
      success: true,
      message: "Registration success",
      data: user
    }    

  }, {
    body: "user"
  })

export default Auth;