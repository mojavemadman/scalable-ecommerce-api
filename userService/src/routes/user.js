import { Router } from "express";
import UsersController from "../controllers/UsersController.js"
import { isAdmin } from "../middleware/auth.js"

const usersRouter = Router();

//=======PUBLIC ROUTES=======
usersRouter.post("/", UsersController.createUser);
usersRouter.post("/login", UsersController.login);
usersRouter.get("/health", (req, res) => res.status(200).send({ status: "User service is running" }));

//=======AUTHENTICATED ROUTES=======
usersRouter.delete("/", UsersController.deleteUser)
usersRouter.get("/profile", UsersController.getProfile);
usersRouter.put("/profile", UsersController.updateUser);

//=======ADMIN ROUTES=======
usersRouter.get("/", isAdmin, UsersController.getAllUsers);

//=======INTERNAL ROUTES=======
usersRouter.get("/:id", UsersController.getById);

export default usersRouter;