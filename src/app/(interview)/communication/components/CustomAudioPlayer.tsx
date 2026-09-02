import { useRef, useState, useEffect} from 'react';
export default function CustomAudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  const [hasPlayed, setHasPlayed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const setupAnalyser = () => {
    if (!audioRef.current) return;

    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaElementSource(audioRef.current);
    const analyser = audioCtx.createAnalyser();

    analyser.fftSize = 256;

    source.connect(analyser);
    analyser.connect(audioCtx.destination);

    audioContextRef.current = audioCtx;
    analyserRef.current = analyser;
    dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
  };

  const drawWave = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;

    if (!canvas || !analyser || !dataArray) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    analyser.getByteFrequencyData(dataArray as Uint8Array<ArrayBuffer>);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = 4;
    const gap = 2;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
      const h = (dataArray[i] / 255) * canvas.height;
      ctx.fillStyle = '#f97316'; // orange
      ctx.fillRect(x, canvas.height - h, barWidth, h);
      x += barWidth + gap;
      if (x > canvas.width) break;
    }

    animationRef.current = requestAnimationFrame(drawWave);
  };

  const playAudio = async () => {
    if (!audioRef.current || hasPlayed) return;

    if (!audioContextRef.current) setupAnalyser();

    await audioRef.current.play();
    setIsPlaying(true);
    setHasPlayed(true);
    drawWave();
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const stop = () => {
      setIsPlaying(false);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      const ctx = canvasRef.current?.getContext('2d');
      ctx?.clearRect(0, 0, 300, 60);
    };

    audio.addEventListener('ended', stop);
    return () => audio.removeEventListener('ended', stop);
  }, []);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <audio ref={audioRef} src={src} preload="auto" />

      {/* Top Row */}
      <div className="flex items-center gap-4 mb-3">
        <button
          onClick={playAudio}
          disabled={hasPlayed}
          className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-colors ${
            hasPlayed
              ? 'bg-gray-100 cursor-not-allowed'
              : 'bg-[#2557a7] hover:bg-[#1e4a94]'
          }`}
          aria-label="Play audio"
        >
          <svg className={`w-5 h-5 ${hasPlayed ? 'text-gray-400' : 'text-white'}`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-700 truncate">
            Listen carefully – audio plays once
          </p>

          <div className="w-full h-1 bg-gray-100 rounded-full mt-2">
            {isPlaying && (
              <div className="h-1 bg-[#2557a7] rounded-full animate-pulse w-1/2" />
            )}
          </div>
        </div>
      </div>

      {/* Waveform */}
      <canvas
        ref={canvasRef}
        width={300}
        height={48}
        className="w-full"
      />
    </div>
  );
}
