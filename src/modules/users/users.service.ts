import { pool } from "../../config/db"

const getAllUsers = async () => {
    const result = await pool.query(`SELECT * FROM users`)

    return result
}


const updateUser = async (userId: string, payload: Record<string, unknown>) => {

    const { name, email, phone, role } = payload

    const result = await pool.query(
        `
        UPDATE users SET name=$1, email=$2, phone=$3, role=$4 WHERE id=$5
        `,
        [name, email, phone, role, userId]
    )

    return result
}


const deleteUser = async (userId: string) => {

    const isActive = await pool.query(
        `
        SELECT 1 FROM bookings WHERE customer_id=$1 AND status='active' LIMIT 1
        `,
        [userId]
    );

    if (isActive.rows.length > 0) {
        throw new Error("Cannot delete user with active bookings");
    }

    const result = await pool.query(
        `DELETE FROM users WHERE id=$1 RETURNING *`,
        [userId]
    );
    
    return result;
}


export const userService = {
    getAllUsers,
    updateUser,
    deleteUser

}
