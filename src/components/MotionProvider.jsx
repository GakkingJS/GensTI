import { LazyMotion, domAnimation } from "framer-motion";

function MotionProvider({ children }) {
  return (
    <LazyMotion features={domAnimation}>
      {children}
    </LazyMotion>
  );
}

export default MotionProvider;