import React, { memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'react-router-dom';

// Enhanced page transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  out: {
    opacity: 0,
    y: -10,
    scale: 1.02,
  }
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.4
};

// Stagger animation for child elements
const containerVariants = {
  initial: {
    opacity: 0
  },
  in: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  },
  out: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1
    }
  }
};

const childVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.95
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 300
    }
  },
  out: {
    opacity: 0,
    y: -10,
    scale: 1.05,
    transition: {
      duration: 0.2
    }
  }
};

const PageTransition = memo(({ children, className = "" }) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className={`min-h-screen ${className}`}
        style={{
          willChange: 'transform, opacity'
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
});

PageTransition.displayName = 'PageTransition';

// Enhanced section transition for content blocks
export const SectionTransition = memo(({ children, className = "", delay = 0, stagger = false }) => {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={stagger ? containerVariants : childVariants}
      transition={{
        delay,
        type: "spring",
        damping: 25,
        stiffness: 300
      }}
      className={className}
      style={{
        willChange: 'transform, opacity'
      }}
    >
      {stagger ? (
        React.Children.map(children, (child, index) => (
          <motion.div key={index} variants={childVariants}>
            {child}
          </motion.div>
        ))
      ) : (
        children
      )}
    </motion.div>
  );
});

SectionTransition.displayName = 'SectionTransition';

// Fade transition for overlays and modals
export const FadeTransition = memo(({ 
  children, 
  isVisible, 
  duration = 0.3, 
  className = "",
  backdrop = false 
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration }}
          className={`${backdrop ? 'fixed inset-0 z-50' : ''} ${className}`}
          style={{
            willChange: 'opacity'
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
});

FadeTransition.displayName = 'FadeTransition';

// Slide transition for sidebars and panels
export const SlideTransition = memo(({ 
  children, 
  isVisible, 
  direction = 'right', 
  className = "" 
}) => {
  const slideVariants = {
    hidden: {
      x: direction === 'right' ? '100%' : direction === 'left' ? '-100%' : 0,
      y: direction === 'up' ? '-100%' : direction === 'down' ? '100%' : 0,
      opacity: 0
    },
    visible: {
      x: 0,
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        damping: 30,
        stiffness: 300
      }
    },
    exit: {
      x: direction === 'right' ? '100%' : direction === 'left' ? '-100%' : 0,
      y: direction === 'up' ? '-100%' : direction === 'down' ? '100%' : 0,
      opacity: 0,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={slideVariants}
          className={className}
          style={{
            willChange: 'transform, opacity'
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
});

SlideTransition.displayName = 'SlideTransition';

export default PageTransition;
