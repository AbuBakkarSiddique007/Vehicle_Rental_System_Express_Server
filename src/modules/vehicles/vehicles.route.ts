import { Router } from "express";
import { vehicleController } from "./vehicles.controller";

const router = Router()

router.post("/", vehicleController.createVehicle)
router.get("/", vehicleController.getAllVehicles)
router.get("/:vehicleId", vehicleController.getVehicleById)
router.put("/:vehicleId", vehicleController.updateVehicle)
router.delete("/:vehicleId", vehicleController.deleteVehicle)


export const vehicleRoute = router;