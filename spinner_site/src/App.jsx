import { useEffect, useMemo, useRef, useState } from 'react';

const OPTIONS = [
  { label: 'Loot restriction', color: '#ffb84d' },
  { label: 'Crawling', color: '#5ed3b7' },
  { label: 'Map edge', color: '#7aa6ff' },
  { label: 'Weapon downgrade', color: '#f6d34a' },
];

const SPIN_DURATION = 5200;

function buildSegments() {
  const segmentSize = 360 / OPTIONS.length;

  return OPTIONS.map((option, index) => {
    const start = index * segmentSize;
    const end = start + segmentSize;
    return `${option.color} ${start}deg ${end}deg`;
  }).join(', ');
}

function createConfetti() {
  return Array.from({ length: 26 }, (_, index) => ({
    id: `${Date.now()}-${index}`,
    left: Math.random() * 100,
    delay: Math.random() * 0.35,
    duration: 1.8 + Math.random() * 1.4,
    rotate: Math.random() * 360,
    size: 8 + Math.random() * 8,
    color: OPTIONS[index % OPTIONS.length].color,
    drift: -40 + Math.random() * 80,
  }));
}

export default function App() {
  const wheelBackground = useMemo(buildSegments, []);
  const audioContextRef = useRef(null);
  const flickerIntervalRef = useRef(null);
  const landingTimeoutRef = useRef(null);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState('Spin the wheel');
  const [confetti, setConfetti] = useState([]);
  const [impactActive, setImpactActive] = useState(false);
  const [flickerActive, setFlickerActive] = useState(false);

  useEffect(() => {
    if (confetti.length === 0) {
      return undefined;
    }

    const timer = window.setTimeout(() => setConfetti([]), 2600);
    return () => window.clearTimeout(timer);
  }, [confetti]);

  useEffect(() => () => {
    if (flickerIntervalRef.current) {
      window.clearInterval(flickerIntervalRef.current);
    }

    if (landingTimeoutRef.current) {
      window.clearTimeout(landingTimeoutRef.current);
    }
  }, []);

  const getAudioContext = () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;

    if (!AudioContext) {
      return null;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    return audioContextRef.current;
  };

  const playBurst = ({ baseFrequency, peakFrequency, duration, type, gainLevel }) => {
    const context = getAudioContext();

    if (!context) {
      return;
    }

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    const filter = context.createBiquadFilter();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(baseFrequency, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(peakFrequency, context.currentTime + duration * 0.7);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(Math.max(220, baseFrequency * 1.8), context.currentTime);
    filter.Q.value = 4;

    gainNode.gain.setValueAtTime(0.0001, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(gainLevel, context.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + duration + 0.02);
  };

  const startFlickerSound = () => {
    if (flickerIntervalRef.current) {
      window.clearInterval(flickerIntervalRef.current);
    }

    setFlickerActive(true);

    playBurst({
      baseFrequency: 240,
      peakFrequency: 520,
      duration: 0.08,
      type: 'square',
      gainLevel: 0.12,
    });

    flickerIntervalRef.current = window.setInterval(() => {
      playBurst({
        baseFrequency: 180 + Math.random() * 140,
        peakFrequency: 620 + Math.random() * 260,
        duration: 0.06,
        type: 'square',
        gainLevel: 0.09,
      });
    }, 140);
  };

  const stopFlickerSound = () => {
    if (flickerIntervalRef.current) {
      window.clearInterval(flickerIntervalRef.current);
      flickerIntervalRef.current = null;
    }

    setFlickerActive(false);
  };

  const triggerLandingEffects = () => {
    setImpactActive(true);

    playBurst({
      baseFrequency: 42,
      peakFrequency: 84,
      duration: 0.42,
      type: 'sawtooth',
      gainLevel: 0.32,
    });

    playBurst({
      baseFrequency: 120,
      peakFrequency: 22,
      duration: 0.28,
      type: 'triangle',
      gainLevel: 0.18,
    });

    playBurst({
      baseFrequency: 380,
      peakFrequency: 210,
      duration: 0.16,
      type: 'square',
      gainLevel: 0.12,
    });

    landingTimeoutRef.current = window.setTimeout(() => {
      setImpactActive(false);
    }, 900);
  };

  const spinWheel = () => {
    if (spinning) {
      return;
    }

    const segmentSize = 360 / OPTIONS.length;
    const chosenIndex = Math.floor(Math.random() * OPTIONS.length);
    const landingOffset = chosenIndex * segmentSize + segmentSize / 2;
    const extraSpins = 5 + Math.floor(Math.random() * 4);
    const finalRotation = rotation + extraSpins * 360 + (360 - landingOffset);

    setSpinning(true);
    setResult('Spinning...');
    setRotation(finalRotation);
    startFlickerSound();

    window.setTimeout(() => {
      stopFlickerSound();
      setResult(OPTIONS[chosenIndex].label);
      setConfetti(createConfetti());
      triggerLandingEffects();
      setSpinning(false);
    }, SPIN_DURATION);
  };

  return (
    <main className={`app-shell ${impactActive ? 'impact-active' : ''} ${flickerActive ? 'flicker-active' : ''}`}>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="impact-flash" aria-hidden="true" />
      <div className="impact-rings" aria-hidden="true" />

      <section className="hero-card">
        <div className="copy-column">
          <div className="eyebrow">Mission Wheel</div>
          <h1>Assign the next rule.</h1>
          <p>
            A compact mission selector with a centered result readout and a tactical burst on landing.
          </p>
        </div>

        <div className="action-column">
          <div className="wheel-stage">
            <div className="result-badge">{result}</div>

            <div className="pointer" aria-hidden="true" />

            <div className="wheel-frame">
              <div
                className={`wheel ${spinning ? 'wheel-spinning' : ''} ${flickerActive ? 'wheel-flicker' : ''} ${impactActive ? 'wheel-impact' : ''}`}
                style={{
                  background: `conic-gradient(${wheelBackground})`,
                  '--spin-angle': `${rotation}deg`,
                  transform: `rotate(${rotation}deg)`,
                }}
                aria-label="Wheel of game options"
                role="img"
              >
                {OPTIONS.map((option, index) => {
                  const segmentSize = 360 / OPTIONS.length;
                  const angle = index * segmentSize + segmentSize / 2;
                  return (
                    <div
                      key={option.label}
                      className="wheel-label"
                      style={{ transform: `rotate(${angle}deg) translateY(-124px) rotate(-${angle}deg)` }}
                    >
                      <span>{option.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {confetti.map((piece) => (
              <span
                key={piece.id}
                className="confetti-piece"
                style={{
                  left: `${piece.left}%`,
                  width: `${piece.size}px`,
                  height: `${piece.size * 0.6}px`,
                  background: piece.color,
                  animationDelay: `${piece.delay}s`,
                  animationDuration: `${piece.duration}s`,
                  '--drift': `${piece.drift}px`,
                  '--rotate': `${piece.rotate}deg`,
                }}
              />
            ))}
          </div>

          <button className="spin-button" onClick={spinWheel} disabled={spinning} type="button">
            {spinning ? 'Deploying...' : 'Deploy spin'}
          </button>
        </div>
      </section>
    </main>
  );
}