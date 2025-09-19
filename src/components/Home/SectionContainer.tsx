import React from "react";
import "./Home.css";

interface SectionContainerProps {
  children: React.ReactNode;
}

export default function SectionContainer({ children }: SectionContainerProps) {
  return <section className="section-container">{children}</section>;
}
