import CreateEventForm from "./CreateEventForm";

export default function CreateEventPage() {
  return (
    <div
      style={{
        minHeight: "calc(100vh - 160px)",
        padding: "40px 20px",
        backgroundColor: "#f8f9fa",
      }}
    >
      <CreateEventForm />
    </div>
  );
}
