import React, { useState } from "react";
import { FiMapPin } from "react-icons/fi";
import { Modal } from "./Modal";
import { AddressMapPicker } from "./AddressMapPicker";
import type { AddressData } from "./AddressMapPicker";
import "./AddressFieldWithMap.css";

interface AddressFieldWithMapProps {
  value: string;
  onChange: (value: string, addressData?: AddressData) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  fieldName?: string; // Nome do campo (ex: "fromAddress", "toAddress")
  onCoordinatesChange?: (latitude: number, longitude: number) => void; // Callback para atualizar lat/lng
  onAddressDataChange?: (addressData: AddressData) => void; // Callback para receber todos os dados do endereço
  initialLatitude?: number; // Latitude inicial para o mapa
  initialLongitude?: number; // Longitude inicial para o mapa
}

/**
 * Campo de endereço com botão para abrir modal do Google Maps
 */
export const AddressFieldWithMap: React.FC<AddressFieldWithMapProps> = ({
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  label = "Endereço",
  // fieldName, // Unused parameter
  onCoordinatesChange,
  onAddressDataChange,
  initialLatitude,
  initialLongitude,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addressData, setAddressData] = useState<AddressData>({
    address: value || "",
    latitude: initialLatitude || 0,
    longitude: initialLongitude || 0,
    city: "",
    state: "",
    zipCode: "",
  });

  const handleOpenMap = () => {
    // Se já tem endereço, tenta usar ele no mapa
    if (value) {
      setAddressData((prev) => ({
        ...prev,
        address: value,
      }));
    }
    setIsModalOpen(true);
  };

  const handleAddressSelect = (selectedAddress: AddressData) => {
    // Atualiza o campo com o endereço completo
    onChange(selectedAddress.address, selectedAddress);
    setAddressData(selectedAddress);
    
    // 🗺️ Atualiza os campos de latitude e longitude relacionados
    if (onCoordinatesChange && selectedAddress.latitude && selectedAddress.longitude) {
      onCoordinatesChange(selectedAddress.latitude, selectedAddress.longitude);
    }
    
    // 🏙️ Notifica sobre todos os dados do endereço (incluindo cidade)
    if (onAddressDataChange) {
      onAddressDataChange(selectedAddress);
    }
    
    setIsModalOpen(false);
  };

  return (
    <div className="address-field-with-map">
      <div className="address-input-container">
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Digite o endereço"}
          disabled={disabled}
          required={required}
          className="address-input"
        />
        {!disabled && (
          <button
            type="button"
            className="address-map-button"
            onClick={handleOpenMap}
            title="Selecionar no Google Maps"
          >
            <FiMapPin size={20} />
          </button>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`📍 Selecionar ${label}`}
        size="xlarge"
      >
        <AddressMapPicker
          value={addressData}
          onChange={setAddressData}
          disabled={disabled}
          required={required}
          showConfirmButton
          onAddressSelect={handleAddressSelect}
        />
      </Modal>
    </div>
  );
};
