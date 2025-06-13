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
      
      // Generate more confetti pieces with varied patterns
      const pieceCount = 75; // Increased from 50
      
      for (let i = 0; i < pieceCount; i++) {
        // Create burst pattern from center-top
        const angle = (Math.PI / 3) * Math.random() - Math.PI / 6; // Spread angle
        const velocity = 200 + Math.random() * 300;
        const centerX = window.innerWidth / 2;
        
        newPieces.push({
          id: i,
          x: centerX + (Math.random() - 0.5) * 400, // Wider spread
          y: -20,
          rotation: Math.random() * 360,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 10 + 3, // Slightly larger pieces
          delay: Math.random() * 0.8, // Longer delay spread
        });
      }
      
      setPieces(newPieces);
      
      // Auto-cleanup after animation
      setTimeout(() => {
        setIsActive(false);
        setPieces([]);
        onComplete?.();
      }, 4000); // Longer duration
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
              duration: 3 + Math.random() * 1.5,
              delay: piece.delay,
              ease: [0.23, 1, 0.32, 1], // Custom easing for more natural fall
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