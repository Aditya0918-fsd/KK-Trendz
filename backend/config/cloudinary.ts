import multer from 'multer';
import path from 'path';
import fs from 'fs';

// We fallback to local disk storage since Cloudinary credentials are invalid or missing
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const diskUpload = multer({ storage: storage });

const upload = {
    single: (fieldname: string) => {
        return (req: any, res: any, next: any) => {
            diskUpload.single(fieldname)(req, res, (err) => {
                if (err) return next(err);
                if (req.file) {
                    // Normalize the file paths to relative URLs so the DB stores the web-accessible URL
                    req.file.path = `/uploads/${req.file.filename}`;
                    req.file.url = `/uploads/${req.file.filename}`;
                    req.file.secure_url = `/uploads/${req.file.filename}`;
                }
                next();
            });
        };
    }
};

export { upload };
export const cloudinary = null;
