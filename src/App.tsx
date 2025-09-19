import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div className="home-page">
        <img src={reactLogo} alt="React Logo" style={{ height: 80 }} />
        <img
          src={viteLogo}
          alt="Vite Logo"
          style={{ height: 80, marginLeft: 16 }}
        />
        <h1>Moveltrack Systems</h1>
        <p>Bem-vindo à página inicial da Moveltrack Systems.</p>
        <button onClick={() => setCount(count + 1)}>Contador: {count}</button>
        <p>Now Pushed using CICD / GitHub Actions.</p>
      </div>
    </>
  );
}

export default App;
