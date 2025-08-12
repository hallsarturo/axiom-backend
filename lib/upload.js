import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Profile images
const profileDir = path.join(
    process.cwd(),
    'public',
    'uploads',
    'profile-images'
);
fs.mkdirSync(profileDir, { recursive: true });
const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, profileDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `user_${req.userId || Date.now()}${ext}`);
    },
});
export const uploadProfileImage = multer({ storage: profileStorage });

// Post images
const postDir = path.join(process.cwd(), 'public', 'uploads', 'post-images');
fs.mkdirSync(postDir, { recursive: true });
const postStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, postDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `post_${req.userId || Date.now()}${ext}`);
    },
});
export const uploadPostImage = multer({ storage: postStorage });
