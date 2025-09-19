import Section1 from "./sections/Section1";
import Section2 from "./sections/Section2";
import Section3 from "./sections/Section3";
import Section4 from "./sections/Section4";
import Section5 from "./sections/Section5";
import Section6 from "./sections/Section6";
import Section7 from "./sections/Section7";
import Section8 from "./sections/Section8";
import Section9 from "./sections/Section9";

import "./Home.css";
import SectionContainer from "./SectionContainer";

export default function Home() {
  return (
    <main className="serra-home">
      <SectionContainer>
        <Section1 />
      </SectionContainer>
      <SectionContainer>
        <Section2 />
      </SectionContainer>
      <SectionContainer>
        <Section3 />
      </SectionContainer>
      <SectionContainer>
        <Section4 />
      </SectionContainer>
      <SectionContainer>
        <Section5 />
      </SectionContainer>
      <SectionContainer>
        <Section6 />
      </SectionContainer>
      <SectionContainer>
        <Section7 />
      </SectionContainer>
      <SectionContainer>
        <Section8 />
      </SectionContainer>
      <SectionContainer>
        <Section9 />
      </SectionContainer>
    </main>
  );
}
