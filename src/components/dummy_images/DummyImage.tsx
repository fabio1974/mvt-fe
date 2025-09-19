export default function DummyImage({ alt }: { alt: string }) {
  return (
    <div className="dummy-image">
      <span>{alt}</span>
    </div>
  );
}
