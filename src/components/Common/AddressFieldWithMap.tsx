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
  initialNumber?: string; // Número inicial do endereço
  initialNeighborhood?: string; // Bairro inicial
  initialCity?: string; // Cidade inicial
  initialState?: string; // Estado inicial
  initialZipCode?: string; // CEP inicial
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
  initialNumber,
  initialNeighborhood,
  initialCity,
  initialState,
  initialZipCode,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addressData, setAddressData] = useState<AddressData>({
    address: value || "",
    latitude: initialLatitude || 0,
    longitude: initialLongitude || 0,
    city: initialCity || "",
    state: initialState || "",
    zipCode: initialZipCode || "",
    street: value || "",
    number: initialNumber || "",
    neighborhood: initialNeighborhood || "",
  });

  // 🔄 Atualiza addressData quando as coordenadas iniciais mudarem
  // ⚠️ NÃO observa 'value' para evitar resetar dados após seleção no mapa
  React.useEffect(() => {
    if (initialLatitude !== undefined && initialLongitude !== undefined) {
      setAddressData((prev) => ({
        ...prev,
        latitude: initialLatitude,
        longitude: initialLongitude,
      }));
    }
  }, [initialLatitude, initialLongitude]);

  const handleOpenMap = () => {
    // 📍 Garante que o modal abre com todos os dados atuais
    setAddressData((prev) => ({
      ...prev,
      address: value || prev.address,
      street: value || prev.street,
      latitude: initialLatitude || prev.latitude,
      longitude: initialLongitude || prev.longitude,
      number: initialNumber || prev.number,
      neighborhood: initialNeighborhood || prev.neighborhood,
      city: initialCity || prev.city,
      state: initialState || prev.state,
      zipCode: initialZipCode || prev.zipCode,
    }));
    setIsModalOpen(true);
  };

  const handleAddressSelect = (selectedAddress: AddressData) => {
    console.log('📍 [AddressFieldWithMap] handleAddressSelect:', selectedAddress);
    
    setAddressData(selectedAddress);
    
    // 🏙️ Se tiver onAddressDataChange, usa ele para atualizar TODOS os campos
    // Isso evita conflito de state entre onChange e onAddressDataChange
    if (onAddressDataChange) {
      console.log('📍 [AddressFieldWithMap] Chamando onAddressDataChange');
      // ⚠️ Fecha o modal ANTES de chamar o callback para evitar re-render
      setIsModalOpen(false);
      // Usa setTimeout para garantir que o modal fechou antes de atualizar
      setTimeout(() => {
        onAddressDataChange(selectedAddress);
      }, 0);
      return;
    }
    
    // Se não tiver onAddressDataChange, usa onChange como fallback
    console.log('📍 [AddressFieldWithMap] Usando onChange como fallback');
    onChange(selectedAddress.address, selectedAddress);
    
    // 🗺️ Atualiza os campos de latitude e longitude relacionados
    if (onCoordinatesChange && selectedAddress.latitude && selectedAddress.longitude) {
      onCoordinatesChange(selectedAddress.latitude, selectedAddress.longitude);
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
          placeholder={disabled ? "" : (placeholder || "Digite o endereço")}
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
