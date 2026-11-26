import multer from "multer"

const storage = multer.diskStorage({

    destination: function(req,file,cb){
        cb(null,"./public/temp")
    },
    filename: function(req,file,cb){
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9) // timestamp + random number so every saved file name is unique
        cb(null, uniqueSuffix + "-" + file.originalname) // save as "<unique>-<original name>" so simultaneous uploads with the same name don't overwrite each other
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