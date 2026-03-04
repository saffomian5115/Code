import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, ScanFace, Users, Maximize2, Minimize2 } from "lucide-react";
import { FaceDetection } from "@mediapipe/face_detection";
import { adminAPI } from "../../api/admin.api";

const BASE_URL = "http://127.0.0.1:8000";
const SCAN_COOLDOWN_MS = 3000;
const SUCCESS_SHOW_MS  = 2000; 

// ── Log Card — sirf matched unique students ────────────
function LogCard({ entry }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border bg-emerald-50 border-emerald-200 transition-all duration-300">
      {entry.profile_picture_url ? (
        <img
          src={`${BASE_URL}${entry.profile_picture_url}`}
          alt={entry.full_name}
          className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-11 h-11 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold flex-shrink-0">
          {entry.full_name?.[0]?.toUpperCase() || "?"}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate text-slate-800">{entry.full_name}</p>
      </div>
      <p className="text-xs text-slate-400 flex-shrink-0">{entry.time}</p>
    </div>
  );
}

// ── Success Overlay ────────────────────────────────────
function SuccessOverlay({ data, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, SUCCESS_SHOW_MS);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20 rounded-2xl">
      <div className="text-center">
        {data.profile_picture_url ? (
          <img
            src={`${BASE_URL}${data.profile_picture_url}`}
            alt={data.full_name}
            className="w-28 h-28 rounded-full object-cover border-4 border-emerald-400 mx-auto shadow-2xl"
          />
        ) : (
          <div className="w-28 h-28 rounded-full bg-emerald-500 border-4 border-emerald-300 mx-auto flex items-center justify-center shadow-2xl">
            <span className="text-white font-bold text-4xl">{data.full_name?.[0]?.toUpperCase() || "?"}</span>
          </div>
        )}
        <div className="mt-4">
          <CheckCircle size={36} className="text-emerald-400 mx-auto mb-2" />
          <p className="text-white text-2xl font-bold">{data.full_name}</p>
          <p className="text-emerald-300 text-sm mt-1">
            {data.roll_number && `${data.roll_number} • `}Attendance Marked ✓
          </p>
          
        </div>
      </div>
    </div>
  );
}

// ── Fail Flash — 2: sirf red border pulse, koi text nahi ──
function FailFlash({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="absolute inset-0 z-20 rounded-2xl pointer-events-none border-4 border-red-500 animate-pulse" />
  );
}

