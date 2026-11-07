import * as LottieModule from "lottie-react";
import hummingbirdAnimation from "../../assets/animations/hummingbird.json";

import "./Hummingbird.css";

const Lottie = LottieModule.default.default;

function Hummingbird() {
  return (
    <div className="hummingbird">
      <Lottie
        animationData={hummingbirdAnimation}
        loop
        autoplay
      />
    </div>
  );
}

export default Hummingbird;