const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  if (file.fieldname === 'resume') {
    const allowedDocs = ['.pdf', '.doc', '.docx'];
    if (allowedDocs.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and Word documents (.doc, .docx) are allowed for resumes.'), false);
    }
  } else {
    const allowedImages = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    if (allowedImages.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (.jpg, .jpeg, .png, .gif, .webp) are allowed.'), false);
    }
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

module.exports = upload;
