const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const ffmpegPath = require("ffmpeg-static");
const { v4: uuidv4 } = require("uuid");

const app = express();
const DEFAULT_PORT = Number(process.env.PORT) || 3000;
const UPLOAD_DIR = path.join(__dirname, "uploads");
const OUTPUT_DIR = path.join(__dirname, "outputs");

fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uuidv4()}${ext}`);
  }
});

const upload = multer({ storage });

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(UPLOAD_DIR));
app.use("/outputs", express.static(OUTPUT_DIR));

app.post("/api/upload", upload.single("video"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "File video tidak ditemukan." });
  }

  res.json({
    message: "Upload berhasil.",
    file: {
      name: req.file.filename,
      originalName: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      path: req.file.path
    }
  });
});

app.post("/api/cut", async (req, res) => {
  const { fileName, startTime, endTime } = req.body;

  if (!fileName) {
    return res.status(400).json({ error: "fileName wajib diisi." });
  }

  const start = Number(startTime);
  const end = Number(endTime);

  if (Number.isNaN(start) || Number.isNaN(end) || start < 0 || end <= start) {
    return res.status(400).json({ error: "Rentang waktu tidak valid." });
  }

  const inputPath = path.join(UPLOAD_DIR, fileName);
  if (!fs.existsSync(inputPath)) {
    return res.status(404).json({ error: "File input tidak ditemukan." });
  }

  const outputName = `${Date.now()}-cut-${uuidv4()}.mp4`;
  const outputPath = path.join(OUTPUT_DIR, outputName);
  const duration = (end - start).toString();

  const args = [
    "-y",
    "-ss",
    start.toString(),
    "-i",
    inputPath,
    "-t",
    duration,
    "-map",
    "0:v:0",
    "-map",
    "0:a?",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "23",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-movflags",
    "+faststart",
    outputPath
  ];

  const ffmpeg = spawn(ffmpegPath, args);
  let stderr = "";

  ffmpeg.stderr.on("data", (data) => {
    stderr += data.toString();
  });

  ffmpeg.on("close", (code) => {
    if (code !== 0) {
      return res.status(500).json({
        error: "Gagal memotong video.",
        detail: stderr || `ffmpeg exited with code ${code}`
      });
    }

    return res.json({
      message: "Video berhasil dipotong.",
      output: {
        name: outputName,
        url: `/outputs/${outputName}`
      }
    });
  });
});

const MAX_PORT_RETRIES = 10;

function startServer(port, retriesLeft = MAX_PORT_RETRIES) {
  const server = app
    .listen(port, () => {
      console.log(`Video Cutter running at http://localhost:${port}`);
    })
    .on("error", (err) => {
      if (err.code === "EADDRINUSE" && retriesLeft > 0) {
        const nextPort = port + 1;
        console.warn(
          `Port ${port} sedang dipakai. Mencoba port ${nextPort}...`
        );
        startServer(nextPort, retriesLeft - 1);
        return;
      }

      console.error("Gagal menjalankan server:", err.message);
      process.exit(1);
    });

  return server;
}

startServer(DEFAULT_PORT);
