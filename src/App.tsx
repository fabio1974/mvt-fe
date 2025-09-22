import "./App.css";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import Home from "./components/Home/Home";
import LoginRegisterPage from "./components/Auth/LoginRegisterPage";
import Sidebar from "./components/Sidebar/Sidebar";
import { Routes, Route } from "react-router-dom";

function App() {
  // Usuário está logado se existe token no localStorage
  const isLoggedIn = Boolean(localStorage.getItem("authToken"));
  return (
    <div className="App" style={{ display: "flex", minHeight: "100vh" }}>
      {isLoggedIn && <Sidebar />}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          marginLeft: isLoggedIn ? 220 : 0,
        }}
      >
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginRegisterPage />} />
        </Routes>
        <Footer />
      </div>
    </div>
  );
}

export default App;
