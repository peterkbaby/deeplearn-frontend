"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Circle,
  Diamond,
  Flower2,
  Heart,
  Moon,
  RotateCcw,
  Sparkles,
  Sun,
  Triangle,
  VolumeX,
} from "lucide-react";
const symbols = [
  Sun,
  Moon,
  Flower2,
  Diamond,
  Heart,
  Triangle,
  Circle,
  Sparkles,
];
const names = [
  "Sun",
  "Moon",
  "Flower",
  "Diamond",
  "Heart",
  "Triangle",
  "Circle",
  "Sparkles",
];
type Card = { id: number; symbol: number };
function shuffledCards(): Card[] {
  const cards = Array.from({ length: 16 }, (_, id) => ({ id, symbol: id % 8 }));
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}
export function MemoryGame({ userId }: { userId: string }) {
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [best, setBest] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState("Ready when you are.");
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAt = useRef(0);
  const locked = useRef(false);
  const won = matched.length === 8;
  useEffect(() => {
    if (!playing || won) return;
    const timer = setInterval(
      () => setSeconds(Math.floor((Date.now() - startedAt.current) / 1000)),
      1000,
    );
    return () => clearInterval(timer);
  }, [playing, won]);
  useEffect(
    () => () => {
      if (timeout.current) clearTimeout(timeout.current);
    },
    [],
  );
  function start() {
    if (timeout.current) clearTimeout(timeout.current);
    locked.current = false;
    setCards(shuffledCards());
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setSeconds(0);
    setPlaying(true);
    startedAt.current = Date.now();
    setAnnouncement("Game started. Find the eight matching pairs.");
    try {
      const stored = Number(localStorage.getItem(`still-best-${userId}`));
      setBest(stored > 0 && Number.isFinite(stored) ? stored : null);
    } catch {
      /* Storage is optional. */
    }
  }
  function flip(card: Card) {
    if (
      !playing ||
      won ||
      locked.current ||
      flipped.includes(card.id) ||
      matched.includes(card.symbol)
    )
      return;
    if (!flipped.length) {
      setFlipped([card.id]);
      return;
    }
    locked.current = true;
    setFlipped([flipped[0], card.id]);
    const nextMoves = moves + 1;
    setMoves(nextMoves);
    const first = cards.find((c) => c.id === flipped[0])!;
    if (first.symbol === card.symbol) {
      const nextMatched = [...matched, card.symbol];
      setMatched(nextMatched);
      setFlipped([]);
      locked.current = false;
      setAnnouncement(
        `${names[card.symbol]} pair found. ${nextMatched.length} of 8 pairs.`,
      );
      if (nextMatched.length === 8) {
        setAnnouncement(
          `Beautifully done. All eight pairs found in ${nextMoves} moves.`,
        );
        const record = best === null ? nextMoves : Math.min(best, nextMoves);
        setBest(record);
        try {
          localStorage.setItem(`still-best-${userId}`, String(record));
        } catch {
          /* Game works without persistence. */
        }
      }
    } else {
      setAnnouncement(
        `${names[first.symbol]} and ${names[card.symbol]}. Try another pair.`,
      );
      timeout.current = setTimeout(() => {
        setFlipped([]);
        locked.current = false;
      }, 900);
    }
  }
  const displayCards = cards.length
    ? cards
    : Array.from({ length: 16 }, (_, id) => ({ id, symbol: id % 8 }));
  return (
    <section className="game-layout">
      <div className="game-stage">
        <div className="stage-top">
          <span>
            <span className="tiny-dot" />{" "}
            {won
              ? "A MOMENT WELL SPENT"
              : playing
                ? "IN YOUR OWN TIME"
                : "FIND YOUR FOCUS"}
          </span>
          <VolumeX size={16} aria-label="A quiet game, without sound" />
        </div>
        <div
          className={`card-grid ${!playing ? "preview-grid" : ""}`}
          aria-label="Memory cards"
        >
          {displayCards.map((card, index) => {
            const isMatched = matched.includes(card.symbol);
            const revealed = flipped.includes(card.id) || isMatched;
            const Icon = symbols[card.symbol];
            return (
              <button
                key={card.id}
                type="button"
                className={`memory-card ${revealed ? "revealed" : ""} ${isMatched ? "matched" : ""}`}
                disabled={!playing || isMatched || won}
                onClick={() => flip(card)}
                aria-label={
                  revealed
                    ? `Card ${index + 1}: ${names[card.symbol]}${isMatched ? ", matched" : ""}`
                    : `Reveal card ${index + 1}`
                }
                aria-pressed={revealed}
              >
                <span className="card-back">
                  <span className="card-seed" />
                </span>
                <span className="card-front">
                  <Icon size={31} strokeWidth={1.5} />
                  {isMatched && <Check size={11} className="match-check" />}
                </span>
              </button>
            );
          })}
        </div>
        {!playing && (
          <div className="game-intro">
            <span className="intro-icon">
              <Flower2 size={32} strokeWidth={1.3} />
            </span>
            <h2>
              A small exercise
              <br />
              in being present.
            </h2>
            <p>Sixteen cards. Eight pairs. No rush.</p>
            <button className="button primary" onClick={start}>
              Let’s play
              <ArrowRight size={16} />
            </button>
          </div>
        )}
        {won && (
          <div className="game-complete" role="status">
            <span className="intro-icon">
              <Sparkles size={27} />
            </span>
            <h2>Beautifully done.</h2>
            <p>Eight pairs. {moves} moves. One clearer mind.</p>
            <button className="button primary" onClick={start}>
              Play again
              <RotateCcw size={16} />
            </button>
          </div>
        )}
        <div className="stage-bottom">
          <span>ONE PAIR AT A TIME.</span>
          <span>NO TIMER TO BEAT.</span>
        </div>
      </div>
      <aside className="game-sidebar">
        <div>
          <span className="section-number">001 / THE MEMORY GAME</span>
          <h2>
            Little things.
            <br />
            Perfect pairs.
          </h2>
          <p>
            Turn over two cards. Find a match.
            <br />
            Give your mind a little room to wander.
          </p>
        </div>
        <div className="game-stats">
          <div>
            <span>Pairs found</span>
            <strong>
              {matched.length}
              <small> / 8</small>
            </strong>
          </div>
          <div>
            <span>Moves</span>
            <strong>{String(moves).padStart(2, "0")}</strong>
          </div>
          <div>
            <span>Time, unhurried</span>
            <strong>
              {String(Math.floor(seconds / 60)).padStart(2, "0")}
              <small>:</small>
              {String(seconds % 60).padStart(2, "0")}
            </strong>
          </div>
        </div>
        {playing && (
          <button className="text-button" onClick={start}>
            <RotateCcw size={14} /> Start fresh
          </button>
        )}
        <div className="how-to">
          <span className="eyebrow">A SIMPLE KIND OF PLAY</span>
          <ol>
            <li>
              <span>01</span>Reveal any two cards.
            </li>
            <li>
              <span>02</span>Remember what you see.
            </li>
            <li>
              <span>03</span>Find all eight pairs.
            </li>
          </ol>
        </div>
        <div className="personal-best">
          <Sparkles size={15} />
          <span>
            {best
              ? `Your best: ${best} moves`
              : "A clear mind is its own reward."}
          </span>
        </div>
      </aside>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </section>
  );
}
