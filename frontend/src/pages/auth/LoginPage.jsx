// ═══════════════════════════════════════════════════════════════
//  LoginPage.jsx  —  Neumorphic 3D Premium Login
//  Replace:  frontend/src/pages/auth/LoginPage.jsx
//  (Saara original logic preserved — sirf UI premium hua)
// ═══════════════════════════════════════════════════════════════

import { useState, useRef, useEffect, useCallback, useId } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye, EyeOff, Loader2, Camera, X, ScanFace,
  GraduationCap, Mail, Lock, Zap, ShieldCheck, BookOpen, GraduationCap as StudentIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { FaceDetection } from "@mediapipe/face_detection";
import { authAPI } from "../../api/auth.api";
import { authStore } from "../../store/authStore";
import { useTheme } from "../../context/ThemeContext";

// ─────────────────────────────────────────────────────────────
//  Face Camera Modal — original logic, neumorphic UI
// ─────────────────────────────────────────────────────────────
function FaceCameraModal({ onClose, onSuccess }) {
  const videoRef    = useRef(null);
  const capCanvas   = useRef(null);
  const overlayRef  = useRef(null);
  const streamRef   = useRef(null);
  const detectorRef = useRef(null);
  const loopRef     = useRef(null);
  const timerRef    = useRef(null);
  const capturedRef = useRef(false);

  const [status,    setStatus]    = useState("loading");
  const [countdown, setCountdown] = useState(null);
  const [errorMsg,  setErrorMsg]  = useState("");

  const stopAll = useCallback(() => {
    if (loopRef.current)  cancelAnimationFrame(loopRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    try { detectorRef.current?.close(); } catch (_) {}
  }, []);

  useEffect(() => () => stopAll(), [stopAll]);

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
        video.srcObject = stream;
        await video.play();
        if (!alive) return;

        const fd = new FaceDetection({
          locateFile: file => `/node_modules/@mediapipe/face_detection/${file}`,
        });
        fd.setOptions({ model: "short", minDetectionConfidence: 0.6 });
        fd.onResults(results => {
          if (!alive || capturedRef.current) return;
          const faces = results.detections ?? [];
          drawBox(faces);
          if (faces.length === 1 && !capturedRef.current) {
            capturedRef.current = true;
            beginCountdown(faces[0].boundingBox);
          }
        });
        detectorRef.current = fd;

        const loop = async () => {
          if (!alive || capturedRef.current) return;
          if (video.readyState >= 2) { try { await fd.send({ image: video }); } catch (_) {} }
          loopRef.current = requestAnimationFrame(loop);
        };
        setStatus("ready");
        loop();
      } catch (err) {
        if (alive) { setErrorMsg(err.message || "Camera error"); setStatus("error"); }
      }
    }
    boot();
    return () => { alive = false; stopAll(); };
  }, [stopAll]);

  const drawBox = (faces) => {
    const cv = overlayRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (faces.length !== 1) return;
    const b = faces[0].boundingBox;
    const x = (1 - b.xCenter - b.width / 2) * cv.width;
    const y = (b.yCenter - b.height / 2) * cv.height;
    ctx.strokeStyle = "var(--neu-success)";
    ctx.lineWidth = 3;
    ctx.shadowColor = "var(--neu-success)";
    ctx.shadowBlur = 14;
    ctx.strokeRect(x, y, b.width * cv.width, b.height * cv.height);
  };

  const beginCountdown = (box) => {
    setStatus("detecting");
    let c = 3;
    setCountdown(c);
    timerRef.current = setInterval(() => {
      c--;
      if (c > 0) { setCountdown(c); }
      else { clearInterval(timerRef.current); setCountdown(null); doCapture(box); }
    }, 1000);
  };

  const doCapture = async (box) => {
    setStatus("sending");
    try {
      const video = videoRef.current;
      const vw = video.videoWidth, vh = video.videoHeight;
      const pad = 0.25;
      let px = (box.xCenter - box.width / 2 - pad * box.width) * vw;
      let py = (box.yCenter - box.height / 2 - pad * box.height) * vh;
      let pw = (box.width + 2 * pad * box.width) * vw;
      let ph = (box.height + 2 * pad * box.height) * vh;
      px = Math.max(0, px); py = Math.max(0, py);
      pw = Math.min(pw, vw - px); ph = Math.min(ph, vh - py);
      const cv = capCanvas.current;
      cv.width = Math.round(pw); cv.height = Math.round(ph);
      cv.getContext("2d").drawImage(video, px, py, pw, ph, 0, 0, cv.width, cv.height);
      const base64 = cv.toDataURL("image/jpeg", 0.92);
      stopAll();
      const res = await authAPI.faceLogin(base64);
      if (res.data.success) { onSuccess(res.data.data); }
      else { setErrorMsg(res.data.message || "Chehra pehchana nahi gaya"); setStatus("error"); }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Login fail ho gaya");
      setStatus("error");
    }
  };

  // ── Modal UI ──────────────────────────────────────────
  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(8,12,20,0.82)",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1rem",
    }}>
      <div className="neu-card-lg neu-animate-slide-up" style={{ width: "100%", maxWidth: "440px", overflow: "hidden" }}>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid var(--neu-border-inner)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: "2.5rem", height: "2.5rem", borderRadius: "0.875rem",
              background: "linear-gradient(145deg,rgba(62,207,142,0.2),rgba(62,207,142,0.08))",
              boxShadow: "var(--neu-raised)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ScanFace size={18} style={{ color: "var(--neu-success)" }} />
            </div>
            <div>
              <p className="neu-heading" style={{ fontSize: "0.95rem" }}>Face Login</p>
              <p className="neu-subtext" style={{ fontSize: "0.75rem" }}>Camera ke samne apna chehra rakho</p>
            </div>
          </div>
          <button
            onClick={() => { stopAll(); onClose(); }}
            className="neu-btn-icon"
          >
            <X size={16} />
          </button>
        </div>

        {/* Camera area */}
        <div style={{ position: "relative", aspectRatio: "4/3", background: "#0a0e16", overflow: "hidden" }}>
          <video
            ref={videoRef}
            style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
            muted playsInline
          />
          <canvas
            ref={overlayRef}
            width={640} height={480}
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              pointerEvents: "none", transform: "scaleX(-1)",
            }}
          />
          <canvas ref={capCanvas} style={{ display: "none" }} />

          {/* Guide oval */}
          {(status === "ready" || status === "detecting") && (
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              pointerEvents: "none",
            }}>
              <div style={{
                width: 190, height: 240,
                border: "2px dashed rgba(255,255,255,0.2)",
                borderRadius: "50%",
              }} />
            </div>
          )}

          {/* Countdown ring */}
          {countdown !== null && (
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 20, pointerEvents: "none",
            }}>
              <div style={{
                width: "5rem", height: "5rem", borderRadius: "50%",
                background: "rgba(0,0,0,0.65)",
                border: "4px solid var(--neu-success)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 30px rgba(62,207,142,0.5)",
              }}>
                <span style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--neu-success)", fontFamily: "'Outfit',sans-serif" }}>
                  {countdown}
                </span>
              </div>
            </div>
          )}

          {/* Sending overlay */}
          {status === "sending" && (
            <div style={{
              position: "absolute", inset: 0,
              background: "rgba(0,0,0,0.6)",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: "0.75rem",
            }}>
              <Loader2 size={36} style={{ color: "var(--neu-accent)", animation: "spin 1s linear infinite" }} />
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.875rem" }}>Verify ho raha hai...</p>
            </div>
          )}
        </div>

        {/* Status bar */}
        <div style={{
          display: "flex", alignItems: "center", gap: "0.6rem",
          padding: "1rem 1.5rem",
          borderTop: "1px solid var(--neu-border-inner)",
        }}>
          {status === "loading" && (<>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--neu-warning)", animation: "pulse 1.5s infinite" }} />
            <p className="neu-subtext">Camera load ho raha hai...</p>
          </>)}
          {status === "ready" && (<>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--neu-warning)", animation: "pulse 1.5s infinite" }} />
            <p className="neu-subtext">Apna chehra oval ke andar rakho</p>
          </>)}
          {status === "detecting" && (<>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--neu-success)", animation: "pulse 1.5s infinite" }} />
            <p style={{ color: "var(--neu-success)", fontSize: "0.875rem", fontWeight: 500 }}>
              Detect hua! {countdown !== null ? `${countdown} mein capture...` : ""}
            </p>
          </>)}
          {status === "error" && (<>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--neu-danger)" }} />
            <p style={{ color: "var(--neu-danger)", fontSize: "0.875rem" }}>{errorMsg}</p>
          </>)}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Floating background orbs
