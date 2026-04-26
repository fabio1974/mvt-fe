import React from "react";
import MDEditor from "@uiw/react-md-editor";
import "@uiw/react-md-editor/markdown-editor.css";

interface MarkdownFieldProps {
  value: string;
  onChange: (value: string) => void;
  height?: number;
  placeholder?: string;
}

/**
 * Editor de Markdown com toolbar (negrito, itálico, listas, links, código),
 * preview side-by-side e suporte a dark mode (via classe `dark` do CSS global).
 *
 * Wrap em torno de @uiw/react-md-editor pra normalizar a API com o resto do form
 * (string em → string out, sem o `value: string | undefined` original).
 */
const MarkdownField: React.FC<MarkdownFieldProps> = ({
  value,
  onChange,
  height = 300,
  placeholder,
}) => {
  return (
    <div data-color-mode="auto" style={{ width: "100%" }}>
      <MDEditor
        value={value || ""}
        onChange={(v) => onChange(v ?? "")}
        height={height}
        textareaProps={{ placeholder }}
        previewOptions={{ rehypePlugins: [] }}
        style={{ width: "100%" }}
      />
    </div>
  );
};

export default MarkdownField;
