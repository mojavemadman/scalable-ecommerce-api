import { Router } from "express";
import Users from "../models/Users.js";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";
import { authentication, isAdmin } from "../middleware/auth.js";

const usersRouter = Router();
//TODO: add delete
 
//Create user profile
usersRouter.post("/", async (req, res) => {
    try {
        const { email, password, firstName, lastName } = req.body;
        const newUser = await Users.createUser(email, password, firstName, lastName);
        delete newUser.password;
        res.status(201).send(newUser)
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(400).send({ error: error.message })
    }
});

//User login
usersRouter.post("/login", async(req, res) => {
    try {
        const { email, password } = req.body;
        const user = await Users.findByEmail(email);

        if (!user) {
            return res.status(404).send({ error: "User not found"});
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (!isMatch) {
            return res.status(401).send({ error: "Incorrect login credentials"});
        }

        await Users.updateLastLogin(user.id);
        const payload = {
            userId: user.id,
            email: user.email,
            isAdmin: user.is_admin
        }
        const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, {expiresIn: "12h"});
        res.cookie("login_token", token, { httpOnly: true, secure: true, expires: new Date(Date.now() + 12 * 60 * 60 * 1000) })
        delete user.password;
        res.status(200).send(user);
    } catch (error) {
        console.error("Error logging in:", error)
        res.status(400).send({ error: error.message })
    }
})

//View user profile
usersRouter.get("/profile", authentication, async (req, res) => { 
    try {
        const user = await Users.findById(req.user.userId)

        if (!user) {
            return res.status(404).send({ error: "User not found"});
        }
        delete user.password;
        res.status(200).send(user);
    } catch (error) {
        console.error("Error retrieving profile:", error);
        res.status(400).send({ error: error.message })
    }
})

usersRouter.get("/", async (req, res) => {  //LIMIT TO INTERNAL USE
    try {
        const users = await Users.findAllUsers();

        if (users.length === 0) {
            return res.status(404).send({ error: "Users not found" })
        }
        res.status(200).send(users);
    } catch (error) {
        console.error("Error retrieving users:", error);
        res.status.send({ error: error.message })
    }
})  

usersRouter.get("/:id", async (req, res) => { //LIMIT TO INTERNAL USE
    try {
        const userId = req.params.id;
        const user = await Users.findById(userId);

        if (!user) return res.status(404).send({ error: "User not found"});

        delete user.password;
        res.status(200).send(user)
    } catch (error) {
        console.error("Error retrieving user:", error);
        res.status(400).send({ error: error.message });
    }
})