// ─────────────────────────────────────────────────────────────
function BackgroundOrbs() {
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {/* Big top-left orb */}
      <div style={{
        position: "absolute", top: "-15%", left: "-10%",
        width: "55vw", height: "55vw",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(91,138,240,0.12) 0%, transparent 70%)",
        animation: "neu-float 7s ease-in-out infinite",
      }} />
      {/* Bottom-right orb */}
      <div style={{
        position: "absolute", bottom: "-20%", right: "-10%",
        width: "50vw", height: "50vw",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(62,207,142,0.09) 0%, transparent 70%)",
        animation: "neu-float 9s ease-in-out infinite reverse",
      }} />
      {/* Center small orb */}
      <div style={{
        position: "absolute", top: "40%", left: "55%",
        width: "20vw", height: "20vw",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(245,166,35,0.06) 0%, transparent 70%)",
        animation: "neu-float 5s ease-in-out infinite",
        animationDelay: "1.5s",
      }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Theme Toggle Button
// ─────────────────────────────────────────────────────────────
function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="neu-btn-icon neu-animate-fade-in"
      style={{
        position: "fixed", top: "1.25rem", right: "1.25rem",
        zIndex: 50,
        width: "2.75rem", height: "2.75rem",
        fontSize: "1.1rem",
      }}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
