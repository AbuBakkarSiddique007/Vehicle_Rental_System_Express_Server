import bcrypt from "bcryptjs"
import { pool } from "../../config/db"
import config from "../../config"
import jwt from "jsonwebtoken"

const createUser = async (payload: Record<string, unknown>) => {

    const { name, email, password, phone, role } = payload
    const hashPassword = await bcrypt.hash(password as string, 12)

    const result = await pool.query(
        `
        INSERT INTO users(name, email, password, phone, role) VALUES($1, $2, $3, $4, $5) RETURNING id, name, email, phone, role
        `,
        [name, email, hashPassword, phone, role])


    // delete result.rows[0].password
    // delete result.rows[0].created_at
    // delete result.rows[0].updated_at

    return result.rows[0]
}


const loginUser = async (email: string, password: string) => {

    const result = await pool.query(
        `
        SELECT * FROM users WHERE email=$1
        `,
        [email]
    )

    if (result.rowCount === 0) {
        throw new Error("Invalid email or password")
    }

    const user = result.rows[0]

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
        throw new Error("Password is incorrect")
    }

    const secret = config.jwtSecret

    if (!secret) {
        throw new Error("JWT secret is not defined");
    }

    const token = jwt.sign(
        {
            name: user.name,
            email: user.email,
            role: user.role
        },
        secret,
        {
            expiresIn: "7d"
        })

    const { password: _password, created_at, updated_at, ...newUser } = user;

    return { token, user: newUser }
}

export const authService = {
    createUser,
    loginUser
}