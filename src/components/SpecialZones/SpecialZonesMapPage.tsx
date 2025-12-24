import { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleMap, Circle, useLoadScript } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import type { SpecialZone, SpecialZoneType } from '../../types/specialZone';
import { FaMapMarkedAlt, FaExclamationTriangle, FaDollarSign, FaTrash } from 'react-icons/fa';
import { FiHome, FiChevronRight, FiCrosshair } from 'react-icons/fi';
import { showToast } from '../../utils/toast';
import '../Generic/EntityCRUD.css';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const DEFAULT_RADIUS = 300; // 300 metros

const SpecialZonesMapPage = () => {
  const navigate = useNavigate();
  
  // Carregar Google Maps Script uma única vez
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });
  
  const [zones, setZones] = useState<SpecialZone[]>([]);
  const [selectedType, setSelectedType] = useState<SpecialZoneType | null>(null); // null = modo visualização
  const [filterTab, setFilterTab] = useState<SpecialZoneType>('DANGER'); // Tab de filtro no sidebar
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: -3.7327, lng: -38.5267 });
  const [loading, setLoading] = useState(false);
  const [_editingZoneId, setEditingZoneId] = useState<string | null>(null); // Para rastreio de edição
  const [mapZoom, setMapZoom] = useState(13);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [tempZonePositions, setTempZonePositions] = useState<Record<string, { lat: number; lng: number }>>({});
  const [isCreating, setIsCreating] = useState(false); // Prevenir múltiplas criações

  // Obter localização do usuário ao carregar
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setMapCenter(userPos);
        },
        (error) => {
          console.warn('Erro ao obter localização:', error);
          // Mantém o centro padrão (Fortaleza)
        }
      );
    }
  }, []);

  // Carregar zonas do backend
  const loadZones = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<{ content: SpecialZone[] }>('/api/special-zones');
      setZones(response.data.content || []);
    } catch (error) {
      console.error('Erro ao carregar zonas:', error);
      showToast('Erro ao carregar zonas especiais', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadZones();
  }, [loadZones]);

  // Adicionar zona ao clicar no mapa
  const handleMapClick = useCallback(async (e: google.maps.MapMouseEvent) => {
    // Só criar zona se um tipo estiver selecionado (modo de inclusão)
    if (!e.latLng || !selectedType || isCreating) return;

    // Prevenir múltiplos cliques
    setIsCreating(true);

    const latitude = e.latLng.lat();
    const longitude = e.latLng.lng();

    // Calcular raio baseado no zoom atual (20% da altura do mapa)
    const currentZoom = mapInstance?.getZoom() || mapZoom;
    const calculatedRadius = calculateRadiusFromZoom(currentZoom, 0.20);

    // Geocode reverso para obter endereço
    let address = '';
    try {
      const geocoder = new google.maps.Geocoder();
      const result = await geocoder.geocode({ location: { lat: latitude, lng: longitude } });
      if (result.results[0]) {
        address = result.results[0].formatted_address;
      }
    } catch (error) {
      console.warn('Erro ao obter endereço:', error);
    }

    const newZone: SpecialZone = {
      latitude,
      longitude,
      address,
      zoneType: selectedType,
      radiusMeters: calculatedRadius,
      isActive: true,
    };

    try {
      const response = await api.post<SpecialZone>('/api/special-zones', newZone);
      
      // Usar forma funcional para garantir estado correto
      setZones(prevZones => [...prevZones, response.data]);
      
      showToast('Zona especial criada com sucesso!', 'success');
      // Desativar modo de inclusão após criar
      setSelectedType(null);
    } catch (error) {
      console.error('Erro ao criar zona:', error);
      showToast('Erro ao criar zona especial', 'error');
    } finally {
      // Liberar para nova criação após 500ms
      setTimeout(() => setIsCreating(false), 500);
    }
  }, [selectedType, isCreating, mapInstance, mapZoom]);

  // Deletar zona
  const handleDelete = async (id: string) => {
    if (!window.confirm('Deseja realmente excluir esta zona especial?')) return;

    try {
      await api.delete(`/api/special-zones/${id}`);
      setZones(zones.filter(z => z.id !== id));
      // Limpar posição temporária se existir
      setTempZonePositions(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
      showToast('Zona excluída com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao deletar zona:', error);
      showToast('Erro ao excluir zona', 'error');
    }
  };

  // Alternar ativo/inativo
  const handleToggleActive = async (zone: SpecialZone) => {
    try {
      const updated = { ...zone, isActive: !zone.isActive };
      await api.put(`/api/special-zones/${zone.id}`, updated);
      setZones(prevZones => prevZones.map(z => z.id === zone.id ? updated : z));
      showToast(`Zona ${updated.isActive ? 'ativada' : 'desativada'}!`, 'success');
    } catch (error) {
      console.error('Erro ao atualizar zona:', error);
      showToast('Erro ao atualizar zona', 'error');
    }
  };

  // Atualizar raio da zona
  const handleRadiusChange = useCallback(async (zoneId: string, newRadius: number) => {
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return;

    try {
      const updated = { ...zone, radiusMeters: Math.round(newRadius) };
      await api.put(`/api/special-zones/${zone.id}`, updated);
      setZones(prevZones => prevZones.map(z => z.id === zoneId ? updated : z));
      showToast(`Raio atualizado para ${Math.round(newRadius)}m`, 'success');
    } catch (error) {
      console.error('Erro ao atualizar raio:', error);
      showToast('Erro ao atualizar raio', 'error');
    }
  }, [zones]);

  // Atualizar posição da zona ao arrastar o marcador
  const handleMarkerDragEnd = useCallback(async (zoneId: string, newLat: number, newLng: number) => {
    
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) {
      console.error('❌ Zona não encontrada:', zoneId);
      return;
    }
    setLoading(true);
    
    try {
      // Fazer geocoding reverso para obter o novo endereço
      const geocoder = new google.maps.Geocoder();
      const location = { lat: newLat, lng: newLng };
      
      geocoder.geocode({ location }, async (results, status) => {
        
        try {
          if (status === 'OK' && results?.[0]) {
            const newAddress = results[0].formatted_address;
            const updated = { 
              ...zone, 
              latitude: newLat, 
              longitude: newLng,
              address: newAddress
            };
            await api.put(`/api/special-zones/${zone.id}`, updated);
            
            // Usar forma funcional para garantir estado atualizado
            setZones(prevZones => prevZones.map(z => z.id === zoneId ? updated : z));
            // Limpar posição temporária apenas após atualizar o estado
            setTempZonePositions(prev => {
              const temp = { ...prev };
              delete temp[zoneId];
              return temp;
            });
            showToast('Zona movida com sucesso', 'success');
          } else {
            // Se o geocoding falhar, atualiza só as coordenadas
            const updated = { 
              ...zone, 
              latitude: newLat, 
              longitude: newLng
            };
            await api.put(`/api/special-zones/${zone.id}`, updated);
            
            // Usar forma funcional para garantir estado atualizado
            setZones(prevZones => prevZones.map(z => z.id === zoneId ? updated : z));
            // Limpar posição temporária apenas após atualizar o estado
            setTempZonePositions(prev => {
              const temp = { ...prev };
              delete temp[zoneId];
              return temp;
            });
            showToast('Zona movida (sem atualização de endereço)', 'success');
          }
        } catch (error) {
          console.error('❌ Erro ao atualizar zona no backend:', error);
          showToast('Erro ao mover zona', 'error');
          // Limpar posição temporária mesmo em caso de erro
          setTempZonePositions(prev => {
            const temp = { ...prev };
            delete temp[zoneId];
            return temp;
          });
        } finally {
          setLoading(false);
        }
      });
    } catch (error) {
      console.error('❌ Erro ao fazer geocoding:', error);
      // Atualizar só as coordenadas se o geocoding falhar completamente
      try {
        const updated = { 
          ...zone, 
          latitude: newLat, 
          longitude: newLng
        };
        await api.put(`/api/special-zones/${zone.id}`, updated);
        
        // Usar forma funcional para garantir estado atualizado
        setZones(prevZones => prevZones.map(z => z.id === zoneId ? updated : z));
        // Limpar posição temporária apenas após atualizar o estado
        setTempZonePositions(prev => {
          const temp = { ...prev };
          delete temp[zoneId];
          return temp;
        });
        showToast('Zona movida (sem geocoding)', 'success');
      } catch (apiError) {
        console.error('Erro ao atualizar zona:', apiError);
        showToast('Erro ao mover zona', 'error');
        // Limpar posição temporária em caso de erro
        setTempZonePositions(prev => {
          const temp = { ...prev };
          delete temp[zoneId];
          return temp;
        });
      } finally {
        setLoading(false);
      }
    }
  }, [zones]);

  // Obter cor do marcador baseado no tipo
  const getMarkerColor = (type: SpecialZoneType): string => {
    return type === 'DANGER' ? '#EF4444' : '#3B82F6'; // Vermelho ou Azul
  };

  // Calcular raio ideal baseado no zoom atual (20% da altura do mapa)
  const calculateRadiusFromZoom = (zoom: number, targetFraction: number = 0.20): number => {
    // Altura do mapa em pixels (aproximadamente)
    const mapHeightPixels = 600;
    
    // Pixels que o diâmetro deve ocupar (20% da altura)
    const targetPixels = mapHeightPixels * targetFraction;
    
    // Zoom 20: ~0.5 metros por pixel (latitude ~-23)
    const metersPerPixelAtZoom20 = 0.5;
    
    // Calcular metros por pixel no zoom atual
    const metersPerPixel = metersPerPixelAtZoom20 * Math.pow(2, 20 - zoom);
    
    // Calcular diâmetro em metros e depois o raio
    const diameterMeters = targetPixels * metersPerPixel;
    const radiusMeters = diameterMeters / 2;
    
    // Arredondar para múltiplos de 10 e garantir mínimo de 50m
    return Math.max(50, Math.round(radiusMeters / 10) * 10);
  };

  // Calcular zoom ideal para que o diâmetro do círculo ocupe 1/3 da altura do mapa
  const calculateZoomForDiameter = (radiusMeters: number, targetFraction: number = 0.33): number => {
    // Altura do mapa em pixels (aproximadamente)
    const mapHeightPixels = 600;
    
    // Pixels que o diâmetro deve ocupar
    const targetPixels = mapHeightPixels * targetFraction;
    const diameterMeters = radiusMeters * 2;
    
    // Metros por pixel necessário
    const metersPerPixel = diameterMeters / targetPixels;
    
    // Zoom 20: ~0.5 metros por pixel (latitude ~-23)
    const metersPerPixelAtZoom20 = 0.5;
    const zoom = 20 - Math.log2(metersPerPixel / metersPerPixelAtZoom20);
    
    // Limitar entre 1 e 20
    return Math.max(1, Math.min(20, Math.round(zoom)));
  };

  // Centralizar e ajustar zoom para mostrar zona
  const focusOnZone = (zone: SpecialZone, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    // Centralizar mapa na zona
    setMapCenter({ lat: zone.latitude, lng: zone.longitude });
    
    // Calcular e aplicar zoom ideal (diâmetro = 1/3 da altura)
    // Subtrair 2 unidades para zoom mais distante (círculo menor)
    const radiusMeters = zone.radiusMeters || DEFAULT_RADIUS;
    const idealZoom = calculateZoomForDiameter(radiusMeters, 0.33) - 2;
    const finalZoom = Math.max(1, Math.min(20, idealZoom)); // Garantir limites
    setMapZoom(finalZoom);
    
    if (mapInstance) {
      mapInstance.setZoom(finalZoom);
    }
  };

  // Filtrar zonas por tab selecionada
  const filteredZones = zones.filter(z => z.zoneType === filterTab);

  // Memorizar renderização dos círculos para evitar recriação em cada render
  const circles = useMemo(() => {
    return zones.map((zone) => {
      const position = zone.id && tempZonePositions[zone.id]
        ? tempZonePositions[zone.id]
        : { lat: zone.latitude, lng: zone.longitude };
      
      return (
        <Circle
          key={`zone-${zone.id}`}
          center={position}
          radius={zone.radiusMeters || DEFAULT_RADIUS}
          options={{
            fillColor: getMarkerColor(zone.zoneType),
            fillOpacity: zone.isActive ? 0.2 : 0.1,
            strokeColor: getMarkerColor(zone.zoneType),
            strokeOpacity: zone.isActive ? 0.6 : 0.3,
            strokeWeight: 2,
            editable: true,
            draggable: true,
          }}
          onLoad={(circle) => {
            
            // Adicionar listener para drag usando API nativa do Google Maps
            google.maps.event.addListener(circle, 'dragstart', () => {
              if (zone.id) {
                setEditingZoneId(zone.id);
              }
            });
            
            google.maps.event.addListener(circle, 'drag', () => {
              if (zone.id) {
                const center = circle.getCenter();
                if (center) {
                  const newLat = center.lat();
                  const newLng = center.lng();
                  setTempZonePositions(prev => ({
                    ...prev,
                    [zone.id!]: { lat: newLat, lng: newLng }
                  }));
                }
              }
            });
            
            google.maps.event.addListener(circle, 'dragend', () => {
              if (zone.id) {
                const center = circle.getCenter();
                if (center) {
                  const newLat = center.lat();
                  const newLng = center.lng();
                  handleMarkerDragEnd(zone.id, newLat, newLng);
                  setEditingZoneId(null);
                }
              }
            });
          }}
          onRadiusChanged={function() {
            if (!zone.id) return;
            // @ts-ignore
            const newRadius = this.getRadius();
            const currentRadius = zone.radiusMeters || DEFAULT_RADIUS;
            if (newRadius && Math.abs(newRadius - currentRadius) > 1) {
              handleRadiusChange(zone.id, newRadius);
            }
          }}
        />
      );
    });
  }, [zones, tempZonePositions, handleRadiusChange, handleMarkerDragEnd]);

  // Tratamento de erro do Google Maps
  if (loadError) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#ef4444', fontSize: '1.125rem', fontWeight: '600' }}>
          Erro ao carregar Google Maps
        </p>
        <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
          Verifique sua conexão e tente novamente
        </p>
      </div>
    );
  }

  // Loading do Google Maps
  if (!isLoaded) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ 
          fontSize: '2rem',
          animation: 'spin 1s linear infinite'
        }}>
          🗺️
        </div>
        <p style={{ color: '#6b7280' }}>Carregando mapa...</p>
      </div>
    );
  }

  return (
    <>
      {/* Breadcrumb com mesmo estilo do CRUD (sem margem lateral para este componente) */}
      <div className="entity-crud-breadcrumb" style={{ margin: 0, marginBottom: '0' }}>
        <div className="breadcrumb-content">
          <div className="breadcrumb-item" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <FiHome className="breadcrumb-icon" />
            <span>Início</span>
          </div>
          <FiChevronRight className="breadcrumb-separator" />
          <div className="breadcrumb-item breadcrumb-current">
            <FaMapMarkedAlt className="breadcrumb-icon" />
            <span>Zonas Especiais</span>
          </div>
        </div>
      </div>

      {/* Container principal */}
      <div className="entity-crud-container" style={{ maxWidth: '100%', padding: 0 }}>
        <div style={{ display: 'flex', height: 'calc(100vh - 118px)', gap: 0 }}>
          {/* Mapa */}
          <div style={{ 
            flex: 1, 
            position: 'relative',
            cursor: selectedType ? 'crosshair' : 'default'
          }}>
            <GoogleMap
              mapContainerStyle={{ 
                width: '100%', 
                height: '100%',
                cursor: selectedType ? 'crosshair' : 'default'
              }}
              center={mapCenter}
              zoom={mapZoom}
              onClick={handleMapClick}
              onLoad={(map) => {
                setMapInstance(map);
              }}
              options={{
                streetViewControl: true,
                streetViewControlOptions: {
                  position: 9, // RIGHT_TOP
                },
                mapTypeControl: true,
                mapTypeControlOptions: {
                  position: 3, // TOP_RIGHT
                },
                fullscreenControl: true,
                fullscreenControlOptions: {
                  position: 7, // RIGHT_BOTTOM
                },
                zoomControl: true,
                zoomControlOptions: {
                  position: 7, // RIGHT_BOTTOM
                },
                gestureHandling: 'greedy',
              }}
            >
              {/* Círculos das zonas */}
              {circles}
            </GoogleMap>

          {/* Legenda */}
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 text-sm">
            <div className="font-semibold mb-2">Legenda</div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span>Periculosidade</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span>Alta Renda</span>
            </div>
            <div className="mt-2 pt-2 border-t text-xs text-gray-600">
              Raio ajusta-se ao zoom do mapa (20% altura)
            </div>
          </div>
        </div>

        {/* Sidebar com lista de zonas */}
        <div style={{ 
          width: '380px', 
          background: 'white', 
          borderLeft: '1px solid #e5e7eb',
          overflowY: 'auto',
          boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header fixo com botão e tabs */}
          <div style={{ 
            borderBottom: '1px solid #e5e7eb',
            background: 'white',
            flexShrink: 0
          }}>
            {/* Tabs de filtro */}
            <div style={{ 
              display: 'flex',
              borderBottom: '2px solid #f3f4f6'
            }}>
              <button
                onClick={() => setFilterTab('DANGER')}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: filterTab === 'DANGER' ? 'white' : 'transparent',
                  color: filterTab === 'DANGER' ? '#ef4444' : '#6b7280',
                  border: 'none',
                  borderBottom: filterTab === 'DANGER' ? '2px solid #ef4444' : '2px solid transparent',
                  fontSize: '0.875rem',
                  fontWeight: filterTab === 'DANGER' ? '600' : '400',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  marginBottom: '-2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.25rem'
                }}
              >
                <FaExclamationTriangle size={12} />
                Periculosidade ({zones.filter(z => z.zoneType === 'DANGER').length})
              </button>
              <button
                onClick={() => setFilterTab('HIGH_INCOME')}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: filterTab === 'HIGH_INCOME' ? 'white' : 'transparent',
                  color: filterTab === 'HIGH_INCOME' ? '#3b82f6' : '#6b7280',
                  border: 'none',
                  borderBottom: filterTab === 'HIGH_INCOME' ? '2px solid #3b82f6' : '2px solid transparent',
                  fontSize: '0.875rem',
                  fontWeight: filterTab === 'HIGH_INCOME' ? '600' : '400',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  marginBottom: '-2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.25rem'
                }}
              >
                <FaDollarSign size={12} />
                Alta Renda ({zones.filter(z => z.zoneType === 'HIGH_INCOME').length})
              </button>
            </div>
          </div>

          {/* Lista de zonas com scroll */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
            {/* Botão de inclusão específico para cada tab */}
            <div style={{ marginBottom: '1rem' }}>
              {filterTab === 'DANGER' && (
                <button
                  onClick={() => {
                    if (selectedType === 'DANGER') {
                      setSelectedType(null);
                    } else {
                      setSelectedType('DANGER');
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: selectedType === 'DANGER' 
                      ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                      : 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(239, 68, 68, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.2)';
                  }}
                >
                  <FaExclamationTriangle size={14} />
                  {selectedType === 'DANGER' ? 'Cancelar Inclusão' : 'Incluir Nova Zona de Periculosidade'}
                </button>
              )}
              {filterTab === 'HIGH_INCOME' && (
                <button
                  onClick={() => {
                    if (selectedType === 'HIGH_INCOME') {
                      setSelectedType(null);
                    } else {
                      setSelectedType('HIGH_INCOME');
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: selectedType === 'HIGH_INCOME' 
                      ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                      : 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.2)';
                  }}
                >
                  <FaDollarSign size={14} />
                  {selectedType === 'HIGH_INCOME' ? 'Cancelar Inclusão' : 'Incluir Nova Zona de Alta Renda'}
                </button>
              )}
            </div>

            {loading ? (
              <div style={{ 
                textAlign: 'center',
                padding: '3rem 0',
                color: '#6b7280'
              }}>
                Carregando...
              </div>
            ) : filteredZones.length === 0 ? (
              <div style={{ 
                textAlign: 'center',
                padding: '3rem 0',
                color: '#9ca3af'
              }}>
                <FaMapMarkedAlt style={{ 
                  fontSize: '3rem',
                  margin: '0 auto 1rem',
                  opacity: 0.3
                }} />
                <p style={{ fontWeight: '500' }}>Nenhuma zona cadastrada</p>
                <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  {selectedType ? 'Clique duplo no mapa para adicionar' : 'Selecione um tipo para começar'}
                </p>
              </div>
            ) : (
              <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                {filteredZones.map((zone) => (
                  <div
                    key={zone.id}
                    style={{
                      border: '1px solid',
                      borderColor: zone.isActive ? '#e5e7eb' : '#d1d5db',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      background: zone.isActive ? 'white' : '#f9fafb',
                      transition: 'all 0.2s',
                      cursor: 'pointer'
                    }}
                    onClick={() => setMapCenter({ lat: zone.latitude, lng: zone.longitude })}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {/* Header do card */}
                    <div style={{ 
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.5rem',
                      marginBottom: '0.75rem'
                    }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: getMarkerColor(zone.zoneType),
                        flexShrink: 0,
                        marginTop: '2px'
                      }} />
                      <span style={{ 
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        lineHeight: '1.25rem',
                        flex: 1
                      }}>
                        {zone.address || 'Sem endereço'}
                      </span>
                    </div>

                    {/* Coordenadas com botão de localização */}
                    <div style={{ 
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      marginBottom: '0.75rem',
                    }}>
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.25rem'
                      }}>
                        <button
                          onClick={(e) => focusOnZone(zone, e)}
                          style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: 'none',
                            borderRadius: '0.375rem',
                            padding: '0.375rem 0.5rem',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 4px rgba(102, 126, 234, 0.3)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(102, 126, 234, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(102, 126, 234, 0.3)';
                          }}
                          title="Centralizar e ajustar zoom"
                        >
                          <FiCrosshair style={{ fontSize: '0.875rem' }} />
                          <span>Focar</span>
                        </button>
                        <div style={{ flex: 1 }}>
                          📍 {zone.latitude.toFixed(6)}, {zone.longitude.toFixed(6)}
                        </div>
                      </div>
                      <div style={{ paddingLeft: '0.25rem' }}>
                        ⭕ Raio: {zone.radiusMeters || DEFAULT_RADIUS}m
                      </div>
                      {zone.notes && (
                        <div style={{ 
                          marginTop: '0.25rem',
                          paddingLeft: '0.25rem',
                          fontStyle: 'italic',
                          color: '#9ca3af'
                        }}>
                          💬 {zone.notes}
                        </div>
                      )}
                    </div>

                    {/* Botões de ação */}
                    <div style={{ 
                      display: 'flex',
                      gap: '0.5rem',
                      marginTop: '0.75rem'
                    }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleActive(zone);
                        }}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          border: 'none',
                          cursor: 'pointer',
                          background: zone.isActive ? '#d1fae5' : '#f3f4f6',
                          color: zone.isActive ? '#065f46' : '#374151',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = zone.isActive ? '#a7f3d0' : '#e5e7eb';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = zone.isActive ? '#d1fae5' : '#f3f4f6';
                        }}
                      >
                        {zone.isActive ? '✓ Ativa' : '○ Inativa'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          zone.id && handleDelete(zone.id);
                        }}
                        style={{
                          padding: '0.5rem 0.75rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          border: 'none',
                          cursor: 'pointer',
                          background: '#fee2e2',
                          color: '#991b1b',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#fecaca';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#fee2e2';
                        }}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </>
  );
};

export default SpecialZonesMapPage;
