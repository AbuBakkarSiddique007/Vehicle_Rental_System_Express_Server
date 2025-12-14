import cron from 'node-cron'
import { pool } from '../config/db'

const AUTO_RETURN_CRON = '*/15 * * * *'

export async function runAutoReturn() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const sql = `
      WITH returned AS (
        UPDATE bookings
        SET status = 'returned'
        WHERE status = 'active' AND rent_end_date < now()
        RETURNING vehicle_id
      )
      UPDATE vehicles v
      SET availability_status = 'available'
      FROM returned r
      WHERE v.id = r.vehicle_id
        AND NOT EXISTS (
          SELECT 1 FROM bookings b
          WHERE b.vehicle_id = v.id AND b.status = 'active'
        )
      RETURNING v.id;
    `

    const result = await client.query(sql)
    await client.query('COMMIT')

    if (result && result.rowCount) {
      console.log(`Auto-return: updated ${result.rowCount} vehicle(s) availability and marked bookings returned.`)
    } else {
      console.log('Auto-return: no bookings to update.')
    }
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Auto-return job failed:', err)
  } finally {
    client.release()
  }
}

export function startAutoReturn() {
  try {
    cron.schedule(
      AUTO_RETURN_CRON,
      () => {
        runAutoReturn().catch((err) => console.error('Auto-return run failed:', err))
      },
      { timezone: 'UTC' }
    )
    console.log(`Auto-return scheduler started (cron: ${AUTO_RETURN_CRON})`)
  } catch (err) {
    console.error('Failed to start auto-return scheduler:', err)
  }
}
