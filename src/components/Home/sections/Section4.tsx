type EventCardProps = {
  image: string;
  date: string;
  title: string;
  location: string;
  city: string;
};
function EventCard({ image, date, title, location, city }: EventCardProps) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        width: 260,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        margin: "0 12px",
      }}
    >
      <div
        style={{
          position: "relative",
          width: 228,
          height: 140,
          marginBottom: 12,
        }}
      >
        <img
          src={image}
          alt={title}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: 12,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            background: "#fff",
            borderRadius: 8,
            padding: "4px 10px",
            fontWeight: 700,
            fontSize: 16,
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          }}
        >
          {date}
        </div>
      </div>
      <div
        style={{
          fontWeight: 600,
          fontSize: 16,
          marginBottom: 8,
          textAlign: "left",
          width: "100%",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 14,
          color: "#444",
          marginBottom: 4,
          width: "100%",
          textAlign: "left",
        }}
      >
        📅 {location}
      </div>
      <div
        style={{
          fontSize: 14,
          color: "#444",
          marginBottom: 12,
          width: "100%",
          textAlign: "left",
        }}
      >
        📍 {city}
      </div>
      <button
        style={{
          border: "1px solid #222",
          borderRadius: 8,
          padding: "8px 16px",
          background: "#fff",
          fontWeight: 500,
          cursor: "pointer",
          width: "100%",
        }}
      >
        Confira este evento
      </button>
    </div>
  );
}
export default function Section4() {
  const events = [
    {
      image: "https://dummyimage.com/228x140/0099ff/fff.png&text=Evento+1",
      date: "23 AGO",
      title: "Copa Kids Edição Par 2025",
      location: "23 Agosto 2025",
      city: "Vila Velha/ES",
    },
    {
      image: "https://dummyimage.com/228x140/cccccc/222.png&text=Evento+2",
      date: "20 SET",
      title: "20º Revezamento São Chico",
      location: "20 Setembro 2025",
      city: "São Francisco do Sul/SC",
    },
    {
      image: "https://dummyimage.com/228x140/222/fff.png&text=Evento+3",
      date: "20 SET",
      title: "FREITAS CUP - Etapa ESP",
      location: "20 Setembro 2025",
      city: "São Paulo/SP",
    },
    {
      image: "https://dummyimage.com/228x140/ff4444/fff.png&text=Evento+4",
      date: "21 SET",
      title: "Kenda Cup Championship",
      location: "21 Setembro 2025",
      city: "Bueno Brandão/MG",
    },
  ];
  return (
    <div style={{ background: "#f4f7fa", padding: "32px 0" }}>
      <h2
        style={{
          fontSize: "2.5rem",
          fontWeight: 700,
          textAlign: "center",
          marginBottom: 24,
          color: "#222",
        }}
      >
        Atleta, encontre seu próximo desafio
      </h2>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 24,
          marginRight: 32,
        }}
      >
        <button
          style={{
            border: "1px solid #222",
            borderRadius: 12,
            padding: "12px 24px",
            background: "#fff",
            fontWeight: 500,
            fontSize: 18,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          Ver todos <span style={{ fontSize: 22 }}>→</span>
        </button>
      </div>
      <div
        style={{
          display: "flex",
          gap: 16,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        {events.map((ev, idx) => (
          <EventCard key={idx} {...ev} />
        ))}
      </div>
    </div>
  );
}
