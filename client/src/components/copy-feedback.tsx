import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface CopyFeedbackProps {
  text: string;
  variant?: "button" | "badge" | "icon";
  size?: "sm" | "default" | "lg";
  className?: string;
  children?: React.ReactNode;
  onCopy?: () => void;
}

export function CopyFeedback({ 
  text, 
  variant = "button", 
  size = "default",
  className,
  children,
  onCopy
}: CopyFeedbackProps) {
  const [copied, setCopied] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setIsAnimating(true);
      onCopy?.();

      // Reset after animation
      setTimeout(() => {
        setCopied(false);
        setIsAnimating(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const getIcon = () => {
    if (copied) {
      return <Check className={cn(
        "text-green-500",
        size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4"
      )} />;
    }
    return <Copy className={cn(
      size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4"
    )} />;
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "text-xs px-2 py-1";
      case "lg":
        return "text-lg px-4 py-2";
      default:
        return "text-sm px-3 py-1.5";
    }
  };

  if (variant === "icon") {
    return (
      <motion.div
        className={cn("relative inline-block", className)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className={cn(
            "h-auto p-1 transition-colors",
            copied && "text-green-500"
          )}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={copied ? 'check' : 'copy'}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ duration: 0.2 }}
            >
              {getIcon()}
            </motion.div>
          </AnimatePresence>
        </Button>

        <AnimatePresence>
          {isAnimating && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: -20 }}
              exit={{ opacity: 0, scale: 0.8, y: -30 }}
              className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none"
            >
              Copied!
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isAnimating && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ scale: 0 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="w-full h-full rounded-full bg-green-500/20" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  if (variant === "badge") {
    return (
      <motion.div
        className={cn("relative inline-block", className)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Badge
          variant={copied ? "default" : "outline"}
          className={cn(
            "cursor-pointer transition-all duration-200 select-none",
            getSizeClasses(),
            copied && "bg-green-500 text-white border-green-500"
          )}
          onClick={handleCopy}
        >
          <motion.div 
            className="flex items-center space-x-1"
            animate={isAnimating ? { x: [0, -2, 2, 0] } : {}}
            transition={{ duration: 0.3 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={copied ? 'check' : 'copy'}
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 90 }}
                transition={{ duration: 0.15 }}
                className="flex items-center"
              >
                {getIcon()}
              </motion.div>
            </AnimatePresence>
            {children && <span>{children}</span>}
          </motion.div>
        </Badge>

        <AnimatePresence>
          {isAnimating && (
            <>
              {/* Sparkle particles */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute pointer-events-none"
                  initial={{
                    scale: 0,
                    x: 0,
                    y: 0,
                    opacity: 1
                  }}
                  animate={{
                    scale: 1,
                    x: (i - 1) * 20,
                    y: -15 - (i * 5),
                    opacity: 0
                  }}
                  transition={{
                    duration: 0.8,
                    delay: i * 0.1
                  }}
                  style={{
                    left: '50%',
                    top: '50%'
                  }}
                >
                  <Sparkles className="h-3 w-3 text-green-500" />
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={cn("relative inline-block", className)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Button
        variant={copied ? "default" : "outline"}
        size={size}
        onClick={handleCopy}
        className={cn(
          "transition-all duration-300 relative overflow-hidden",
          copied && "bg-green-500 hover:bg-green-600 border-green-500 text-white"
        )}
        disabled={isAnimating}
      >
        <motion.div 
          className="flex items-center space-x-2"
          animate={isAnimating ? { y: [0, -2, 0] } : {}}
          transition={{ duration: 0.3 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={copied ? 'check' : 'copy'}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ duration: 0.2 }}
            >
              {getIcon()}
            </motion.div>
          </AnimatePresence>
          <span>{copied ? 'Copied!' : (children || 'Copy')}</span>
        </motion.div>

        {/* Shimmer effect */}
        <AnimatePresence>
          {copied && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.6 }}
            />
          )}
        </AnimatePresence>
      </Button>

      {/* Success ripple effect */}
      <AnimatePresence>
        {isAnimating && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ scale: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-full h-full rounded-md bg-green-500/30" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}