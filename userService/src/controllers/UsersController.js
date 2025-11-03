import Users from "../models/Users.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

class UsersController {
	static async createUser(req, res) {
		try {
			const { email, password, firstName, lastName } = req.body;

            if (!email || !password || !firstName || !lastName) {
                return res.status(400).send({ error: "Missing required fields" });
            }

			const newUser = await Users.createUser(
				email,
				password,
				firstName,
				lastName
			);
			delete newUser.password;
			res.status(201).send(newUser);
		} catch (error) {
			console.error("Error creating user:", error);
            if (error.code === "23505") {
                return res.status(409).send({ error: "Email already exists" });
            }
			res.status(500).send({ error: "Internal server error" });
		}
	}

	static async login(req, res) {
		try {
			const { email, password } = req.body;
			const user = await Users.findByEmail(email);

			if (!user) {
				return res.status(404).send({ error: "User not found" });
			}

			const isMatch = await bcrypt.compare(password, user.password);

			if (!isMatch) {
				return res
					.status(401)
					.send({ error: "Incorrect login credentials" });
			}

			await Users.updateLastLogin(user.id);
			const payload = {
				userId: user.id,
				email: user.email,
				isAdmin: user.is_admin,
			};
			const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
				expiresIn: "12h",
			});
			delete user.password;
			res.status(200).json({
                user: user,
                token: token
            });
		} catch (error) {
			console.error("Error logging in:", error);
			res.status(500).send({ error: "Internal server error" });
		}
	}

    static async getProfile(req, res) {
        try {
            const user = await Users.findById(req.headers["x-user-id"])
    
            if (!user) {
                return res.status(404).send({ error: "User not found"});
            }
            delete user.password;
            res.status(200).send(user);
        } catch (error) {
            console.error("Error retrieving profile:", error);
            res.status(500).send({ error: "Internal server error" });
        }    
    }

    static async getAllUsers(req, res) {
        try {
            const users = await Users.findAllUsers();
    
            if (users.length === 0) {
                return res.status(404).send({ error: "Users not found" })
            }
            res.status(200).send(users);
        } catch (error) {
            console.error("Error retrieving users:", error);
            res.status(500).send({ error: error.message })
        }    
    }

    static async getById(req, res) {
        try {
            const userId = req.params.id;
            const user = await Users.findById(userId);

            if (!user) return res.status(404).send({ error: "User not found"});

            delete user.password;
            res.status(200).send(user)
        } catch (error) {
            console.error("Error retrieving user:", error);
            res.status(500).send({ error: "Internal server error" });
        }    
    }

    static async deleteUser(req, res) {
        try {
            const userId = req.headers["x-user-id"];
            const deletedUser = await Users.deleteUser(userId);

            if (!deletedUser) {
                return res.status(404).send({ error: "User not found"});
            }

            res.status(204).send();
        } catch (error) {
            console.error("Error deleting user:", error);
            res.status(500).send({ error: error.message })
        }
    }

    static async updateUser(req, res) {
        try {
            const userId = req.headers["x-user-id"];
            const { updates } = req.body;

            const updatedUser = await Users.update(userId, updates);

            if (!updatedUser) {
                return res.status(404).send({ error: "User not found" })
            }

            res.status(200).send(updatedUser);
        } catch (error) {
            console.error("Error updating user:", error);
            res.status(500).send({ error: error.message });
        }
    }
}

export default UsersController;
