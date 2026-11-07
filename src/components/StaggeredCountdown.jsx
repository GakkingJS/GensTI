import { animate, useInView, useReducedMotion } from "framer-motion";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  startTransition,
} from "react";

function StaggeredCountdown({
  targetNumber = "1234",
  duration = 2,
  delay = 0,
  color = "var(--color-accent)",
  prefix = "",
  suffix = "",
  prefixColor = "var(--color-text)",
  suffixColor = "var(--color-text)",
  spacing = 0,
  direction = "up",
  className = "",
  style = {},
}) {
  const ref = useRef(null);
  const hasAnimated = useRef(false);

  const isInView = useInView(ref, {
    amount: 0.5,
    once: true,
  });

  const shouldReduceMotion = useReducedMotion();

  const targetString = String(targetNumber ?? "");

  const targetChars = useMemo(
    () => targetString.split(""),
    [targetString],
  );

  const digitIndices = useMemo(() => {
    let digitCounter = 0;

    return targetChars.map((character) => {
      if (/^\d$/.test(character)) {
        return digitCounter++;
      }

      return -1;
    });
  }, [targetChars]);

  const digitCount = useMemo(
    () => digitIndices.filter((index) => index !== -1).length,
    [digitIndices],
  );

  const finalDigits = useMemo(() => {
    const result = Array(digitCount).fill(0);

    targetChars.forEach((character, charIndex) => {
      const digitIndex = digitIndices[charIndex];

      if (digitIndex === -1) {
        return;
      }

      result[digitIndex] = Number.parseInt(character, 10);
    });

    return result;
  }, [targetChars, digitIndices, digitCount]);

  const [animatedDigits, setAnimatedDigits] = useState(
    () => Array(digitCount).fill(0),
  );

  useEffect(() => {
    if (!isInView || hasAnimated.current) {
      return undefined;
    }

    hasAnimated.current = true;

    if (shouldReduceMotion) {
      setAnimatedDigits(finalDigits);
      return undefined;
    }

    const timeouts = [];
    const animationControls = [];

    setAnimatedDigits(Array(digitCount).fill(0));

    targetChars.forEach((character, charIndex) => {
      const digitIndex = digitIndices[charIndex];

      if (digitIndex === -1) {
        return;
      }

      const targetDigit = Number.parseInt(character, 10);
      const staggerDelay = digitIndex * 0.1;
      const digitDuration = duration * 0.8;

      const timeoutId = window.setTimeout(() => {
        const controls = animate(0, targetDigit, {
          duration: digitDuration,
          ease: "easeInOut",

          onUpdate: (value) => {
            startTransition(() => {
              setAnimatedDigits((previous) => {
                const next = [...previous];

                next[digitIndex] = Math.max(
                  0,
                  Math.min(9, value),
                );

                return next;
              });
            });
          },
        });

        animationControls.push(controls);
      }, (delay + staggerDelay) * 1000);

      timeouts.push(timeoutId);
    });

    return () => {
      timeouts.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });

      animationControls.forEach((controls) => {
        controls.stop();
      });
    };
  }, [
    isInView,
    shouldReduceMotion,
    finalDigits,
    digitCount,
    targetChars,
    digitIndices,
    duration,
    delay,
  ]);

  return (
    <span
      ref={ref}
      className={`staggered-countdown ${className}`}
      style={{
        ...style,
        color,
      }}
      aria-label={`${prefix}${targetString}${suffix}`}
    >
      {prefix && (
        <span
          className="staggered-countdown-prefix"
          style={{ color: prefixColor }}
        >
          {prefix}
        </span>
      )}

      <span
        className="staggered-countdown-digits"
        style={{ gap: `${spacing}px` }}
      >
        {targetChars.map((character, charIndex) => {
          const digitIndex = digitIndices[charIndex];

          if (digitIndex === -1) {
            return (
              <span
                key={`separator-${charIndex}`}
                className="staggered-countdown-separator"
              >
                {character}
              </span>
            );
          }

          const animatedValue =
            animatedDigits[digitIndex] ?? 0;

          const currentDigit = Math.floor(animatedValue);
          const progress = animatedValue - currentDigit;
          const nextDigit = currentDigit + 1;

          const currentTransform =
            direction === "up"
              ? `translateY(${progress * -100}%)`
              : `translateY(${progress * 100}%)`;

          const nextTransform =
            direction === "up"
              ? `translateY(${(1 - progress) * 100}%)`
              : `translateY(${(1 - progress) * -100}%)`;

          return (
            <span
              key={`digit-${charIndex}`}
              className="staggered-countdown-digit"
            >
              <span
                className="staggered-countdown-number"
                style={{
                  color,
                  transform: currentTransform,
                }}
              >
                {currentDigit}
              </span>

              {progress > 0 && nextDigit <= 9 && (
                <span
                  className="staggered-countdown-number"
                  style={{
                    color,
                    transform: nextTransform,
                  }}
                >
                  {nextDigit}
                </span>
              )}
            </span>
          );
        })}
      </span>

      {suffix && (
        <span
          className="staggered-countdown-suffix"
          style={{ color: suffixColor }}
        >
          {suffix}
        </span>
      )}
    </span>
  );
}

export default StaggeredCountdown;