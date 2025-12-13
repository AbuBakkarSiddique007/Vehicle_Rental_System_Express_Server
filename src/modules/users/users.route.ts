import { Router } from "express";
import { userController } from "./users.controller";

const router = Router()

router.get("/", userController.getAllUsers)
router.put("/:userId", userController.updateUser)
router.delete("/:userId", userController.deleteUser)

export const userRoute = router;