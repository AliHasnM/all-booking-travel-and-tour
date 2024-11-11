import multer from "multer";
// Configure storage options for multer
const storage = multer.diskStorage({
  // Set the destination folder for uploaded files
  destination: function (req, file, cb) {
    // Specify the folder where files should be stored
    cb(null, "./public/temp");
  },
  // Set the filename for the uploaded files
  filename: function (req, file, cb) {
    // Use the original filename of the uploaded file
    cb(null, file.originalname);
  },
});

// Create an upload instance with the configured storage
export const upload = multer({
  storage,
});
