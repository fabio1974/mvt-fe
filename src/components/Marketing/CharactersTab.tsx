import React, { useEffect, useState } from "react";
import { marketingApi } from "./api";
import type { MarketingCharacter } from "./types";

const CharactersTab: React.FC = () => {
  const [characters, setCharacters] = useState<MarketingCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // form state
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await marketingApi.listCharacters();
      setCharacters(data);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Erro ao carregar personagens");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name.trim()) {
      setError("Selecione um arquivo e dê um nome ao personagem");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      await marketingApi.uploadCharacter(file, name.trim(), description.trim() || undefined);
      setFile(null);
      setName("");
      setDescription("");
      const fileInput = document.getElementById("char-file") as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
      await reload();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Falha ao cadastrar personagem");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (c: MarketingCharacter) => {
    if (!confirm(`Deletar personagem "${c.name}"? A foto também será removida do Cloudinary.`)) return;
    setDeletingId(c.id);
    setError(null);
    try {
      await marketingApi.deleteCharacter(c.id);
      await reload();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Falha ao deletar");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div
        style={{
          background: "#eff6ff",
          border: "1px solid #bfdbfe",
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
          fontSize: 14,
          color: "#1e40af",
          lineHeight: 1.5,
        }}
      >
        🎭 <strong>Personagens reutilizáveis.</strong> Cadastre uma foto de pessoa (frontal,
        boa luz, rosto bem visível) com um nome. Quando criar uma campanha de <strong>vídeo</strong>,
        escolha o personagem e o Veo vai usar essa foto como primeiro frame, mantendo o ator
        consistente entre vídeos diferentes.
      </div>

      <form
        onSubmit={handleUpload}
        style={{
          background: "white",
          padding: 20,
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          marginBottom: 24,
        }}
      >
        <h3 style={{ margin: "0 0 16px", fontSize: 16, color: "#0f172a" }}>Cadastrar novo personagem</h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>Foto (JPG/PNG)</label>
            <input
              id="char-file"
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              style={{ ...inputStyle, padding: 8 }}
            />
          </div>
          <div>
            <label style={labelStyle}>Nome do personagem</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Pedro Motoboy"
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Descrição (opcional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Motoboy jovem nordestino, traços cearenses, uniforme azul"
            rows={2}
            style={inputStyle}
          />
        </div>

        <button
          type="submit"
          disabled={uploading || !file || !name.trim()}
          style={{
            ...primaryBtn,
            opacity: uploading || !file || !name.trim() ? 0.5 : 1,
            cursor: uploading || !file || !name.trim() ? "not-allowed" : "pointer",
          }}
        >
          {uploading ? "Enviando…" : "🎭 Cadastrar personagem"}
        </button>
      </form>

      {error && (
        <div style={{ color: "#991b1b", background: "#fef2f2", padding: 12, borderRadius: 8, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <h3 style={{ margin: "0 0 12px", fontSize: 16, color: "#0f172a" }}>
        Personagens cadastrados {!loading && `(${characters.length})`}
      </h3>

      {loading && <div style={{ color: "#64748b" }}>Carregando…</div>}

      {!loading && characters.length === 0 && (
        <div
          style={{
            padding: 32,
            textAlign: "center",
            color: "#64748b",
            background: "#f8fafc",
            borderRadius: 12,
            border: "1px dashed #cbd5e1",
          }}
        >
          Nenhum personagem cadastrado ainda. Use o formulário acima.
        </div>
      )}

      {!loading && characters.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          {characters.map((c) => (
            <div
              key={c.id}
              style={{
                background: "white",
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  width: "100%",
                  paddingBottom: "100%",
                  position: "relative",
                  background: "#f1f5f9",
                }}
              >
                <img
                  src={c.assetUrl}
                  alt={c.name}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
              <div style={{ padding: 12, flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ fontWeight: 600, color: "#0f172a", fontSize: 15 }}>{c.name}</div>
                {c.description && (
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4, lineHeight: 1.4, flex: 1 }}>
                    {c.description}
                  </div>
                )}
                <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>ID #{c.id}</span>
                  <button
                    onClick={() => handleDelete(c)}
                    disabled={deletingId === c.id}
                    style={{
                      ...dangerBtn,
                      opacity: deletingId === c.id ? 0.5 : 1,
                      cursor: deletingId === c.id ? "not-allowed" : "pointer",
                    }}
                  >
                    {deletingId === c.id ? "…" : "🗑️ Deletar"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#475569",
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 10,
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  fontSize: 14,
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const primaryBtn: React.CSSProperties = {
  background: "#dbeafe",
  color: "#1d4ed8",
  border: "1px solid #93c5fd",
  borderRadius: 8,
  padding: "10px 18px",
  fontSize: 14,
  fontWeight: 600,
};

const dangerBtn: React.CSSProperties = {
  background: "#fee2e2",
  color: "#b91c1c",
  border: "1px solid #fecaca",
  borderRadius: 8,
  padding: "6px 12px",
  fontSize: 12,
  fontWeight: 600,
};

export default CharactersTab;
