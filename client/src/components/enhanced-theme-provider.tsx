import { createContext, useContext, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isTransitioning: boolean;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  toggleTheme: () => null,
  isTransitioning: false,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function EnhancedThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const handleThemeChange = (newTheme: Theme) => {
    setIsTransitioning(true);
    
    // Add transition class
    document.documentElement.style.setProperty('--theme-transition', 'all 0.5s ease-in-out');
    
    setTimeout(() => {
      setTheme(newTheme);
      localStorage.setItem(storageKey, newTheme);
      
      setTimeout(() => {
        setIsTransitioning(false);
        document.documentElement.style.removeProperty('--theme-transition');
      }, 500);
    }, 50);
  };

  const toggleTheme = () => {
    const currentResolvedTheme = theme === "system" 
      ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      : theme;
    
    handleThemeChange(currentResolvedTheme === "dark" ? "light" : "dark");
  };

  const value = {
    theme,
    setTheme: handleThemeChange,
    toggleTheme,
    isTransitioning,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      <AnimatePresence mode="wait">
        {isTransitioning && (
          <motion.div
            key="theme-transition"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] pointer-events-none"
            style={{
              background: theme === "dark" 
                ? "radial-gradient(circle, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.05) 100%)"
                : "radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)"
            }}
          />
        )}
      </AnimatePresence>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};