import { Elysia, error, t } from "elysia";
import Session from "../plugins/session";
import { PrismaClient, Prisma, User } from "@prisma/client";
import { saveFile } from "../utils/file";
import { DefaultArgs } from "@prisma/client/runtime/library";

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
  .put("/:id", async ({ params: { id }, prisma, body, user }) => {
    const { email, password, lastname, firstname, phone, image, isAdmin } = body;

    // If image exists, then save to file/
    let filename: string = "";
    if(image) 
      filename = await saveFile(image);

    const tmp = await prisma.user.findUnique({
      where: {
        id: id
      }
    });

    if(!tmp) {
      return error(404, {
        message: "User not found"
      })
    }

    // if not admin, and modifying other user's details
    if(!user?.isAdmin && user?.id !== id)
      return error(401, {
        message: "Unauthorized"
      });

    let config: Prisma.UserUpdateArgs<DefaultArgs> = {
      where: {
        id: id
      },
      data: {
        email:      email       ? email       : tmp.email,
        password:   password    ? password    : tmp.password,
        lastname:   lastname    ? lastname    : tmp.lastname,
        firstname:  firstname   ? firstname   : tmp.firstname,
        phone:      phone       ? phone       : tmp.phone,
        profile:    image       ? filename    : tmp.profile
      }
    };

    const newUser = await prisma.user.update(config);

    return {
      data: newUser
    }
  }, {
    protected: true,
    body: t.Object({
      email:      t.Optional(t.String()),
      password:   t.Optional(t.String()),
      lastname:   t.Optional(t.String()),
      firstname:  t.Optional(t.String()),
      phone:      t.Optional(t.String()),
      image:      t.Optional(t.File()),
      isAdmin:    t.Optional(t.String())
    })
  })
  .delete("/:id", async ({ params: { id }, prisma, error, user }) => {
    // Validate user authorization
    if (!user) {
      return error(401, {
        message: "Authentication required"
      });
    }

    // Check if user is trying to delete themselves or if they're an admin
    if (!user.isAdmin && user.id !== id) {
      return error(403, {
        message: "You are not authorized to delete this user"
      });
    }

    try {
      // Attempt to find the user first to ensure they exist
      const existingUser = await prisma.user.findUnique({
        where: { id: id }
      });

      if (!existingUser) {
        return error(404, {
          message: "User not found"
        });
      }

      // Proceed with user deletion
      const deletedUser = await prisma.user.delete({
        where: {
          id: id
        }
      });

      return {
        message: "User deleted successfully",
        data: deletedUser
      };
    }
    catch(err) {
      // Log the error for server-side tracking
      console.error("User deletion error:", err);

      // Handle specific Prisma errors
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        switch(err.code) {
          case "P2025": // Record not found
            return error(404, {
              message: "User not found"
            });
          case "P2003": // Foreign key constraint fails
            return error(400, {
              message: "Cannot delete user due to existing related records"
            });
          default:
            return error(500, {
              message: "Failed to delete user"
            });
        }
      }

      // Catch any other unexpected errors
      return error(500, {
        message: "An unexpected error occurred"
      });
    }
  }, {
    protected: true
  });

export default User;