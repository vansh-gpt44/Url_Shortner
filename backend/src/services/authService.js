import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { supabase } from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { signAccess,signRefresh,verifyRefresh } from '../utils/tokens.js';
import { env } from '../config/env.js';
const hashToken=token=>crypto.createHash('sha256').update(token).digest('hex');
export async function register({email,password}){
 const normalized=email.toLowerCase(); const {data:existing,error:lookupErr}=await supabase.from('users').select('id').eq('email',normalized).maybeSingle();
 if(lookupErr) throw lookupErr; if(existing) throw new AppError(409,'Email already registered','EMAIL_EXISTS');
 const {data:user,error}=await supabase.from('users').insert({email:normalized,password_hash:await bcrypt.hash(password,12)}).select('id,email').single(); if(error) throw error;
 return issue(user);
}
export async function login({email,password}){
 const {data:user,error}=await supabase.from('users').select('*').eq('email',email.toLowerCase()).maybeSingle(); if(error) throw error;
 if(!user||!(await bcrypt.compare(password,user.password_hash))) throw new AppError(401,'Invalid email or password','INVALID_CREDENTIALS');
 return issue({id:user.id,email:user.email});
}
async function issue(user){const accessToken=signAccess(user),refreshToken=signRefresh(user); const claims=verifyRefresh(refreshToken); const {error}=await supabase.from('refresh_tokens').insert({user_id:user.id,token_hash:hashToken(refreshToken),jti:claims.jti,expires_at:new Date(Date.now()+env.REFRESH_TOKEN_TTL_DAYS*86400000).toISOString()});if(error)throw error;return {user,accessToken,refreshToken};}
export async function refresh(raw){
 let claims;try{claims=verifyRefresh(raw)}catch{throw new AppError(401,'Invalid refresh token','INVALID_REFRESH')}
 const {data:row,error}=await supabase.from('refresh_tokens').select('*').eq('jti',claims.jti).eq('user_id',claims.sub).maybeSingle();if(error)throw error;
 if(!row||row.revoked_at||row.token_hash!==hashToken(raw))throw new AppError(401,'Refresh token has been revoked','INVALID_REFRESH');
 const {error:revErr}=await supabase.from('refresh_tokens').update({revoked_at:new Date().toISOString()}).eq('id',row.id);if(revErr)throw revErr;
 const {data:user,error:userErr}=await supabase.from('users').select('id,email').eq('id',claims.sub).single();if(userErr)throw userErr;return issue(user);
}
export async function logout(raw){if(!raw)return;try{const claims=verifyRefresh(raw);await supabase.from('refresh_tokens').update({revoked_at:new Date().toISOString()}).eq('jti',claims.jti).eq('user_id',claims.sub)}catch{/* invalid token is already effectively logged out */}}
