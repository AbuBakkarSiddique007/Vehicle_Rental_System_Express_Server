import { Request, Response } from "express";
import { userService } from "./users.service";

const getAllUsers = async (req: Request, res: Response) => {
    try {
        const result = await userService.getAllUsers()

        res.status(200).json({
            success: true,
            message: "Users retrieved successfully",
            data: result.rows,
        });

    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Failed to retrieve users",
            error: error.message,
        });
    }
}


const updateUser = async (req: Request, res: Response) => {
    const { userId } = req.params

    const result = await userService.updateUser(userId as string, req.body)

    if (result.rowCount === 0) {
        return res.status(404).json({
            success: false,
            message: "User not found",
        });
    }

    res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: {
            id: userId,
            ...req.body
        },
    });
}

const deleteUser = async (req: Request, res: Response) => {

    const { userId } = req.params

    const result = await userService.deleteUser(userId as string)

    if (result.rowCount === 0) {
        return res.status(404).json({
            success: false,
            message: "User not found",
        });
    }

    res.status(200).json({
        success: true,
        message: "User deleted successfully",
    });
}


export const userController = {
    getAllUsers,
    updateUser,
    deleteUser
};