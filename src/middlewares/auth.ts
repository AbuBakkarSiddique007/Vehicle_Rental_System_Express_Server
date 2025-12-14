import jwt, { JwtPayload } from 'jsonwebtoken';
import { NextFunction, Request, Response } from "express"
import config from '../config';
import { pool } from '../config/db'

const auth = (...roles: string[]) => {

    return async (req: Request, res: Response, next: NextFunction) => {

        try {
            const authHeader = req.headers.authorization;

            if (!authHeader) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized: No token provided"
                })
            }


            const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

            const secret = config.jwtSecret


            if (!secret) {
                return res.status(500).json({ success: false, message: 'Server configuration error: missing JWT secret' });
            }

            const decoded = jwt.verify(token!, secret) as JwtPayload & { id?: number; role?: string };

            if (!decoded.id) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized: Invalid token payload'
                })
            }

            const queryResult = await pool.query('SELECT id, role FROM users WHERE id = $1', [decoded.id])

            if (!queryResult || !queryResult.rows || queryResult.rows.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized: User not found'
                })
            }

            const dbUser = queryResult.rows[0]

            req.user = {
                ...decoded,
                id: dbUser.id,
                role: dbUser.role
            }

            if (roles.length && !(dbUser.role && roles.includes(dbUser.role))) {
                return res.status(403).json({
                    success: false,
                    message: "Forbidden: You don't have permission to access the path"
                })
            }

            next()

        } catch (error) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Invalid token"
            })
        }
    }
}

export default auth;