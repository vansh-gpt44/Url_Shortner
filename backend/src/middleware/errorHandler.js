export function notFound(req,res){res.status(404).json({error:{code:'NOT_FOUND',message:'Route not found'}})}
export function errorHandler(err,req,res,next){
  const status=Number(err.status)||500;
  if(status>=500) console.error(err);
  res.status(status).json({error:{code:err.code||'INTERNAL_ERROR',message:status>=500?'Internal server error':err.message}});
}
