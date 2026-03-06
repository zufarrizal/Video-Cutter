# Video Cutter (JavaScript)

Web app untuk memotong video berbasis JavaScript (Node.js + browser UI).

## Fitur

- Upload file video dari browser
- Preview video
- Pilih rentang potong dengan drag marker `A` (awal) dan `B` (akhir) di timeline
- Input `start/end` (detik) yang sinkron dengan marker timeline
- Klik timeline untuk seek posisi video
- Potong video menggunakan FFmpeg
- Re-encode aman (`H.264 + AAC`) agar audio tetap ikut
- Download hasil potongan
- Auto fallback port (`3000`, `3001`, dst) jika port sedang dipakai

## Tech Stack

- Node.js
- Express
- Multer 2
- ffmpeg-static
- Vanilla HTML/CSS/JS

## Menjalankan

```bash
npm install
npm start
```

Buka: `http://localhost:3000`  
Jika port `3000` dipakai, server otomatis pindah ke port berikutnya dan akan tampil di log terminal.

## Cara Pakai

1. Pilih file video lalu klik **Upload**.
2. Seret marker **A** dan **B** di timeline untuk menentukan awal/akhir potongan.
3. Opsional: edit nilai `Start` dan `End` manual.
4. Klik **Cut Video**.
5. Download hasil pada bagian **Hasil**.

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

## Catatan

- Folder `uploads/` dan `outputs/` akan dibuat otomatis saat server start.
- Output video disimpan sebagai `.mp4`.
