import { m } from "framer-motion";

function ScrollReveal({
  children,
  className = "",
  delay = 0,
  y = 28,
  duration = 0.65,
  amount = 0.15,
  once = true,
}) {
  return (
    <m.div
      className={className}
      initial={{
        opacity: 0,
        y,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once,
        amount,
      }}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </m.div>
  );
}

export default ScrollReveal;