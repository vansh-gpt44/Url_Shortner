import { AppError } from '../utils/AppError.js';
export const validate=(schema,source='body')=>(req,res,next)=>{const parsed=schema.safeParse(req[source]);if(!parsed.success)return next(new AppError(400,parsed.error.issues.map(x=>x.message).join('; '),'VALIDATION_ERROR'));req[source]=parsed.data;next();};
