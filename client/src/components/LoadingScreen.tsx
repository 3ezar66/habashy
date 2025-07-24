import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, delay: number}>>([]);
  const [hasError, setHasError] = useState(false);

  const loadingSteps = [
    { text: "آنالیز شبکه‌های بلاک‌چین...", coin: "₿", color: "#f7931a" },
    { text: "فعال‌سازی ماژول‌های RF و ارتعاشی...", coin: "📡", color: "#627eea" },
    { text: "��سکن پولهای رمزنگاری شده...", coin: "₳", color: "#0033ad" },
    { text: "کالیبراسیون سنسورهای حرارتی...", coin: "🌡️", color: "#f2a900" },
    { text: "بهینه‌سازی الگوریتم‌های تشخیص...", coin: "⚡", color: "#00b8a9" },
    { text: "فعال‌سازی سیستم نظارت...", coin: "◈", color: "#ff6b6b" },
    { text: "راه‌اندازی داشبورد نهایی...", coin: "●", color: "#4ecdc4" }
  ];

  // Generate floating particles
  useEffect(() => {
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2
    }));
    setParticles(newParticles);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / (3 * 60)); // 3 seconds total (faster)
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 300);
          return 100;
        }

        const stepIndex = Math.floor((newProgress / 100) * loadingSteps.length);
        if (stepIndex !== currentStep && stepIndex < loadingSteps.length) {
          setCurrentStep(stepIndex);
        }

        return newProgress;
      });
    }, 50); // Slower update rate to reduce CPU usage

    return () => clearInterval(interval);
  }, [onComplete, currentStep, loadingSteps.length]);

  const currentStepData = loadingSteps[currentStep] || loadingSteps[0];

  return (
    <div className="fixed inset-0 overflow-hidden z-50">
      {/* 3D Background with depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        {/* Animated grid pattern */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            animation: 'grid-move 20s linear infinite'
          }}
        />
        
        {/* Floating geometric shapes */}
        <div className="absolute inset-0">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute w-2 h-2"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
              }}
              animate={{
                y: [0, -100, 0],
                x: [0, Math.sin(particle.id) * 50, 0],
                rotate: [0, 360],
                scale: [0.5, 1, 0.5],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 4 + particle.delay,
                repeat: Infinity,
                delay: particle.delay,
                ease: "easeInOut"
              }}
            >
              <div 
                className="w-full h-full rounded-full"
                style={{
                  background: `linear-gradient(45deg, ${currentStepData.color}, transparent)`,
                  boxShadow: `0 0 10px ${currentStepData.color}50`
                }}
              />
            </motion.div>
          ))}
        </div>

        {/* Central holographic display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* Outer rotating ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 w-80 h-80 border-2 rounded-full"
              style={{
                borderImage: `linear-gradient(45deg, ${currentStepData.color}, transparent, ${currentStepData.color}) 1`,
                filter: 'blur(1px)'
              }}
            />
            
            {/* Middle ring */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              className="absolute inset-8 border rounded-full opacity-60"
              style={{
                borderColor: currentStepData.color,
                boxShadow: `inset 0 0 20px ${currentStepData.color}30, 0 0 20px ${currentStepData.color}30`
              }}
            />
            
            {/* Inner core */}
            <motion.div
              animate={{ 
                rotate: 360,
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                rotate: { duration: 4, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }}
              className="absolute inset-20 rounded-full flex items-center justify-center"
              style={{
                background: `radial-gradient(circle, ${currentStepData.color}20, transparent 70%)`,
                border: `1px solid ${currentStepData.color}`,
                boxShadow: `0 0 40px ${currentStepData.color}40`
              }}
            >
              {/* Central cryptocurrency symbol */}
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotateY: [0, 180, 360]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-6xl font-bold"
                style={{ 
                  color: currentStepData.color,
                  textShadow: `0 0 20px ${currentStepData.color}80`,
                  filter: 'drop-shadow(0 0 10px currentColor)'
                }}
              >
                {currentStepData.coin}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* UI Overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-white px-8">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent" style={{ fontFamily: "'Aref Ruqaa Ink', serif" }}>
            سامانه کاشف - نسخه شبح حبشی 4
          </h1>
          <p className="text-lg text-gray-300 mb-2" style={{ fontFamily: "'Noto Naskh Arabic', serif" }}>
            اسکن، جستجو، شناسایی، کشف و رصد دستگاه‌های استخراج رمزارز دیجیتال غیرمجاز
          </p>
          <p className="text-sm text-gray-400">
            استان ایلام • جمهوری اسلامی ایران
          </p>
        </motion.div>

        {/* Current step display */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center mb-4">
              <motion.div
                animate={{ 
                  rotateY: [0, 360],
                  scale: [1, 1.2, 1]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-4xl mr-4"
                style={{ 
                  color: currentStepData.color,
                  filter: `drop-shadow(0 0 10px ${currentStepData.color})`
                }}
              >
                {currentStepData.coin}
              </motion.div>
              <div className="text-right">
                <p className="text-2xl font-semibold mb-1" style={{ color: currentStepData.color }}>
                  {currentStepData.text}
                </p>
                <p className="text-gray-400 persian-numbers">
                  مرحله {currentStep + 1} از {loadingSteps.length}
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Progress bar */}
        <div className="w-full max-w-md mb-8">
          <div className="flex justify-between text-sm text-gray-300 mb-2">
            <span>پیشرفت کلی</span>
            <span className="persian-numbers">{Math.round(progress)}%</span>
          </div>
          <div className="h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
            <motion.div
              className="h-full rounded-full relative"
              style={{ 
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${currentStepData.color}, ${currentStepData.color}80)`,
                boxShadow: `0 0 20px ${currentStepData.color}60`
              }}
              transition={{ duration: 0.3 }}
            >
              {/* Animated shine effect */}
              <motion.div
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
                style={{ width: '50%' }}
              />
            </motion.div>
          </div>
        </div>




      </div>

      {/* CSS for grid animation */}
      <style jsx>{`
        @keyframes grid-move {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
      `}</style>
    </div>
  );
}
