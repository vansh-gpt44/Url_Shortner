import Redis from 'ioredis';
import { env } from './env.js';
export const redis=new Redis(env.REDIS_URL,{maxRetriesPerRequest:2,enableReadyCheck:true});
redis.on('error',err=>console.error('Redis error:',err.message));
