import Hero from "./Hero";
import Benefits from "./Benefits";
import Impact from "./Impact";
import HowItWorks from "./HowItWorks";
import CTA from "./CTA";
import LandingFooter from "./LandingFooter";

const LandingPage = () => {
  return (
    <>
      <style>
        {`
          @keyframes fadeUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
        `}
      </style>
      <div
        className="zapi10-landing"
        style={{
          minHeight: "100vh",
          width: "100%",
          backgroundColor: "hsl(220, 25%, 10%)",
          color: "hsl(0, 0%, 100%)",
          fontFamily: "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif",
          lineHeight: 1.5,
          fontWeight: 400,
          overflow: "hidden",
        }}
      >
        <Hero />
        <Benefits />
        <Impact />
        <HowItWorks />
        <CTA />
        <LandingFooter />
      </div>
    </>
  );
};

export default LandingPage;
