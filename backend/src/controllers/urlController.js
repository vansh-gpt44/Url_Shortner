import * as urls from '../services/urlService.js';
import { analytics,enqueueClick } from '../services/analyticsService.js';
import QRCode from 'qrcode';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
export async function create(req,res){const row=await urls.createUrl(req.user.id,req.body);res.status(201).json({url:row,shortUrl:`${env.PUBLIC_BASE_URL}/${row.code}`});}
export async function list(req,res){res.json({urls:await urls.listUrls(req.user.id)});}
export async function update(req,res){res.json({url:await urls.updateUrl(req.user.id,req.params.id,req.body)});}
export async function remove(req,res){await urls.deleteUrl(req.user.id,req.params.id);res.status(204).end();}
export async function qr(req,res){const row=await urls.getOwnedUrl(req.user.id,req.params.id);const png=await QRCode.toDataURL(`${env.PUBLIC_BASE_URL}/${row.code}`);res.json({dataUrl:png});}
export async function getAnalytics(req,res){const result=await analytics(req.user.id,req.params.id);if(!result)throw new AppError(404,'Link not found','URL_NOT_FOUND');res.json(result);}
export async function redirect(req,res,next){try{const url=await urls.resolveCode(req.params.code);if(url.passwordProtected){return res.status(401).type('html').send('<!doctype html><html><meta name="viewport" content="width=device-width"><title>Password required</title><body><h1>Password-protected link</h1><form method="post" action="/p/'+encodeURIComponent(url.code)+'"><input type="password" name="password" required placeholder="Link password"><button>Continue</button></form></body></html>');}void enqueueClick(url,req);res.redirect(302,url.originalUrl);}catch(err){if(err.status===404||err.status===410)return res.status(err.status).type('html').send(`<!doctype html><html><title>Link unavailable</title><body><h1>${err.status===410?'Link expired':'Link not found'}</h1><p>This short link is unavailable.</p></body></html>`);next(err);}}
export async function passwordRedirect(req,res,next){try{await urls.checkPassword(req.params.code,req.body.password);const url=await urls.resolveCode(req.params.code);void enqueueClick(url,req);res.redirect(302,url.originalUrl);}catch(err){res.status(err.status||400).type('html').send(`<h1>${err.status===401?'Incorrect password':'Link unavailable'}</h1><a href="/${encodeURIComponent(req.params.code)}">Try again</a>`);}}
