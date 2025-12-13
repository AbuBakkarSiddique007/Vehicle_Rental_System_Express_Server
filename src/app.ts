import express, { Request, Response } from 'express'
import initDB from './config/db'
import { vehicleRoute } from './modules/vehicles/vehicles.route';
import { authRoute } from './modules/auth/auth.route';
import { userRoute } from './modules/users/users.route';
import { bookingRoute } from './modules/bookings/bookings.route';

const app = express()

app.use(express.json())

initDB();


app.get('/', (req: Request, res: Response) => {
    res.send('Hello World!')
})

// Vehicles
app.use("/api/v1/vehicles", vehicleRoute)

// Auth
app.use("/api/v1/auth", authRoute)

// Users
app.use("/api/v1/users",userRoute)


// Bookings
app.use("/api/v1/bookings",bookingRoute)



app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
        path: req.path,
    });
});

export default app