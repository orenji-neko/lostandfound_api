import { Elysia, t } from "elysia";
import Session from "../session";
import { PrismaClient, Prisma, User } from "@prisma/client";

const User = new Elysia({ prefix: "users" })
  .decorate("prisma", new PrismaClient())
  .use(Session)
  .post("/login", async ({ error, prisma, jwt, body: { email, password }, cookie: { token }, set }) => {

    const user = await prisma.user.findUnique({
      where: {
        email: email
      }
    });

    // No user
    if(!user) {
      return error(404, {
        message: "No user found with this email"
      })
    }

    // compare password
    const isEqual = await Bun.password.verify(password, user.password);
    if(!isEqual) {
      return error(404, {
        message: "Invalid password"
      })
    }

    token.value = await jwt.sign({
      id: user.id,
      email: user.email
    });

    set.status = 200
    return {
      message: "Authentication success"
    }
    
  }, {
    body: "login"
  })
  .post("/register", async ({ body, error, prisma }) => {
    
    try {
      const { email, password, lastname, firstname, phone } = body;
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
        message: "Registration success",
        data: user
      }
    }
    catch(err) {

      return error(500, {
        message: "Registration failed"
      })
    }

  }, {
    body: "register"
  })
  /**
   * Get a list of users
   */
  .get("/", async ({ error, prisma }) => {

    // if no id param
    const users: User[] = await prisma.user.findMany();

    return {
      data: users
    };

  }, {
    protected: true
  })
  /**
   * Get details of a specific user
   */
  .get("/:id", async ({ error, prisma, params: { id } }) => {
    
    const user: User | null = await prisma.user.findUnique({
      where: {
        id: id
      }
    });

    if(!user) {
      return error(404, {
        message: "User not found"
      })
    }

    return {
      data: user
    }

  }, {
    protected: true
  })
  /**
   * Update details of a user
   */
  .put("/:id", async ({ error, body, params, prisma }) => {
    const { id } =  params;
    const { email, password, lastname, firstname, phone } = body;

    try {
      const user = await prisma.user.update({
        where: {
          id: id
        },
        data: {
          email: email,
          password: password,
          lastname: lastname,
          firstname: firstname,
          phone: phone
        }
      });

      return {
        message: "User update success",
        data: user
      }
    }
    catch(err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
          // Unique constraint failure
          return error(409, {
            message: "Update failed: Unique constraint violation",
          });
        }

        if (err.code === 'P2025') {
          // Record not found
          return error(404, {
            message: "User not found",
          });
        }

        return error(500, {
          message: "Failed to update user"
        })
      }
    }

  }, {
    protected: true,
    body: "register"
  })
  .delete("/:id", async ({ params: { id }, prisma, error }) => {
    try {
      const user = await prisma.user.delete({
        where: {
          id: id
        }
      });
      return {
        message: "User delete success",
        data: user
      }
    }
    catch(err) {
      if(err instanceof Prisma.PrismaClientKnownRequestError) {
        if(err.code === "P2025") {
          return error(404, {
            message: "User not found"
          })
        }

        return error(500, {
          message: "Failed to delete user"
        })
      }
    }
  }, {
    protected: true
  })

export default User;