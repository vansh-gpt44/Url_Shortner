import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
export const signAccess=user=>jwt.sign({sub:user.id,email:user.email,type:'access'},env.JWT_ACCESS_SECRET,{expiresIn:env.ACCESS_TOKEN_TTL});
export const signRefresh=user=>jwt.sign({sub:user.id,type:'refresh',jti:crypto.randomUUID()},env.JWT_REFRESH_SECRET,{expiresIn:`${env.REFRESH_TOKEN_TTL_DAYS}d`});
export const verifyAccess=token=>jwt.verify(token,env.JWT_ACCESS_SECRET);
export const verifyRefresh=token=>jwt.verify(token,env.JWT_REFRESH_SECRET);
