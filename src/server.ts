import app from "./app"
import config from "./config"
import { startAutoReturn } from "./jobs/booking.autoReturn.job"

const port = config.port

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
    startAutoReturn()
})