//  Main Login Page
// ─────────────────────────────────────────────────────────────
export default function LoginPage() {
  const navigate    = useNavigate();
  const [form,       setForm]       = useState({ email: "", password: "" });
  const [showPass,   setShowPass]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraKey,  setCameraKey]  = useState(0);

  const openCamera = () => {
    setCameraKey(k => k + 1);
    setCameraOpen(true);
  };

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
    const { access_token, refresh_token, role, user_id, full_name, profile_picture_url } = data;
    authStore.setAuth(access_token, refresh_token, {
      id: user_id, role, full_name,
      email: email || data.email,
      profile_picture_url,
    });
    window.dispatchEvent(new Event("profileUpdated"));
    toast.success(`Welcome, ${full_name}!`);
    if (role === "admin")   navigate("/admin/dashboard");
    else if (role === "teacher") navigate("/teacher/dashboard");
    else                    navigate("/student/dashboard");
  };

  // Quick login presets
  const quickLogins = [
    { label: "Admin",   icon: ShieldCheck,    email: "admin@bzu.edu.pk",              pass: "Admin@123",   color: "rgba(155,89,182,0.15)",  border: "rgba(155,89,182,0.3)",  text: "#9b59b6" },
    { label: "Teacher", icon: BookOpen,        email: "ms.ayesha@bzu.edu.pk",          pass: "Teacher@123", color: "rgba(62,207,142,0.12)",  border: "rgba(62,207,142,0.3)",  text: "#22a06b" },
    { label: "Student", icon: GraduationCap,   email: "ali.hassan@student.bzu.edu.pk", pass: "Student@123", color: "rgba(91,138,240,0.12)",  border: "rgba(91,138,240,0.3)",  text: "#5b8af0" },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--neu-bg)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1.5rem",
      position: "relative",
      transition: "background 0.35s ease",
    }}>

      <BackgroundOrbs />
      <ThemeToggle />

      {/* ── Main Card ───────────────────────────── */}
      <div
        className="neu-card-lg neu-stagger"
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "2.5rem 2.25rem",
          position: "relative",
          zIndex: 1,
        }}
      >

        {/* ── Logo / Brand ── */}
        <div className="neu-animate-slide-up" style={{
          display: "flex", flexDirection: "column",
          alignItems: "center", textAlign: "center",
          marginBottom: "2rem",
          animationDelay: "0.05s",
        }}>
          {/* Avatar orb */}
          <div style={{
            width: "5.5rem", height: "5.5rem",
            borderRadius: "50%",
            background: "linear-gradient(145deg, var(--neu-surface), var(--neu-surface-deep))",
            boxShadow: "var(--neu-raised-lg)",
            border: "2px solid var(--neu-border)",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: "1.25rem",
            position: "relative",
            transformStyle: "preserve-3d",
          }}>
            {/* Inner glow ring */}
            <div style={{
              position: "absolute", inset: "6px", borderRadius: "50%",
              background: "linear-gradient(135deg, var(--neu-accent), rgba(62,207,142,0.6))",
              opacity: 0.15,
            }} />
            <GraduationCap size={32} style={{ color: "var(--neu-accent)", position: "relative", zIndex: 1 }} />
          </div>

          <h1 className="neu-heading" style={{ fontSize: "1.6rem", marginBottom: "0.3rem" }}>
            Smart LMS
          </h1>
          <p className="neu-subtext" style={{ fontSize: "0.82rem" }}>
            BZU Multan — AI-Driven Learning System
          </p>
        </div>

        {/* ── Divider ── */}
        <div className="neu-divider neu-animate-slide-up" style={{ animationDelay: "0.1s" }} />

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1.5rem" }}>

          {/* Email field */}
          <div className="neu-animate-slide-up" style={{ animationDelay: "0.12s", position: "relative" }}>
            <div style={{
              position: "absolute", left: "1.1rem", top: "50%",
              transform: "translateY(-50%)",
              color: "var(--neu-text-ghost)",
              pointerEvents: "none", zIndex: 1,
              display: "flex",
            }}>
              <Mail size={16} />
            </div>
            <input
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="neu-input"
              style={{ paddingLeft: "2.75rem" }}
              autoComplete="email"
            />
          </div>

          {/* Password field */}
          <div className="neu-animate-slide-up" style={{ animationDelay: "0.16s", position: "relative" }}>
            <div style={{
              position: "absolute", left: "1.1rem", top: "50%",
              transform: "translateY(-50%)",
              color: "var(--neu-text-ghost)",
              pointerEvents: "none", zIndex: 1,
              display: "flex",
            }}>
              <Lock size={16} />
            </div>
            <input
              type={showPass ? "text" : "password"}
              placeholder="Password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="neu-input"
              style={{ paddingLeft: "2.75rem", paddingRight: "3rem" }}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPass(p => !p)}
              style={{
                position: "absolute", right: "1rem", top: "50%",
                transform: "translateY(-50%)",
                color: "var(--neu-text-ghost)",
                background: "none", border: "none", cursor: "pointer",
                display: "flex", padding: "4px",
                transition: "color 0.18s",
              }}
              onMouseEnter={e => e.currentTarget.style.color = "var(--neu-accent)"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--neu-text-ghost)"}
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Sign In button */}
          <button
            type="submit"
            disabled={loading}
            className="neu-btn neu-btn-accent neu-animate-slide-up"
            style={{
              width: "100%",
              padding: "1rem",
              fontSize: "0.95rem",
              fontWeight: 700,
              letterSpacing: "0.02em",
              marginTop: "0.25rem",
              animationDelay: "0.2s",
              opacity: loading ? 0.75 : 1,
            }}
          >
            {loading
              ? <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}>
                  <Loader2 size={17} style={{ animation: "spin 1s linear infinite" }} />
                  Signing in...
                </span>
              : <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}>
                  <Zap size={16} /> Sign In
                </span>
            }
          </button>

          {/* OR divider */}
          <div className="neu-animate-slide-up" style={{
            display: "flex", alignItems: "center", gap: "0.75rem",
            animationDelay: "0.22s",
          }}>
            <div style={{ flex: 1, height: "1px", background: "var(--neu-border-inner)" }} />
            <span style={{ color: "var(--neu-text-ghost)", fontSize: "0.75rem" }}>ya</span>
            <div style={{ flex: 1, height: "1px", background: "var(--neu-border-inner)" }} />
          </div>

          {/* Face Login button — physical press, icon only */}
          <div className="neu-animate-slide-up" style={{ display: "flex", justifyContent: "center", animationDelay: "0.24s" }}>
            <div className="neu-tooltip-wrap" style={{ position: "relative" }}>
              <button
                type="button"
                onClick={openCamera}
                className="neu-press-btn"
                style={{ width: "52px", height: "52px", color: "var(--neu-success)" }}
              >
                <Camera size={20} />
              </button>
              <span className="neu-tooltip-label" style={{
                position: "absolute",
                bottom: "calc(100% + 10px)",
                left: "50%",
                transform: "translateX(-50%)",
                background: "var(--neu-surface)",
                boxShadow: "0 5px 0 #b0bed2, 0 8px 12px -6px rgba(0,0,0,0.18), inset 0 1px 2px white",
                border: "1px solid rgba(255,255,255,0.7)",
                color: "var(--neu-text-secondary)",
                fontSize: "0.7rem",
                fontWeight: 600,
                padding: "0.3rem 0.7rem",
                borderRadius: "0.5rem",
                whiteSpace: "nowrap",
                pointerEvents: "none",
                opacity: 0,
                transition: "opacity 0.15s ease, transform 0.15s ease",
                letterSpacing: "0.03em",
                zIndex: 10,
              }}>
                Face Login
              </span>
            </div>
          </div>
        </form>

        {/* ── Quick Login (Testing) ── */}
        <div className="neu-animate-slide-up" style={{ marginTop: "1.75rem", animationDelay: "0.28s" }}>
          <div className="neu-divider" />
          <p style={{
            color: "var(--neu-text-ghost)",
            fontSize: "0.7rem",
            textAlign: "center",
            marginBottom: "0.85rem",
            letterSpacing: "0.07em",
            textTransform: "uppercase",
          }}>
            Quick Login
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
            {quickLogins.map(({ label, icon: Icon, email, pass, text }) => (
              <div key={label} className="neu-tooltip-wrap" style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setForm({ email, password: pass })}
                  className="neu-press-btn"
                  style={{ width: "52px", height: "52px", color: text }}
                >
                  <Icon size={19} />
                </button>
                {/* Tooltip */}
                <span className="neu-tooltip-label" style={{
                  position: "absolute",
                  bottom: "calc(100% + 10px)",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "var(--neu-surface)",
                  boxShadow: "0 5px 0 #b0bed2, 0 8px 12px -6px rgba(0,0,0,0.18), inset 0 1px 2px white",
                  border: "1px solid rgba(255,255,255,0.7)",
                  color: text,
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  padding: "0.3rem 0.7rem",
                  borderRadius: "0.5rem",
                  whiteSpace: "nowrap",
                  pointerEvents: "none",
                  opacity: 0,
                  transition: "opacity 0.15s ease, transform 0.15s ease",
                  letterSpacing: "0.04em",
                  zIndex: 10,
                }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer text */}
        <p className="neu-animate-fade-in" style={{
          textAlign: "center",
          color: "var(--neu-text-ghost)",
          fontSize: "0.7rem",
          marginTop: "1.5rem",
          animationDelay: "0.5s",
        }}>
          AI-Driven Smart LMS — Sarfraz RBSIT-21-13
        </p>

      </div>

      {/* ── Face Camera Modal ── */}
      {cameraOpen && (
        <FaceCameraModal
          key={cameraKey}
          onClose={() => setCameraOpen(false)}
          onSuccess={(data) => { setCameraOpen(false); applyLogin(data); }}
        />
      )}
    </div>
  );
}