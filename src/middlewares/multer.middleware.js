import multer from "multer"

const storage = multer.diskStorage({

    destination: function(req,file,cb){
        cb(null,"./public/temp")
    },
    filename: function(req,file,cb){
        cb(null,req.fieldname+'-'+uniquSuffix)
    }
})

export const upload = multer({
    storage: storage
})

/*
1. Frontend Browser] 
      │ (Sends raw binary file data over HTTPS)
      ▼
[2. Express Server (Node.js)] 
      │ (Incoming data is unreadable stream)
      ▼
[3. Multer Middleware] ──► (Parses stream, extracts file, places it in RAM)
      │ 
      ▼
[4. Cloudinary SDK] ──► (Uploads parsed file to Cloudinary Cloud)
      │
      ▼
[5. Database] ◄──────── (Saves the final Cloudinary image URL)
*/