import { nanoid,customAlphabet } from 'nanoid';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/db.js';
import { redis } from '../config/redis.js';
import { AppError } from '../utils/AppError.js';
const alphabet='0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-';
const makeCode=customAlphabet(alphabet,7);
const cacheKey=code=>`url:${code}`;
const safeUrl=value=>{let u;try{u=new URL(value)}catch{throw new AppError(400,'A valid URL is required','INVALID_URL')}if(!['http:','https:'].includes(u.protocol))throw new AppError(400,'Only HTTP and HTTPS URLs are allowed','INVALID_URL');return u.toString()};
export async function createUrl(ownerId,input){
 const originalUrl=safeUrl(input.originalUrl);let code=input.alias?.trim()||makeCode();
 if(!/^[a-zA-Z0-9_-]{3,32}$/.test(code))throw new AppError(400,'Alias must be 3–32 letters, numbers, underscores or hyphens','INVALID_ALIAS');
 const row={code,original_url:originalUrl,owner_id:ownerId,expires_at:input.expiresAt||null,password_hash:input.password?await bcrypt.hash(input.password,12):null};
 const {data,error}=await supabase.from('urls').insert(row).select('*').single();if(error){if(error.code==='23505')throw new AppError(409,'That short code is already taken','ALIAS_TAKEN');throw error;}await redis.del(cacheKey(code));return data;
}
export async function listUrls(ownerId){const {data,error}=await supabase.from('urls').select('*').eq('owner_id',ownerId).order('created_at',{ascending:false});if(error)throw error;return data;}
export async function getOwnedUrl(ownerId,id){const {data,error}=await supabase.from('urls').select('*').eq('id',id).eq('owner_id',ownerId).maybeSingle();if(error)throw error;if(!data)throw new AppError(404,'Link not found','URL_NOT_FOUND');return data;}
export async function updateUrl(ownerId,id,input){const old=await getOwnedUrl(ownerId,id);const patch={};if(input.originalUrl)patch.original_url=safeUrl(input.originalUrl);if(input.expiresAt!==undefined)patch.expires_at=input.expiresAt||null;if(input.password!==undefined)patch.password_hash=input.password?await bcrypt.hash(input.password,12):null;
 const {data,error}=await supabase.from('urls').update(patch).eq('id',id).select('*').single();if(error)throw error;await redis.del(cacheKey(old.code));return data;}
export async function deleteUrl(ownerId,id){const row=await getOwnedUrl(ownerId,id);const {error}=await supabase.from('urls').delete().eq('id',id);if(error)throw error;await redis.del(cacheKey(row.code));return {ok:true};}
export async function resolveCode(code){const key=cacheKey(code);const cached=await redis.get(key);if(cached){const parsed=JSON.parse(cached);if(parsed.missing)throw new AppError(404,'Short link not found','URL_NOT_FOUND');if(parsed.expired)throw new AppError(410,'This short link has expired','URL_EXPIRED');return parsed;}
 const {data,error}=await supabase.from('urls').select('id,code,original_url,expires_at,password_hash,owner_id').eq('code',code).maybeSingle();if(error)throw error;
 if(!data){await redis.set(key,JSON.stringify({missing:true}),'EX',30);throw new AppError(404,'Short link not found','URL_NOT_FOUND');}
 if(data.expires_at&&new Date(data.expires_at)<=new Date()){await redis.set(key,JSON.stringify({expired:true}),'EX',60);throw new AppError(410,'This short link has expired','URL_EXPIRED');}
 const ttl=data.expires_at?Math.max(1,Math.min(3600,Math.floor((new Date(data.expires_at)-Date.now())/1000))):3600;
 const payload={id:data.id,code:data.code,originalUrl:data.original_url,expiresAt:data.expires_at,passwordProtected:Boolean(data.password_hash),ownerId:data.owner_id};await redis.set(key,JSON.stringify(payload),'EX',ttl);return payload;
}
export async function checkPassword(code,password){const {data,error}=await supabase.from('urls').select('password_hash').eq('code',code).maybeSingle();if(error)throw error;if(!data)throw new AppError(404,'Short link not found','URL_NOT_FOUND');if(!data.password_hash||await bcrypt.compare(password,data.password_hash))return true;throw new AppError(401,'Incorrect link password','BAD_LINK_PASSWORD');}
