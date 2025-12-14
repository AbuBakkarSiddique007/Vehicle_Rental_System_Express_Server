import jwt, { JwtPayload } from 'jsonwebtoken';
import { NextFunction, Request, Response } from "express"
import config from '../config';

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
            req.user = decoded;


            if (roles.length && !(decoded.role && roles.includes(decoded.role))) {
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