// ── Main Page ──────────────────────────────────────────
export default function GateAttendancePage() {
  const [searchParams] = useSearchParams();
  const gateId    = parseInt(searchParams.get("gate_id")    || "1");
  const cameraId  = parseInt(searchParams.get("camera_id")  || "1");
  const direction = searchParams.get("direction") || "in";

  const videoRef       = useRef(null);
  const canvasRef      = useRef(null);
  const capCanvasRef   = useRef(null);
  const streamRef      = useRef(null);
  const detectorRef    = useRef(null);
  const loopRef        = useRef(null);
  const lastScanRef    = useRef(0);
  const processingRef  = useRef(false);
  const statusRef      = useRef("loading");

  const [status, setStatusState]      = useState("loading");
  const [successData, setSuccessData] = useState(null);
  const [log, setLog]                 = useState([]);       // 3: only unique matched
  const [stats, setStats]             = useState({ total: 0, unique: 0 });
  const [camError, setCamError]       = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);  // 4: fullscreen state

  const setStatus = useCallback((val) => {
    statusRef.current = val;
    setStatusState(val);
  }, []);

  // ── 4: Fullscreen toggle + Escape key ─────────────────
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape" && isFullscreen) setIsFullscreen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isFullscreen]);

  // ── Draw bounding box ──────────────────────────────────
  const drawBox = useCallback((faces) => {
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    if (!canvas || !video) return;
    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!faces.length) return;

    const box = faces[0].boundingBox;
    const vw = canvas.width, vh = canvas.height;
    const pad = 0.05;
    const x = (box.xCenter - box.width  / 2 - pad * box.width)  * vw;
    const y = (box.yCenter - box.height / 2 - pad * box.height) * vh;
    const w = (box.width  + 2 * pad * box.width)  * vw;
    const h = (box.height + 2 * pad * box.height) * vh;
    const cs = 22;

    ctx.strokeStyle = "#10b981";
    ctx.lineWidth   = 3;
    ctx.shadowColor = "#10b981";
    ctx.shadowBlur  = 12;
    ctx.beginPath();
    ctx.moveTo(x + cs, y);         ctx.lineTo(x, y);         ctx.lineTo(x, y + cs);
    ctx.moveTo(x + w - cs, y);     ctx.lineTo(x + w, y);     ctx.lineTo(x + w, y + cs);
    ctx.moveTo(x, y + h - cs);     ctx.lineTo(x, y + h);     ctx.lineTo(x + cs, y + h);
    ctx.moveTo(x + w - cs, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - cs);
    ctx.stroke();
  }, []);

  // ── Capture & API ──────────────────────────────────────
  const tryCapture = useCallback(async (box) => {
    if (processingRef.current) return;
    if (statusRef.current !== "scanning") return;
    const now = Date.now();
    if (now - lastScanRef.current < SCAN_COOLDOWN_MS) return;

    const video = videoRef.current;
    const cap   = capCanvasRef.current;
    if (!video || !cap) return;

    const vw = video.videoWidth  || 640;
    const vh = video.videoHeight || 480;
    const pad = 0.28;

    let px = (box.xCenter - box.width  / 2 - pad * box.width)  * vw;
    let py = (box.yCenter - box.height / 2 - pad * box.height) * vh;
    let pw = (box.width  + 2 * pad * box.width)  * vw;
    let ph = (box.height + 2 * pad * box.height) * vh;
    px = Math.max(0, px); py = Math.max(0, py);
    pw = Math.min(pw, vw - px); ph = Math.min(ph, vh - py);

    cap.width  = Math.round(pw);
    cap.height = Math.round(ph);
    cap.getContext("2d").drawImage(video, px, py, pw, ph, 0, 0, cap.width, cap.height);
    const base64 = cap.toDataURL("image/jpeg", 0.92);

    processingRef.current = true;
    lastScanRef.current   = now;

    try {
      const res  = await adminAPI.gateAttendance({
        image_base64: base64,
        gate_id: gateId,
        camera_id: cameraId,
        entry_direction: direction,
      });
      const data = res.data?.data;

      if (data?.matched) {
        setSuccessData(data);
        setStatus("success");
        setStats(prev => ({
          total: prev.total + 1,
          unique: data.duplicate ? prev.unique : prev.unique + 1,
        }));
        // 3: only add to log if matched AND not duplicate
        if (!data.duplicate) {
          const entry = {
            ...data,
            time: new Date().toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" }),
            id: Date.now(),
          };
          setLog(prev => [entry, ...prev].slice(0, 6));  // max 6
        }
      } else {
        // 2: fail — sirf red border, koi log nahi
        setStatus("fail");
      }
    } catch {
      setStatus("fail");
    } finally {
      processingRef.current = false;
    }
  }, [gateId, cameraId, direction, setStatus]);

  // ── MediaPipe Init ─────────────────────────────────────
  useEffect(() => {
    let alive = true;

    async function boot() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
          audio: false,
        });
        if (!alive) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;

        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        if (!alive) return;

        const fd = new FaceDetection({
          locateFile: (file) => `/node_modules/@mediapipe/face_detection/${file}`,
        });
        fd.setOptions({ model: "short", minDetectionConfidence: 0.6 });

        fd.onResults((results) => {
          if (!alive) return;
          const faces = results.detections ?? [];
          drawBox(faces);
          if (faces.length === 1) tryCapture(faces[0].boundingBox);
        });

        detectorRef.current = fd;
        setStatus("scanning");

        const tick = async () => {
          if (!alive) return;
          if (video.readyState === 4) await fd.send({ image: video });
          loopRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch (err) {
        if (alive) { setCamError(err.message); setStatus("scanning"); }
      }
    }

    boot();
    return () => {
      alive = false;
      if (loopRef.current) cancelAnimationFrame(loopRef.current);
      try { detectorRef.current?.close(); } catch (_) {}
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, [drawBox, tryCapture, setStatus]);

  const handleOverlayDone = useCallback(() => {
    setStatus("scanning");
    setSuccessData(null);
  }, [setStatus]);

  const now     = new Date();
  const timeStr = now.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long" });

  // ── 4: Fullscreen wrapper — covers entire viewport incl sidebar/navbar
  const fullscreenClass = isFullscreen
    ? "fixed inset-0 z-[9999] bg-slate-950 flex flex-col"
    : "min-h-screen bg-slate-950 flex flex-col";

  return (
    <div className={fullscreenClass} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500/20 rounded-xl flex items-center justify-center">
            <ScanFace size={18} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">Gate AI Attendance</p>
            <p className="text-slate-400 text-xs">Gate #{gateId} • Camera #{cameraId} • {direction.toUpperCase()}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-white font-mono font-bold">{timeStr}</p>
            <p className="text-slate-400 text-xs">{dateStr}</p>
          </div>
          {/* 4: Fullscreen button */}
          <button
            onClick={() => setIsFullscreen(f => !f)}
            title={isFullscreen ? "Exit fullscreen (Esc)" : "Fullscreen mode"}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 gap-0 min-h-0">

        {/* Camera Section — 2: bada camera */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="relative w-full" style={{ maxWidth: isFullscreen ? "900px" : "700px" }}>

            {/* Camera Feed */}
            <div className="relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl"
                 style={{ aspectRatio: "4/3" }}>
              <video
                ref={videoRef}
                className="w-full h-full object-cover scale-x-[-1]"
                playsInline muted autoPlay
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
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    status === "scanning" ? "bg-emerald-400 animate-pulse" :
                    status === "success"  ? "bg-emerald-400" :
                    status === "fail"     ? "bg-red-400" :
                    "bg-amber-400 animate-pulse"
                  }`} />
                  <p className="text-white text-sm font-medium">
                    {status === "loading"  && "Camera load ho rahi hai..."}
                    {status === "scanning" && "Scanning — chehra frame mein rakhein"}
                    {status === "success"  && "✓ Attendance mark ho gayi!"}
                    {status === "fail"     && ""}
                  </p>
                </div>
              </div>

              {/* Overlays */}
              {status === "success" && successData && (
                <SuccessOverlay data={successData} onDone={handleOverlayDone} />
              )}
              {status === "fail" && <FailFlash onDone={handleOverlayDone} />}

              {/* Camera error */}
              {camError && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900 rounded-2xl">
                  <div className="text-center p-6">
                    <XCircle size={40} className="text-red-400 mx-auto mb-3" />
                    <p className="text-white font-semibold">Camera Error</p>
                    <p className="text-slate-400 text-xs mt-1">{camError}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3: Log Panel — max 6, only unique matched */}
        <div className="w-72 border-l border-slate-800 flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-slate-800 flex items-center gap-2">
            <Users size={15} className="text-slate-400" />
            <p className="text-slate-300 font-semibold text-sm">Recent Students</p>
            {log.length > 0 && (
              <span className="ml-auto bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full">
                {log.length}/6
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {log.length === 0 ? (
              <div className="text-center py-16">
                <ScanFace size={30} className="text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Koi scan nahi hua abhi tak</p>
                <p className="text-slate-600 text-xs mt-1">Students frame mein aayenge to yahan dikhe ga</p>
              </div>
            ) : (
              log.map(entry => <LogCard key={entry.id} entry={entry} />)
            )}
          </div>
        </div>

      </div>
    </div>
  );
}