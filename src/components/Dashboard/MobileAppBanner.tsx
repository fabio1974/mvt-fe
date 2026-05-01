import React, { useState, useEffect } from "react";
import { FiX, FiSmartphone } from "react-icons/fi";
import { FaGooglePlay, FaApple } from "react-icons/fa";
import { getGenderedGreeting } from "../../utils/auth";
import "./MobileAppBanner.css";

interface MobileAppBannerProps {
  userName?: string;
}

/**
 * MobileAppBanner - Banner de boas-vindas para usuários mobile
 * Sugere download do app Zapi10 para melhor experiência
 * Só aparece em dispositivos pequenos (max-width: 768px)
 */
const MobileAppBanner: React.FC<MobileAppBannerProps> = ({ userName }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Verifica se já foi dispensado nesta sessão
    const dismissed = sessionStorage.getItem("mobileAppBannerDismissed");
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem("mobileAppBannerDismissed", "true");
    setTimeout(() => setIsVisible(false), 300);
  };

  if (!isVisible) return null;

  return (
    <div className={`mobile-app-banner ${isDismissed ? "dismissing" : ""}`}>
      <button 
        className="mobile-app-banner-close" 
        onClick={handleDismiss}
        aria-label="Fechar"
      >
        <FiX size={20} />
      </button>

      <div className="mobile-app-banner-icon">
        <FiSmartphone size={32} />
      </div>

      <div className="mobile-app-banner-content">
        <h3 className="mobile-app-banner-title">
          Olá{userName ? `, ${userName}` : ""}! 👋
        </h3>
        <p className="mobile-app-banner-text">
          Seja {getGenderedGreeting().toLowerCase()} ao <strong>Zapi10</strong>!
        </p>
        <p className="mobile-app-banner-text">
          ...para uma melhor experiência, baixe nosso aplicativo:
        </p>
      </div>

      <div className="mobile-app-banner-stores">
        {/* Google Play - Ativo */}
        <a
          href="https://play.google.com/store/apps/details?id=com.mvt.mobile.zapi10"
          target="_blank"
          rel="noopener noreferrer"
          className="store-button google-play"
        >
          <FaGooglePlay size={20} />
          <div className="store-button-text">
            <span className="store-label">Disponível no</span>
            <span className="store-name">Google Play</span>
          </div>
        </a>

        {/* Apple Store */}
        <a
          href="https://apps.apple.com/br/app/zapi10-entregas-e-corridas/id6759847860"
          target="_blank"
          rel="noopener noreferrer"
          className="store-button app-store"
        >
          <FaApple size={24} />
          <div className="store-button-text">
            <span className="store-label">Baixar na</span>
            <span className="store-name">App Store</span>
          </div>
        </a>
      </div>
    </div>
  );
};

export default MobileAppBanner;
