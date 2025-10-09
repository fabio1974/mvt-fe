import React from "react";
import "./Home.css";

interface SectionContainerProps {
  children: React.ReactNode;
  id?: string;
}

export default function SectionContainer({
  children,
  id,
}: SectionContainerProps) {
  return (
    <section className="section-container" id={id}>
      {children}
    </section>
  );
}
