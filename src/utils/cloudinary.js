import {v2 as cloudinary} from "cloudinary"
import fs from "fs"//file system

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null

        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath , {
            resource_type: "auto"
        })
        //file has been uploaded successful
        console.log("fileis uploaded on cloudinary",response.url);
        return response;

    } catch(error){
        fs.unlinkSync(localFilePath)//removes the locally saved temporary file as uplaod function failed 
        return null;
    }
}

export {uploadOnCloudinary};

/*
summary workflow
1.User uploads a file → saved temporarily to your local disk.
2.uploadOnCloudinary(filePath) is called.
3.If upload succeeds → returns Cloudinary details (URL).
4.If upload fails → deletes local file and returns null.
*/