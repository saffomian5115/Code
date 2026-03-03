import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { FaceDetection } from "@mediapipe/face_detection";
import {
  CheckCircle,
  XCircle,
  ScanFace,
  Clock,
  Users,
  Wifi,
} from "lucide-react";
import { adminAPI } from "../../api/admin.api";

const BASE_URL = "http://127.0.0.1:8000";
const SCAN_COOLDOWN_MS = 3000; // 3 sec baad next scan
const SUCCESS_SHOW_MS = 4000; // 4 sec success card dikhe

// ── Recent Attendance Log Card ─────────────────────────
function LogCard({ entry }) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-500
      ${
        entry.duplicate
          ? "bg-amber-50 border-amber-200"
          : entry.matched
            ? "bg-emerald-50 border-emerald-200"
            : "bg-red-50 border-red-200"
      }`}
    >
      {entry.matched ? (
        entry.profile_picture_url ? (
          <img
            src={`${BASE_URL}${entry.profile_picture_url}`}
            alt={entry.full_name}
            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {entry.full_name?.[0]?.toUpperCase() || "?"}
          </div>
        )
      ) : (
        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
          <XCircle size={18} className="text-red-500" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p
          className={`font-semibold text-sm truncate
          ${entry.matched ? "text-slate-800" : "text-red-600"}`}
        >
          {entry.matched ? entry.full_name : "Unknown Face"}
        </p>
        <p className="text-xs text-slate-400 truncate">
          {entry.matched
            ? `${entry.roll_number || entry.role} • ${Math.round(entry.confidence * 100)}%`
            : "Face not recognized"}
        </p>
      </div>

      <div className="text-right flex-shrink-0">
        {entry.duplicate && (
          <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full block mb-1">
            Duplicate
          </span>
        )}
        <p className="text-xs text-slate-400">{entry.time}</p>
      </div>
    </div>
  );
}

// ── Main Success Overlay ───────────────────────────────
function SuccessOverlay({ data, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, SUCCESS_SHOW_MS);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20 rounded-2xl">
      <div className="text-center animate-bounce-once">
        {data.profile_picture_url ? (
          <img
            src={`${BASE_URL}${data.profile_picture_url}`}
            alt={data.full_name}
            className="w-28 h-28 rounded-full object-cover border-4 border-emerald-400 mx-auto shadow-2xl"
          />
        ) : (
          <div className="w-28 h-28 rounded-full bg-emerald-500 border-4 border-emerald-300 mx-auto flex items-center justify-center shadow-2xl">
            <span className="text-white font-bold text-4xl">
              {data.full_name?.[0]?.toUpperCase() || "?"}
            </span>
          </div>
        )}
        <div className="mt-4">
          <CheckCircle size={36} className="text-emerald-400 mx-auto mb-2" />
          <p className="text-white text-2xl font-bold">{data.full_name}</p>
          <p className="text-emerald-300 text-sm mt-1">
            {data.roll_number && `${data.roll_number} • `}
            Attendance Marked ✓
          </p>
          <p className="text-white/50 text-xs mt-2">
            {Math.round(data.confidence * 100)}% match
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Fail Flash ─────────────────────────────────────────
function FailFlash({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="absolute inset-0 bg-red-900/50 backdrop-blur-sm flex items-center justify-center z-20 rounded-2xl">
      <div className="text-center">
        <XCircle size={48} className="text-red-400 mx-auto mb-3" />
        <p className="text-white text-xl font-bold">Chehra Pehchana Nahi</p>
        <p className="text-red-300 text-sm mt-1">Face not recognized</p>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────
export default function GateAttendancePage() {
  const [searchParams] = useSearchParams();
  const gateId = parseInt(searchParams.get("gate_id") || "1");
  const cameraId = parseInt(searchParams.get("camera_id") || "1");
  const direction = searchParams.get("direction") || "in";

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const capCanvasRef = useRef(null);
  const mpFaceRef = useRef(null);
  const lastScanRef = useRef(0);
  const processingRef = useRef(false);

  const [status, setStatus] = useState("loading"); // loading | scanning | success | fail
  const [successData, setSuccessData] = useState(null);
  const [log, setLog] = useState([]);
  const [stats, setStats] = useState({ total: 0, unique: 0 });
  const [camError, setCamError] = useState(null);

  // ── MediaPipe + Camera Setup ───────────────────────
  useEffect(() => {
    let animId;
    let faceMesh;

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
          audio: false,
        });
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();

        // ✅ LoginPage jaisa — npm package, CDN nahi
        const fd = new FaceDetection({
          locateFile: (file) =>
            `/node_modules/@mediapipe/face_detection/${file}`,
        });
        fd.setOptions({ model: "short", minDetectionConfidence: 0.6 });

        fd.onResults((results) => {
          const faces = results.detections ?? [];
          drawOverlay(faces); // ab bounding box ke liye faces array milega
          if (faces.length === 1) {
            tryCapture(faces[0].boundingBox);
          }
        });

        mpFaceRef.current = fd;
        setStatus("scanning");

        const tick = async () => {
          if (videoRef.current?.readyState === 4) {
            await fd.send({ image: videoRef.current });
          }
          animId = requestAnimationFrame(tick);
        };
        tick();
      } catch (err) {
        setCamError(err.message);
        setStatus("scanning");
      }
    };

    init();

    return () => {
      cancelAnimationFrame(animId);
      faceMesh?.close?.();
      const vid = videoRef.current;
      if (vid?.srcObject) {
        vid.srcObject.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // ── Draw Face Box on Canvas ────────────────────────
  const drawOverlay = (faces) => {
    // <-- ab "results" nahi, "faces" array
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!faces.length) return;

    const box = faces[0].boundingBox;
    const vw = canvas.width,
      vh = canvas.height;
    const pad = 0.05;
    const x = (box.xCenter - box.width / 2 - pad * box.width) * vw;
    const y = (box.yCenter - box.height / 2 - pad * box.height) * vh;
    const w = (box.width + 2 * pad * box.width) * vw;
    const h = (box.height + 2 * pad * box.height) * vh;
    const cs = 22;

    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 3;
    ctx.shadowColor = "#10b981";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(x + cs, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + cs);
    ctx.moveTo(x + w - cs, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + cs);
    ctx.moveTo(x, y + h - cs);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x + cs, y + h);
    ctx.moveTo(x + w - cs, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + w, y + h - cs);
    ctx.stroke();
  };

  // ── Auto Capture ───────────────────────────────────
  const tryCapture = useCallback(
    async (box) => {
      if (processingRef.current) return;
      const now = Date.now();
      if (now - lastScanRef.current < SCAN_COOLDOWN_MS) return;
      if (status === "success" || status === "fail") return;

      const video = videoRef.current;
      const cap = capCanvasRef.current;
      if (!video || !cap) return;

      const vw = video.videoWidth || 640;
      const vh = video.videoHeight || 480;
      const pad = 0.28;

      // Calculate bounding box in pixel coordinates
      let px = (box.xCenter - box.width / 2 - pad * box.width) * vw;
      let py = (box.yCenter - box.height / 2 - pad * box.height) * vh;
      let pw = (box.width + 2 * pad * box.width) * vw;
      let ph = (box.height + 2 * pad * box.height) * vh;

      // Clamp to video boundaries
      px = Math.max(0, px);
      py = Math.max(0, py);
      pw = Math.min(pw, vw - px);
      ph = Math.min(ph, vh - py);

      // Draw cropped region
      cap.width = Math.round(pw);
      cap.height = Math.round(ph);
      cap
        .getContext("2d")
        .drawImage(video, px, py, pw, ph, 0, 0, cap.width, cap.height);

      const base64 = cap.toDataURL("image/jpeg", 0.92);

      processingRef.current = true;
      lastScanRef.current = now;

      try {
        const res = await adminAPI.gateAttendance({
          image_base64: base64,
          gate_id: gateId,
          camera_id: cameraId,
          entry_direction: direction,
        });

        const data = res.data?.data;

        if (data?.matched) {
          setSuccessData(data);
          setStatus("success");

          const entry = {
            ...data,
            time: new Date().toLocaleTimeString("en-PK", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            id: Date.now(),
          };
          setLog((prev) => [entry, ...prev].slice(0, 20));
          setStats((prev) => ({
            total: prev.total + 1,
            unique: data.duplicate ? prev.unique : prev.unique + 1,
          }));
        } else {
          setStatus("fail");
          const entry = {
            matched: false,
            time: new Date().toLocaleTimeString("en-PK", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            id: Date.now(),
          };
          setLog((prev) => [entry, ...prev].slice(0, 20));
        }
      } catch {
        setStatus("fail");
      } finally {
        processingRef.current = false;
      }
    },
    [status, gateId, cameraId, direction],
  );

  const handleOverlayDone = useCallback(() => {
    setStatus("scanning");
    setSuccessData(null);
  }, []);

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-PK", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateStr = now.toLocaleDateString("en-PK", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <>
      {/* Load MediaPipe from CDN */}

      <div
        className="min-h-screen bg-slate-950 flex flex-col"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <ScanFace size={20} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Gate AI Attendance</p>
              <p className="text-slate-400 text-xs">
                Gate #{gateId} • Camera #{cameraId} • {direction.toUpperCase()}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-white font-mono font-bold text-lg">{timeStr}</p>
            <p className="text-slate-400 text-xs">{dateStr}</p>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 gap-0">
          {/* Camera Section */}
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="relative w-full max-w-lg">
              {/* Camera Feed */}
              <div className="relative bg-slate-900 rounded-2xl overflow-hidden aspect-[4/3] border border-slate-700 shadow-2xl">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover scale-x-[-1]"
                  playsInline
                  muted
                  autoPlay
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full scale-x-[-1]"
                  style={{ pointerEvents: "none" }}
                />
                <canvas ref={capCanvasRef} className="hidden" />

                {/* Status Bar */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        status === "scanning"
                          ? "bg-emerald-400 animate-pulse"
                          : status === "success"
                            ? "bg-emerald-400"
                            : status === "fail"
                              ? "bg-red-400"
                              : "bg-amber-400 animate-pulse"
                      }`}
                    />
                    <p className="text-white text-sm font-medium">
                      {status === "loading" && "Camera load ho rahi hai..."}
                      {status === "scanning" &&
                        "Scanning — chehra frame mein rakhein"}
                      {status === "success" && "✓ Attendance mark ho gayi!"}
                      {status === "fail" && "✗ Chehra pehchana nahi gaya"}
                    </p>
                  </div>
                </div>

                {/* Overlays */}
                {status === "success" && successData && (
                  <SuccessOverlay
                    data={successData}
                    onDone={handleOverlayDone}
                  />
                )}
                {status === "fail" && <FailFlash onDone={handleOverlayDone} />}

                {/* Camera error */}
                {camError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                    <div className="text-center p-6">
                      <XCircle
                        size={40}
                        className="text-red-400 mx-auto mb-3"
                      />
                      <p className="text-white font-semibold">Camera Error</p>
                      <p className="text-slate-400 text-xs mt-1">{camError}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-slate-900 rounded-xl p-3 border border-slate-700 text-center">
                  <p className="text-2xl font-bold text-emerald-400">
                    {stats.unique}
                  </p>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Unique Students
                  </p>
                </div>
                <div className="bg-slate-900 rounded-xl p-3 border border-slate-700 text-center">
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                  <p className="text-slate-400 text-xs mt-0.5">Total Scans</p>
                </div>
              </div>
            </div>
          </div>

          {/* Log Panel */}
          <div className="w-80 border-l border-slate-800 flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center gap-2">
              <Users size={16} className="text-slate-400" />
              <p className="text-slate-300 font-semibold text-sm">
                Recent Attendance
              </p>
              {log.length > 0 && (
                <span className="ml-auto bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full">
                  {log.length}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {log.length === 0 ? (
                <div className="text-center py-16">
                  <Clock size={32} className="text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">
                    Abhi koi attendance nahi
                  </p>
                  <p className="text-slate-600 text-xs mt-1">
                    Students frame mein aayenge to yahan dikhe ga
                  </p>
                </div>
              ) : (
                log.map((entry) => <LogCard key={entry.id} entry={entry} />)
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
