import { register,login,refresh,logout } from '../services/authService.js';
import { env } from '../config/env.js';
const cookieBase={httpOnly:true,secure:env.COOKIE_SECURE==='true',sameSite:'lax',path:'/'};
function setCookies(res,result){res.cookie('accessToken',result.accessToken,{...cookieBase,maxAge:15*60*1000});res.cookie('refreshToken',result.refreshToken,{...cookieBase,path:'/api/auth',maxAge:env.REFRESH_TOKEN_TTL_DAYS*86400000});}
export async function registerController(req,res){const result=await register(req.body);setCookies(res,result);res.status(201).json({user:result.user});}
export async function loginController(req,res){const result=await login(req.body);setCookies(res,result);res.json({user:result.user});}
export async function refreshController(req,res){const result=await refresh(req.cookies?.refreshToken);setCookies(res,result);res.json({user:result.user});}
export async function logoutController(req,res){await logout(req.cookies?.refreshToken);res.clearCookie('accessToken',{...cookieBase});res.clearCookie('refreshToken',{...cookieBase,path:'/api/auth'});res.status(204).end();}
