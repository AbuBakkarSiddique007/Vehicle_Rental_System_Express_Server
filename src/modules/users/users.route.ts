import { Router } from "express";
import { userController } from "./users.controller";
import auth from "../../middlewares/auth";

const router = Router()

router.get("/", auth("admin"), userController.getAllUsers)
router.put("/:userId", auth(), userController.updateUser)
router.delete("/:userId", auth("admin"), userController.deleteUser)

export const userRoute = router;