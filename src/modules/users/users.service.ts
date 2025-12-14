import { pool } from "../../config/db"

const getAllUsers = async () => {
    const result = await pool.query(`SELECT id, name, email, phone, role FROM users ORDER BY id`)

    return result.rows
}


const updateUser = async (userId: string, payload: Record<string, unknown>) => {

    const { name, email, phone, role } = payload

    const result = await pool.query(
        `
        UPDATE users
        SET
          name = COALESCE($1, name),
          email = COALESCE($2, email),
          phone = COALESCE($3, phone),
          role = COALESCE($4, role),
          updated_at = NOW()
        WHERE id = $5
        RETURNING id, name, email, phone, role
        `,
        [name ?? null, email ?? null, phone ?? null, role ?? null, userId]
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
