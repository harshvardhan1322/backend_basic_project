const asyncHandler = (requestHandler)=>{
    (req,res,next) => {
        Promise.resolve(requestHandler(res,req,next))
        .catch((err)=>next(err))
    }
}

export {asyncHandler}

/*
const asyncHandler = (func) => async(req,res,next) => {
    try{
        await func(req,res)
    }catch(error){
        res.status(err.code || 500).json({
            sucess: false,
            message: err.message
        })
    }
} 
*/