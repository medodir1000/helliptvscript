import { motion } from 'framer-motion'

/**
 * Animated HellIPTV logo: gradient play badge that tilts on hover + a pulsing
 * green "live" dot, with the two-tone wordmark.
 */
export default function Logo({ className = '' }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <motion.svg
        viewBox="0 0 48 48"
        className="h-8 w-8 shrink-0"
        whileHover={{ rotate: -6, scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 320, damping: 14 }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="logoGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#720eec" />
            <stop offset="1" stopColor="#c000ff" />
          </linearGradient>
        </defs>
        <rect width="48" height="48" rx="12" fill="url(#logoGrad)" />
        <path d="M19 16.5v15l13-7.5z" fill="#ffffff" />
        <motion.circle
          cx="37"
          cy="11"
          r="5"
          fill="#16a34a"
          stroke="#ffffff"
          strokeWidth="2"
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.svg>
      <span className="font-display text-lg font-black leading-none tracking-tight">
        <span className="text-fg">Hell</span>
        <span className="text-accent">IPTV</span>
      </span>
    </span>
  )
}
