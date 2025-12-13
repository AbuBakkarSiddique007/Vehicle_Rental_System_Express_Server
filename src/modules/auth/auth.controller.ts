import { Request, Response } from "express";
import { authService } from "./auth.service";

const createUser = async (req: Request, res: Response) => {

    try {
        const result = await authService.createUser(req.body)

        res.status(201).json({
            success: true,
            message: "User created successfully",
            data: result,
        });

    } catch (err: any) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}


const loginUser = async (req: Request, res: Response) => {

    try {
        const { email, password } = req.body;

        const result = await authService.loginUser(email, password);

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                token: result.token,
                user: result.user,
            },
        });

    } catch (err: any) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

export const authController = {
    createUser,
    loginUser
}