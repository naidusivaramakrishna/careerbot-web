/**
 * AudioWorklet processor for real-time PCM capture.
 * Used by the Live AI Interview WebSocket stream.
 *
 * Audio format: PCM 16-bit, 16000 Hz, mono
 * (Required by Azure Speech Services STT streaming API)
 *
 * Usage (in useLiveInterview.ts):
 *   const context = new AudioContext({ sampleRate: 16000 });
 *   await context.audioWorklet.addModule('/audio-processor.js');
 *   const processor = new AudioWorkletNode(context, 'audio-processor');
 *   processor.port.onmessage = (e) => {
 *     if (e.data.type === 'chunk') sendAudioChunk(e.data.pcm);
 *   };
 */
class AudioProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const float32 = input[0]; // Float32Array, range -1.0 to 1.0
    const pcm16 = new Int16Array(float32.length);

    for (let i = 0; i < float32.length; i++) {
      // Clamp and convert Float32 → Int16
      const clamped = Math.max(-1, Math.min(1, float32[i]));
      pcm16[i] = clamped < 0 ? clamped * 32768 : clamped * 32767;
    }

    // Transfer buffer to main thread (zero-copy)
    this.port.postMessage({ type: 'chunk', pcm: pcm16.buffer }, [pcm16.buffer]);

    return true; // Keep processor alive
  }
}

registerProcessor('audio-processor', AudioProcessor);
