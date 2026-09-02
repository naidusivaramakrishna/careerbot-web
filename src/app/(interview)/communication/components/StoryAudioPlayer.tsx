'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  src: string;
  onFirstPlay?: () => void;
}

export default function StoryAudioPlayer({ onFirstPlay }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number | null>(null);

  const [playedOnce, setPlayedOnce] = useState(false);
  const [progress, setProgress] = useState(0);

  const setupVisualizer = async () => {
    if (!audioRef.current || audioCtxRef.current) return;

    const AudioCtx =
      window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    const audioCtx = new AudioCtx();
    await audioCtx.resume();

    const source = audioCtx.createMediaElementSource(audioRef.current);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;

    source.connect(analyser);
    analyser.connect(audioCtx.destination);

    audioCtxRef.current = audioCtx;
    analyserRef.current = analyser;
  };

  useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 🔑 RESET TRANSFORM (CRITICAL)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}, []);



//   const drawWave = () => {
//     const canvas = canvasRef.current;
//     const analyser = analyserRef.current;
//     if (!canvas || !analyser) return;

//     const ctx = canvas.getContext('2d');
//     if (!ctx) return;

//     const bufferLength = analyser.frequencyBinCount;
//     const dataArray = new Uint8Array(bufferLength);

//     analyser.getByteTimeDomainData(dataArray);
//     ctx.clearRect(0, 0, canvas.width, canvas.height);

//     const centerY = canvas.height / 2;
//     const barWidth = 3;
//     const gap = 2;
//     let x = 0;

//     ctx.fillStyle = '#f97316';

//     for (let i = 0; i < bufferLength; i++) {
//       const v = dataArray[i] / 128.0;
//       const barHeight = Math.abs((v - 1) * centerY);

//       ctx.fillRect(
//         x,
//         centerY - barHeight,
//         barWidth,
//         barHeight * 2
//       );

//       x += barWidth + gap;
//       if (x > canvas.width) break;
//     }

//     animationRef.current = requestAnimationFrame(drawWave);
//   };
//   const drawWave = () => {
//   const canvas = canvasRef.current;
//   const analyser = analyserRef.current;
//   if (!canvas || !analyser) return;

//   const ctx = canvas.getContext('2d');
//   if (!ctx) return;

//   const dataArray = new Uint8Array(analyser.frequencyBinCount);
//   analyser.getByteTimeDomainData(dataArray);

//   ctx.clearRect(0, 0, canvas.width, canvas.height);

//   const height = canvas.height;
//   const width = canvas.width;
//   const centerY = height / 2;

//   // 🎯 VISUAL TUNING (matches reference)
//   const bars = 36;               // number of bars
//   const barWidth = 4;
//   const gap = 3;
//   const waveWidth = bars * (barWidth + gap);
//   let x = (width - waveWidth) / 2;

//   ctx.fillStyle = '#f97316';

//   for (let i = 0; i < bars; i++) {
//     // 🔊 sample spread across buffer
//     const index = Math.floor((i / bars) * dataArray.length);
//     const v = dataArray[index] / 128.0;
//     const amplitude = Math.abs(v - 1);

//     // 🔥 smooth + clamp
//     const barHeight = Math.min(amplitude * centerY * 1.4, centerY);

//     // 🟠 rounded bars (KEY DIFFERENCE)
//     ctx.beginPath();
//     ctx.roundRect(
//       x,
//       centerY - barHeight,
//       barWidth,
//       barHeight * 2,
//       2
//     );
//     ctx.fill();

//     x += barWidth + gap;
//   }

//   animationRef.current = requestAnimationFrame(drawWave);
// };

  const drawWave = () => {
  const canvas = canvasRef.current;
  const analyser = analyserRef.current;
  if (!canvas || !analyser) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const rect = canvas.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;

  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteTimeDomainData(dataArray);

  // ✅ CLEAR IN CSS SPACE
  ctx.clearRect(0, 0, width, height);

  const centerY = height / 2;

  // 🎯 MATCHES REFERENCE IMAGE
  const bars = 36;
  const barWidth = 4;
  const gap = 3;
  const waveWidth = bars * (barWidth + gap);

  let x = (width - waveWidth) / 2;

  ctx.fillStyle = '#f97316';

  for (let i = 0; i < bars; i++) {
    const index = Math.floor((i / bars) * dataArray.length);
    const v = dataArray[index] / 128.0;
    const amplitude = Math.abs(v - 1);

    // 🔥 smoother & stronger amplitude
    const barHeight = Math.min(amplitude * centerY * 1.6, centerY);

    ctx.beginPath();
    ctx.roundRect(
      x,
      centerY - barHeight,
      barWidth,
      barHeight * 2,
      3 // more rounded = cleaner
    );
    ctx.fill();

    x += barWidth + gap;
  }

  animationRef.current = requestAnimationFrame(drawWave);
};

  const play = async () => {
    if (!audioRef.current || playedOnce) return;

    await setupVisualizer();
    await audioRef.current.play();

    setPlayedOnce(true);
    onFirstPlay?.();
    drawWave();
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      if (!audio.duration) return;
      setProgress(audio.currentTime / audio.duration);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', () => setProgress(1));

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
    };
  }, []);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <audio ref={audioRef} preload="auto">
        <source src="/at-the-coffee-shop.mp3" type="audio/mpeg" />
      </audio>

      <div className="flex items-center gap-4 mb-3">
        <button
          onClick={play}
          disabled={playedOnce}
          className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-colors ${
            playedOnce
              ? 'bg-gray-100 cursor-not-allowed'
              : 'bg-[#2557a7] hover:bg-[#1e4a94]'
          }`}
          aria-label="Play audio"
        >
          <svg className={`w-5 h-5 ${playedOnce ? 'text-gray-400' : 'text-white'}`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-700 truncate">
            Listen carefully – audio plays once
          </p>

          <div className="w-full h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
            <div
              className="h-1 bg-[#2557a7] rounded-full transition-[width] duration-150 ease-linear"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} width={300} height={48} className="w-full" />
    </div>
  );
}
