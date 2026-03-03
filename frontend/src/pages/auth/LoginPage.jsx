import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  Camera,
  X,
  ScanFace,
} from "lucide-react";
import toast from "react-hot-toast";
import { FaceDetection } from "@mediapipe/face_detection";
import { authAPI } from "../../api/auth.api";
import { authStore } from "../../store/authStore";

// ─── Face Camera Modal ───────────────────────────────────
function FaceCameraModal({ onClose, onSuccess }) {
  const videoRef = useRef(null);
  const capCanvas = useRef(null);
  const overlayRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const loopRef = useRef(null);
  const timerRef = useRef(null);
  const capturedRef = useRef(false);

  const [status, setStatus] = useState("loading");
  const [countdown, setCountdown] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // ─── Cleanup ─────────────────────────────────────────
  const stopAll = useCallback(() => {
    if (loopRef.current) cancelAnimationFrame(loopRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current)
      streamRef.current.getTracks().forEach((t) => t.stop());
    try {
      detectorRef.current?.close();
    } catch (_) {}
  }, []);

  useEffect(() => () => stopAll(), [stopAll]);

  // ─── Init camera + MediaPipe ──────────────────────────
  useEffect(() => {
    let alive = true;

    async function boot() {
      try {
        // 1. Camera stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
          audio: false,
        });
        if (!alive) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();
        if (!alive) return;

        // 2. MediaPipe FaceDetection (npm se)
        const fd = new FaceDetection({
          locateFile: (file) =>
            `/node_modules/@mediapipe/face_detection/${file}`,
        });

        fd.setOptions({
          model: "short",
          minDetectionConfidence: 0.6,
        });

        fd.onResults((results) => {
          if (!alive || capturedRef.current) return;
          const faces = results.detections ?? [];
          drawBox(faces);

          if (faces.length === 1 && !capturedRef.current) {
            capturedRef.current = true;
            beginCountdown(faces[0].boundingBox);
          }
        });

        detectorRef.current = fd;

        // 3. Detection loop
        const loop = async () => {
          if (!alive || capturedRef.current) return;
          if (video.readyState >= 2) {
            try {
              await fd.send({ image: video });
            } catch (_) {}
          }
          loopRef.current = requestAnimationFrame(loop);
        };

        setStatus("ready");
        loop();
      } catch (err) {
        if (alive) {
          console.error(err);
          setErrorMsg(err.message || "Camera kholne mein masla hua");
          setStatus("error");
        }
      }
    }

    boot();
    return () => {
      alive = false;
      stopAll();
    };
  }, [stopAll]);

  // ─── Draw bounding box ───────────────────────────────
  const drawBox = (faces) => {
    const cv = overlayRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const W = cv.width,
      H = cv.height;
    ctx.clearRect(0, 0, W, H);
    if (faces.length !== 1) return;

    const b = faces[0].boundingBox;
    // Video CSS mein mirror hai (scaleX -1), canvas bhi same mirror
    const x = (1 - b.xCenter - b.width / 2) * W;
    const y = (b.yCenter - b.height / 2) * H;
    const w = b.width * W;
    const h = b.height * H;

    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 3;
    ctx.shadowColor = "#22c55e";
    ctx.shadowBlur = 14;
    ctx.strokeRect(x, y, w, h);
  };

  // ─── Countdown then capture ───────────────────────────
  const beginCountdown = (box) => {
    setStatus("detecting");
    let c = 3;
    setCountdown(c);
    timerRef.current = setInterval(() => {
      c--;
      if (c > 0) {
        setCountdown(c);
      } else {
        clearInterval(timerRef.current);
        setCountdown(null);
        doCapture(box);
      }
    }, 1000);
  };

  // ─── Crop face & send ────────────────────────────────
  const doCapture = async (box) => {
    setStatus("sending");
    try {
      const video = videoRef.current;
      const vw = video.videoWidth;
      const vh = video.videoHeight;

      const pad = 0.25;
      let px = (box.xCenter - box.width / 2 - pad * box.width) * vw;
      let py = (box.yCenter - box.height / 2 - pad * box.height) * vh;
      let pw = (box.width + 2 * pad * box.width) * vw;
      let ph = (box.height + 2 * pad * box.height) * vh;
      px = Math.max(0, px);
      py = Math.max(0, py);
      pw = Math.min(pw, vw - px);
      ph = Math.min(ph, vh - py);

      // Capture WITHOUT mirror — dlib ko real orientation chahiye
      const cv = capCanvas.current;
      cv.width = Math.round(pw);
      cv.height = Math.round(ph);
      cv.getContext("2d").drawImage(
        video,
        px,
        py,
        pw,
        ph,
        0,
        0,
        cv.width,
        cv.height,
      );
      const base64 = cv.toDataURL("image/jpeg", 0.92);

      stopAll();

      const res = await authAPI.faceLogin(base64);
      if (res.data.success) {
        onSuccess(res.data.data);
      } else {
        setErrorMsg(res.data.message || "Chehra pehchana nahi gaya");
        setStatus("error");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Login fail ho gaya");
      setStatus("error");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <ScanFace size={18} className="text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Face Login</p>
              <p className="text-white/40 text-xs">
                Camera ke samne apna chehra rakho
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopAll();
              onClose();
            }}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X size={18} className="text-white/60" />
          </button>
        </div>

        {/* Viewport */}
        <div className="relative bg-black" style={{ aspectRatio: "4/3" }}>
          {status === "loading" && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3">
              <Loader2 size={32} className="text-blue-400 animate-spin" />
              <p className="text-white/60 text-sm">Camera on ho raha hai...</p>
            </div>
          )}

          {status === "sending" && (
            <div className="absolute inset-0 z-10 bg-black/60 flex flex-col items-center justify-center gap-3">
              <Loader2 size={32} className="text-green-400 animate-spin" />
              <p className="text-white/70 text-sm">Verify ho raha hai...</p>
            </div>
          )}

          {status === "error" && (
            <div className="absolute inset-0 z-10 bg-black/80 flex flex-col items-center justify-center gap-4 p-6 text-center">
              <div className="w-14 h-14 bg-red-500/20 rounded-2xl flex items-center justify-center">
                <X size={24} className="text-red-400" />
              </div>
              <div>
                <p className="text-white font-semibold mb-1">Masla ho gaya</p>
                <p className="text-white/50 text-sm">{errorMsg}</p>
              </div>
              <button
                onClick={() => {
                  stopAll();
                  onClose();
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium"
              >
                Dobara Try Karo
              </button>
            </div>
          )}

          {/* Live video — mirrored */}
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            style={{ transform: "scaleX(-1)" }}
            playsInline
            muted
          />

          {/* Bounding box canvas — same mirror */}
          <canvas
            ref={overlayRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ transform: "scaleX(-1)" }}
            width={640}
            height={480}
          />

          {/* Hidden capture canvas — no mirror */}
          <canvas ref={capCanvas} className="hidden" />

          {/* Guide oval */}
          {(status === "ready" || status === "detecting") && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="border-2 border-dashed border-white/25 rounded-full"
                style={{ width: 190, height: 240 }}
              />
            </div>
          )}

          {/* Countdown ring */}
          {countdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
              <div className="w-20 h-20 rounded-full bg-black/60 border-4 border-green-400 flex items-center justify-center">
                <span className="text-4xl font-bold text-green-400">
                  {countdown}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="flex items-center gap-2.5 px-5 py-4 border-t border-white/10">
          {status === "loading" && (
            <>
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <p className="text-white/50 text-sm">
                Camera load ho raha hai...
              </p>
            </>
          )}
          {status === "ready" && (
            <>
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <p className="text-white/50 text-sm">
                Apna chehra oval ke andar rakho
              </p>
            </>
          )}
          {status === "detecting" && (
            <>
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <p className="text-green-400 text-sm font-medium">
                Detect hua!{" "}
                {countdown !== null ? `${countdown} mein capture...` : ""}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Login Page ─────────────────────────────────────
export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraKey, setCameraKey] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error("Email aur password required hain");
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.login(form.email, form.password);
      if (res.data.success) applyLogin(res.data.data, form.email);
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const applyLogin = (data, email = null) => {
    const {
      access_token,
      refresh_token,
      role,
      user_id,
      full_name,
      profile_picture_url,
    } = data;
    authStore.setAuth(access_token, refresh_token, {
      id: user_id,
      role,
      full_name,
      email: email || data.email,
      profile_picture_url,
    });
    
    window.dispatchEvent(new Event("profileUpdated"));

    toast.success(`Welcome, ${full_name}! 👋`);
    if (role === "admin") navigate("/admin/dashboard");
    else if (role === "teacher") navigate("/teacher/dashboard");
    else navigate("/student/dashboard");
  };

  const openCamera = () => {
    setCameraKey((k) => k + 1);
    setCameraOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-600/30">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">
            BZU Smart LMS
          </h1>
          <p className="text-white/40 text-sm mt-2">
            AI-Driven Learning Management System
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-display font-bold text-white mb-6">
            Sign In
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white/60 text-sm mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="your@bzu.edu.pk"
                className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                >
                  {showPass ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-white/30 text-xs">ya</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <button
              type="button"
              onClick={openCamera}
              className="w-full bg-white/5 hover:bg-green-500/10 border border-white/10 hover:border-green-500/40 text-white/70 hover:text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2.5 group"
            >
              <Camera className="w-5 h-5 text-green-400 group-hover:scale-110 transition-transform" />
              Face se Login Karo
            </button>
          </form>

          {/* Quick Login */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-white/30 text-xs text-center mb-3">
              Quick Login (Testing)
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  label: "Admin",
                  email: "admin@bzu.edu.pk",
                  pass: "Admin@123",
                  color:
                    "bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border-purple-500/20",
                },
                {
                  label: "Teacher",
                  email: "ms.ayesha@bzu.edu.pk",
                  pass: "Teacher@123",
                  color:
                    "bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border-emerald-500/20",
                },
                {
                  label: "Student",
                  email: "ali.hassan@student.bzu.edu.pk",
                  pass: "Student@123",
                  color:
                    "bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border-blue-500/20",
                },
              ].map(({ label, email, pass, color }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setForm({ email, password: pass })}
                  className={`${color} border text-xs font-medium py-2 rounded-lg transition-all`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          AI-Driven Smart LMS — Sarfraz RBSIT-21-13
        </p>
      </div>

      {cameraOpen && (
        <FaceCameraModal
          key={cameraKey}
          onClose={() => setCameraOpen(false)}
          onSuccess={(data) => {
            setCameraOpen(false);
            applyLogin(data);
          }}
        />
      )}
    </div>
  );
}
