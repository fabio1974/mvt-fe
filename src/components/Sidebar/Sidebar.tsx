import { useNavigate } from "react-router-dom";
import "./Sidebar.css";

export default function Sidebar() {
  const navigate = useNavigate();
  return (
    <aside className="sidebar">
      <div className="sidebar-title">Menu</div>
      <nav className="sidebar-nav">
        <button onClick={() => navigate("/meus-eventos")}>Meus eventos</button>
        <button onClick={() => navigate("/criar-evento")}>Criar evento</button>
        <button onClick={() => navigate("/inscricoes")}>
          Minhas inscrições
        </button>
        <button onClick={() => navigate("/favoritos")}>Favoritos</button>
        <button onClick={() => navigate("/dados-pessoais")}>
          Dados pessoais
        </button>
        <button onClick={() => navigate("/sair")}>Sair</button>
      </nav>
    </aside>
  );
}
