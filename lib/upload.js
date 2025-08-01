import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for file uploads
const uploadDir = path.join(
    process.cwd(),
    'public',
    'uploads',
    'profile-images'
);
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        // Use user id and timestamp for unique filenames
        const ext = path.extname(file.originalname);
        cb(null, `user_${req.userId || Date.now()}${ext}`);
    },
});

const upload = multer({ storage });
export default upload;
