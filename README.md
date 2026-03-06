# Video Cutter (JavaScript)

Web app sederhana untuk memotong video berdasarkan waktu `start` dan `end`.

## Fitur

- Upload file video dari browser
- Preview video
- Input waktu mulai dan akhir (detik)
- Potong video menggunakan FFmpeg
- Download hasil potongan

## Tech Stack

- Node.js
- Express
- Multer (upload file)
- ffmpeg-static
- Vanilla HTML/CSS/JS

## Menjalankan

```bash
npm install
npm start
```

Buka: `http://localhost:3000`

## API

- `POST /api/upload` (form-data: `video`)
- `POST /api/cut` (JSON):

```json
{
  "fileName": "nama-file-upload.mp4",
  "startTime": 5,
  "endTime": 15
}
```
