import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfettiProps {
  trigger: boolean;
  onComplete?: () => void;
}

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  delay: number;
}

const colors = [
  "#10B981", // green
  "#3B82F6", // blue
  "#F59E0B", // yellow
  "#EF4444", // red
  "#8B5CF6", // purple
  "#06B6D4", // cyan
];

export function Confetti({ trigger, onComplete }: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (trigger) {
      setIsActive(true);
      const newPieces: ConfettiPiece[] = [];
      
      for (let i = 0; i < 50; i++) {
        newPieces.push({
          id: i,
          x: Math.random() * window.innerWidth,
          y: -20,
          rotation: Math.random() * 360,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 8 + 4,
          delay: Math.random() * 0.5,
        });
      }
      
      setPieces(newPieces);
      
      // Auto-cleanup after animation
      setTimeout(() => {
        setIsActive(false);
        setPieces([]);
        onComplete?.();
      }, 3000);
    }
  }, [trigger, onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {isActive && pieces.map((piece) => (
          <motion.div
            key={piece.id}
            className="absolute"
            initial={{
              x: piece.x,
              y: piece.y,
              rotate: piece.rotation,
              opacity: 1,
            }}
            animate={{
              y: window.innerHeight + 100,
              rotate: piece.rotation + 360,
              opacity: 0,
            }}
            transition={{
              duration: 2.5 + Math.random() * 1,
              delay: piece.delay,
              ease: "easeOut",
            }}
            style={{
              width: piece.size,
              height: piece.size,
              backgroundColor: piece.color,
              borderRadius: "2px",
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

export function useConfetti() {
  const [trigger, setTrigger] = useState(false);

  const fire = () => {
    setTrigger(true);
    setTimeout(() => setTrigger(false), 100);
  };

  return { trigger, fire };
}