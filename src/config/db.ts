import { Pool } from "pg"
import config from "./index";


// Database Pool Setup
export const pool = new Pool({
    connectionString: config.connectionString
})

const initDB = async () => {

    await pool.query(``)

}

export default initDB;