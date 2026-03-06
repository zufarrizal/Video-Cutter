const videoFileInput = document.getElementById("videoFile");
const uploadBtn = document.getElementById("uploadBtn");
const cutBtn = document.getElementById("cutBtn");
const videoPreview = document.getElementById("videoPreview");
const startTimeInput = document.getElementById("startTime");
const endTimeInput = document.getElementById("endTime");
const downloadLink = document.getElementById("downloadLink");
const statusEl = document.getElementById("status");
const timeline = document.getElementById("timeline");
const selectedRange = document.getElementById("selectedRange");
const handleA = document.getElementById("handleA");
const handleB = document.getElementById("handleB");
const labelA = document.getElementById("labelA");
const labelB = document.getElementById("labelB");
const playhead = document.getElementById("playhead");

let uploadedFileName = "";
let clipStart = 0;
let clipEnd = 0;
let duration = 0;
let activeHandle = null;

const setStatus = (message, isError = false) => {
  statusEl.textContent = message;
  statusEl.style.color = isError ? "#b10020" : "#2b6e33";
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const toPercent = (time) => {
  if (!duration || !Number.isFinite(duration)) return 0;
  return clamp((time / duration) * 100, 0, 100);
};

const formatTime = (time) => `${Number(time).toFixed(2)}s`;

const renderTimeline = () => {
  const startPct = toPercent(clipStart);
  const endPct = toPercent(clipEnd);
  selectedRange.style.left = `${startPct}%`;
  selectedRange.style.width = `${Math.max(endPct - startPct, 0)}%`;
  handleA.style.left = `${startPct}%`;
  handleB.style.left = `${endPct}%`;
  labelA.textContent = `A: ${formatTime(clipStart)}`;
  labelB.textContent = `B: ${formatTime(clipEnd)}`;
  startTimeInput.value = clipStart.toFixed(2);
  endTimeInput.value = clipEnd.toFixed(2);
};

const renderPlayhead = () => {
  if (!duration) {
    playhead.style.left = "0%";
    return;
  }
  playhead.style.left = `${toPercent(videoPreview.currentTime)}%`;
};

const setClipTimes = (start, end) => {
  if (!duration) return;
  clipStart = clamp(start, 0, duration);
  clipEnd = clamp(end, 0, duration);
  if (clipEnd <= clipStart) {
    clipEnd = Math.min(duration, clipStart + 0.1);
  }
  renderTimeline();
};

const getTimeFromPointer = (clientX) => {
  const rect = timeline.getBoundingClientRect();
  const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
  return ratio * duration;
};

uploadBtn.addEventListener("click", async () => {
  const file = videoFileInput.files[0];
  if (!file) {
    setStatus("Pilih file video terlebih dahulu.", true);
    return;
  }

  const formData = new FormData();
  formData.append("video", file);
  setStatus("Mengupload video...");

  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Upload gagal.");
    }

    uploadedFileName = result.file.name;
    videoPreview.src = result.file.url;
    downloadLink.classList.add("hidden");
    setStatus("Upload berhasil. Silakan tentukan waktu start dan end.");
  } catch (error) {
    setStatus(error.message, true);
  }
});

videoPreview.addEventListener("loadedmetadata", () => {
  duration = videoPreview.duration;
  clipStart = 0;
  clipEnd = duration;
  renderTimeline();
  renderPlayhead();
});

videoPreview.addEventListener("timeupdate", renderPlayhead);

timeline.addEventListener("click", (event) => {
  if (!duration || event.target === handleA || event.target === handleB) return;
  videoPreview.currentTime = getTimeFromPointer(event.clientX);
});

const startDrag = (handleName, event) => {
  if (!duration) return;
  activeHandle = handleName;
  event.preventDefault();
};

handleA.addEventListener("pointerdown", (event) => startDrag("A", event));
handleB.addEventListener("pointerdown", (event) => startDrag("B", event));

window.addEventListener("pointermove", (event) => {
  if (!activeHandle || !duration) return;

  const nextTime = getTimeFromPointer(event.clientX);
  if (activeHandle === "A") {
    setClipTimes(nextTime, clipEnd);
    videoPreview.currentTime = clipStart;
    return;
  }

  setClipTimes(clipStart, nextTime);
  videoPreview.currentTime = clipEnd;
});

window.addEventListener("pointerup", () => {
  activeHandle = null;
});

startTimeInput.addEventListener("input", () => {
  if (!duration) return;
  const nextStart = Number(startTimeInput.value);
  if (Number.isNaN(nextStart)) return;
  setClipTimes(nextStart, clipEnd);
});

endTimeInput.addEventListener("input", () => {
  if (!duration) return;
  const nextEnd = Number(endTimeInput.value);
  if (Number.isNaN(nextEnd)) return;
  setClipTimes(clipStart, nextEnd);
});

cutBtn.addEventListener("click", async () => {
  if (!uploadedFileName) {
    setStatus("Upload video dulu sebelum melakukan cut.", true);
    return;
  }

  const payload = {
    fileName: uploadedFileName,
    startTime: Number(clipStart.toFixed(3)),
    endTime: Number(clipEnd.toFixed(3))
  };

  setStatus("Memproses cut video...");

  try {
    const response = await fetch("/api/cut", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Cut gagal.");
    }

    downloadLink.href = result.output.url;
    downloadLink.classList.remove("hidden");
    setStatus("Video berhasil dipotong.");
  } catch (error) {
    setStatus(error.message, true);
  }
});
