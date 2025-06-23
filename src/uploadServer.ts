import express from 'express';
import multer from 'multer';
import path from 'path';

const uploadFolder = 'c:/image_uploads'; //path.join(__dirname, '..', 'uploads');
const app = express();
const port = parseInt(process.env.APPLICATION_PORT || '4000');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

app.post('/upload', upload.single('image'), (req, res) => {
  res.send('File uploaded!');
});

app.listen(port, () => {
  console.log(`Upload server listening at http://localhost:${port}`);
});