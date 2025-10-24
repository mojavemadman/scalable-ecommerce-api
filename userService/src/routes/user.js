import { Router } from "express";
import UsersController from "../controllers/UsersController.js"

const usersRouter = Router();

//Create user profile
usersRouter.post("/", UsersController.createUser);
usersRouter.get("/", UsersController.getAllUsers);
usersRouter.delete("/", UsersController.deleteUser)
usersRouter.post("/login", UsersController.login);
usersRouter.get("/profile", UsersController.getProfile);

//LIMIT TO INTERNAL USE
usersRouter.get("/:id", UsersController.getById);

export default usersRouter;