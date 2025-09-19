import { useState } from "react";

export default function Section3() {
  const images = [
    {
      src: "https://dummyimage.com/400x180/cccccc/222222.png&text=Foto+1",
      alt: "Foto 1",
    },
    {
      src: "https://dummyimage.com/400x180/cccccc/222222.png&text=Foto+2",
      alt: "Foto 2",
    },
    {
      src: "https://dummyimage.com/400x180/cccccc/222222.png&text=Foto+3",
      alt: "Foto 3",
    },
  ];
  const [current, setCurrent] = useState(0);

  function prev() {
    setCurrent((c) => (c === 0 ? images.length - 1 : c - 1));
  }
  function next() {
    setCurrent((c) => (c === images.length - 1 ? 0 : c + 1));
  }

  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <h2>Página exclusiva para divulgação</h2>
      <p>Centralize todas as informações da sua competição esportiva.</p>
      <div
        style={{
          position: "relative",
          width: 400,
          height: 180,
          marginBottom: 16,
        }}
      >
        <img
          src={images[current].src}
          alt={images[current].alt}
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 12,
            objectFit: "cover",
          }}
        />
        <button
          onClick={prev}
          style={{
            position: "absolute",
            left: 8,
            top: "50%",
            transform: "translateY(-50%)",
            background: "#fff",
            border: "none",
            borderRadius: "50%",
            width: 32,
            height: 32,
            cursor: "pointer",
            fontWeight: "bold",
          }}
          aria-label="Anterior"
        >
          &#8592;
        </button>
        <button
          onClick={next}
          style={{
            position: "absolute",
            right: 8,
            top: "50%",
            transform: "translateY(-50%)",
            background: "#fff",
            border: "none",
            borderRadius: "50%",
            width: 32,
            height: 32,
            cursor: "pointer",
            fontWeight: "bold",
          }}
          aria-label="Próxima"
        >
          &#8594;
        </button>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {images.map((img, idx) => (
          <span
            key={img.src}
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: idx === current ? "#0099ff" : "#e0e7ef",
              display: "inline-block",
            }}
          />
        ))}
      </div>
    </div>
  );
}
