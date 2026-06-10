import React, { useRef, useState } from "react";
import { FiCamera } from "react-icons/fi";
import { api } from "../../services/api";

/**
 * Campo de upload de imagem reutilizável — equivalente web do ImageUploadField
 * do mobile. Abre o seletor de arquivo, envia pro Cloudinary via
 * POST /api/images/upload (multipart: file + folder) e devolve a URL pública.
 *
 * Usado no cardápio (foto do produto, folder "products") e em Configurar Loja
 * (capa/logo, folder "stores").
 */
interface ImageUploadFieldProps {
  value: string | null;
  onChange: (url: string | null) => void;
  /** Pasta no Cloudinary: "products" | "stores" | "categories". */
  folder: string;
  /** Proporção do preview (largura/altura). Ex: 16/9 pra capa, 1 pra logo. */
  aspectRatio?: number;
  label?: string;
  /** Estilo extra no container (ex: largura fixa pro logo). */
  containerStyle?: React.CSSProperties;
}

const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  value,
  onChange,
  folder,
  aspectRatio = 16 / 9,
  label = "Adicionar imagem",
  containerStyle,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      const res = await api.post<{ url: string }>("/api/images/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChange(res.data.url);
    } catch {
      window.alert("Não foi possível enviar a imagem. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      onClick={() => !uploading && inputRef.current?.click()}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: String(aspectRatio),
        border: "2px dashed #cbd5e1",
        borderRadius: 12,
        overflow: "hidden",
        cursor: uploading ? "default" : "pointer",
        background: "#f8fafc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...containerStyle,
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = ""; // permite re-selecionar o mesmo arquivo
        }}
      />
      {uploading ? (
        <div style={{ fontSize: 13, color: "#1d4ed8", fontWeight: 600 }}>Enviando...</div>
      ) : value ? (
        <img
          src={value}
          alt="preview"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <div style={{ textAlign: "center", color: "#64748b" }}>
          <FiCamera size={28} />
          <div style={{ fontSize: 13, marginTop: 4 }}>{label}</div>
        </div>
      )}
    </div>
  );
};

export default ImageUploadField;
