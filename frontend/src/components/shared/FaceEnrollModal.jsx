import { useState, useRef, useEffect, useCallback } from 'react'
import { X, ScanFace, Loader2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { FaceDetection } from '@mediapipe/face_detection'
import { authAPI } from '../../api/auth.api'

export default function FaceEnrollModal({ onClose, onEnrolled }) {
  const videoRef    = useRef(null);
  const capCanvas   = useRef(null);
  const overlayRef  = useRef(null);
  const streamRef   = useRef(null);
  const detectorRef = useRef(null);
  const loopRef     = useRef(null);
  const timerRef    = useRef(null);
  const capturedRef = useRef(false);

  const [status, setStatus]       = useState('loading');
  const [countdown, setCountdown] = useState(null);
  const [errorMsg, setErrorMsg]   = useState('');

  const stopAll = useCallback(() => {
    if (loopRef.current)   cancelAnimationFrame(loopRef.current);
    if (timerRef.current)  clearInterval(timerRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    try { detectorRef.current?.close(); } catch (_) {}
  }, []);

  useEffect(() => () => stopAll(), [stopAll]);

  useEffect(() => {
    let alive = true;

    async function boot() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' }, audio: false,
        });
        if (!alive) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;

        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();
        if (!alive) return;

        const fd = new FaceDetection({
          locateFile: (file) =>
            `/node_modules/@mediapipe/face_detection/${file}`,
        });
        fd.setOptions({ model: 'short', minDetectionConfidence: 0.6 });

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

        const loop = async () => {
          if (!alive || capturedRef.current) return;
          if (video.readyState >= 2) {
            try { await fd.send({ image: video }); } catch (_) {}
          }
          loopRef.current = requestAnimationFrame(loop);
        };

        setStatus('ready');
        loop();

      } catch (err) {
        if (alive) {
          setErrorMsg(err.message || 'Camera access nahi mila');
          setStatus('error');
        }
      }
    }

    boot();
    return () => { alive = false; stopAll(); };
  }, [stopAll]);

  const drawBox = (faces) => {
    const cv = overlayRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);
    if (faces.length !== 1) return;
    const b = faces[0].boundingBox;
    const x = (1 - b.xCenter - b.width / 2) * W;
    const y = (b.yCenter - b.height / 2) * H;
    const w = b.width * W;
    const h = b.height * H;
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#3b82f6';
    ctx.shadowBlur = 14;
    ctx.strokeRect(x, y, w, h);
  };

  const beginCountdown = (box) => {
    setStatus('detecting');
    let c = 3;
    setCountdown(c);
    timerRef.current = setInterval(() => {
      c--;
      if (c > 0) { setCountdown(c); }
      else { clearInterval(timerRef.current); setCountdown(null); doCapture(box); }
    }, 1000);
  };

  const doCapture = async (box) => {
    setStatus('sending');
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
      cv.getContext('2d').drawImage(video, px, py, pw, ph, 0, 0, cv.width, cv.height);
      const base64 = cv.toDataURL('image/jpeg', 0.92);

      stopAll();

      const res = await authAPI.enrollFace(base64);
      if (res.data.success) {
        setStatus('done');
        toast.success('Face enroll ho gaya! ✅');
        setTimeout(() => { onEnrolled?.(); onClose(); }, 1500);
      } else {
        setErrorMsg(res.data.message || 'Enrollment fail ho gaya');
        setStatus('error');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Enrollment fail ho gaya');
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">

        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
              <ScanFace size={18} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Face Enroll Karo</h3>
              <p className="text-slate-400 text-xs">Oval ke andar apna chehra seedha rakho</p>
            </div>
          </div>
          <button onClick={() => { stopAll(); onClose(); }} className="p-2 hover:bg-slate-100 rounded-xl">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="relative bg-slate-900" style={{ aspectRatio: '4/3' }}>

          {status === 'loading' && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2">
              <Loader2 size={28} className="text-blue-400 animate-spin" />
              <p className="text-white/50 text-sm">Camera load ho raha hai...</p>
            </div>
          )}
          {status === 'sending' && (
            <div className="absolute inset-0 z-10 bg-black/60 flex flex-col items-center justify-center gap-2">
              <Loader2 size={28} className="text-blue-400 animate-spin" />
              <p className="text-white/70 text-sm">Save ho raha hai...</p>
            </div>
          )}
          {status === 'done' && (
            <div className="absolute inset-0 z-10 bg-black/70 flex flex-col items-center justify-center gap-3">
              <CheckCircle size={40} className="text-green-400" />
              <p className="text-white font-semibold">Face Enrolled!</p>
            </div>
          )}
          {status === 'error' && (
            <div className="absolute inset-0 z-10 bg-black/80 flex flex-col items-center justify-center gap-4 p-6 text-center">
              <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center">
                <X size={20} className="text-red-400" />
              </div>
              <p className="text-white text-sm">{errorMsg}</p>
              <button onClick={() => { stopAll(); onClose(); }}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm">
                Band Karo
              </button>
            </div>
          )}

          <video ref={videoRef} className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }} playsInline muted />

          <canvas ref={overlayRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ transform: 'scaleX(-1)' }}
            width={640} height={480} />

          <canvas ref={capCanvas} className="hidden" />

          {(status === 'ready' || status === 'detecting') && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-2 border-dashed border-white/25 rounded-full"
                style={{ width: 190, height: 240 }} />
            </div>
          )}

          {countdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
              <div className="w-16 h-16 rounded-full bg-black/60 border-4 border-blue-400 flex items-center justify-center">
                <span className="text-3xl font-bold text-blue-400">{countdown}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5 px-5 py-4 bg-slate-50">
          {status === 'loading'   && <><span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" /><p className="text-slate-500 text-sm">Load ho raha hai...</p></>}
          {status === 'ready'     && <><span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" /><p className="text-slate-500 text-sm">Chehra oval ke andar bilkul seedha rakho</p></>}
          {status === 'detecting' && <><span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /><p className="text-blue-600 text-sm font-medium">Detect hua! {countdown !== null ? `${countdown} mein capture...` : ''}</p></>}
        </div>
      </div>
    </div>
  );
}