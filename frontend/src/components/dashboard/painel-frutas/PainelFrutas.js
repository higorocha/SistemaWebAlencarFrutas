// src/components/dashboard/painel-frutas/PainelFrutas.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Row, Col, Card, Button, Select, Spin, Empty, Typography, Space, Tooltip, Avatar, Tag } from 'antd';
import { ReloadOutlined, FilterOutlined, ClearOutlined, CloseOutlined, UserOutlined, EnvironmentOutlined } from '@ant-design/icons';
import axiosInstance from '../../../api/axiosConfig';
import SecaoCultura from './components/SecaoCultura';
import moment from '../../../config/momentConfig';
import { getCulturaIconPath } from '../../../utils/fruitIcons';
import { useClientesCache } from '../../../hooks/useClientesCache';
import { capitalizeNameShort, capitalizeName } from '../../../utils/formatters';
import './PainelFrutas.css';

const { Option } = Select;
const { Text } = Typography;

// Componente auxiliar para Avatar com tratamento de erro seguro
const SafeAvatar = ({ src, size, ...props }) => {
  const [imgSrc, setImgSrc] = useState(src);
  
  const handleError = () => {
    setImgSrc('/icons/frutas_64x64.png');
  };

  return (
    <Avatar 
      src={imgSrc} 
      size={size}
      onError={handleError}
      {...props}
    />
  );
};

const PainelFrutas = () => {
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState([]);
  const [culturaFiltro, setCulturaFiltro] = useState([]); // Array para múltipla seleção
  const [clienteFiltro, setClienteFiltro] = useState([]); // Array para múltipla seleção
  const [areaFiltro, setAreaFiltro] = useState([]); // Array para múltipla seleção de Áreas
  const [clienteSelectOpen, setClienteSelectOpen] = useState(false); // Estado para rastrear se o select de clientes está aberto
  const [culturaSelectOpen, setCulturaSelectOpen] = useState(false); // Estado para rastrear se o select de culturas está aberto
  const [areaSelectOpen, setAreaSelectOpen] = useState(false); // Estado para rastrear se o select de áreas está aberto

  // Hook para cache de clientes com localStorage
  const { clientes, loading: loadingClientes, carregarClientes, invalidateCache: invalidateClientesCache } = useClientesCache();

  // Estado para períodos disponíveis (compartilhado entre todas as seções)
  const [periodosDisponiveis, setPeriodosDisponiveis] = useState({ 
    anos: [], 
    mesesPorAno: {} 
  });

  // Ref para debounce
  const debounceTimerRef = useRef(null);

  // Função para buscar dados com filtros
  const fetchDados = useCallback(async (forceReload = false) => {
    // Limpar timer anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce de 400ms para evitar muitas requisições
    debounceTimerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        // Preparar parâmetros para o backend
        const params = {};
        if (clienteFiltro.length > 0) {
          params.clienteIds = clienteFiltro.join(',');
        }
        // Sempre passar meses=12 como padrão quando não há filtro específico
        params.meses = 12;
        
        // Busca dados com filtros aplicados
        const response = await axiosInstance.get('/api/dashboard/painel-frutas', { params });
        
        // O backend retorna { dados, periodosDisponiveis }
        const dadosRecebidos = response.data.dados || response.data; // Compatibilidade: se não vier no novo formato, usa o antigo
        
        // LOG: Dados recebidos da API no comportamento inicial
        console.log('[PainelFrutas] Dados recebidos da API:', JSON.stringify(dadosRecebidos, null, 2));
        console.log('[PainelFrutas] Parâmetros da requisição:', JSON.stringify(params, null, 2));
        
        setDados(dadosRecebidos);
        
        // Atualizar períodos disponíveis se vierem na resposta
        if (response.data.periodosDisponiveis) {
          setPeriodosDisponiveis({
            anos: response.data.periodosDisponiveis.anos || [],
            mesesPorAno: response.data.periodosDisponiveis.mesesPorAno || {}
          });
        }
      } catch (error) {
        console.error('[PainelFrutas] Erro ao buscar dados:', error);
      } finally {
        setLoading(false);
      }
    }, forceReload ? 0 : 400); // Sem debounce se for reload forçado
  }, [clienteFiltro]);

  // Carregar dados iniciais e clientes
  useEffect(() => {
    fetchDados(true); // Carregar imediatamente na montagem
    carregarClientes(); // Carregar clientes do cache ou API

    // Cleanup: limpar timer ao desmontar
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []); // Carrega apenas uma vez na montagem

  // Recarregar dados quando filtros de cliente mudarem
  useEffect(() => {
    // Só recarregar se clientes já foram carregados e não for o carregamento inicial
    if (clientes.length > 0) {
      fetchDados();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteFiltro]); // Apenas clienteFiltro como dependência para evitar loops

  // Extrair todas as áreas únicas dos dados carregados
  const getTodasAreas = useCallback(() => {
    if (!dados || dados.length === 0) return [];
    
    const areasMap = new Map();
    
    dados.forEach(cultura => {
      if (cultura.frutas) {
        cultura.frutas.forEach(fruta => {
          if (fruta.areas) {
            fruta.areas.forEach(area => {
              // Criar uma chave única e objeto para a área
              // Usamos o nome da área como valor para o filtro
              const areaNome = area.nome;
              if (areaNome && !areasMap.has(areaNome)) {
                areasMap.set(areaNome, {
                  nome: areaNome,
                  tipo: area.tipo
                });
              }
            });
          }
        });
      }
    });
    
    return Array.from(areasMap.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [dados]);

  const todasAreas = getTodasAreas();

  // Filtrar culturas baseado no select (múltipla seleção) e filtro de áreas
  // Nota: O filtro de clientes já é aplicado no backend via fetchDados
  // O filtro de culturas e áreas é aplicado no frontend após receber os dados
  const culturasFiltradas = dados.filter(c => {
    // 1. Filtrar por Cultura ID (se houver seleção)
    const matchCultura = culturaFiltro.length > 0 ? culturaFiltro.includes(c.culturaId) : true;
    
    // 2. Filtrar por Área (se houver seleção)
    // Verifica se a cultura possui alguma das áreas selecionadas
    const matchArea = areaFiltro.length > 0 
      ? c.frutas.some(f => 
          f.areas && f.areas.some(a => areaFiltro.includes(a.nome))
        )
      : true;

    return matchCultura && matchArea;
  });

  // Obter culturas selecionadas para exibir nos chips
  const culturasSelecionadas = dados.filter(c => culturaFiltro.includes(c.culturaId));

  // Obter clientes selecionados para exibir nos chips
  const clientesSelecionados = clientes.filter(c => clienteFiltro.includes(c.id));
  
  // Obter áreas selecionadas para exibir nos chips
  const areasSelecionadas = todasAreas.filter(a => areaFiltro.includes(a.nome));

  // Função para remover uma cultura do filtro
  const removerCulturaFiltro = (culturaId) => {
    setCulturaFiltro(prev => prev.filter(id => id !== culturaId));
  };

  // Função para remover um cliente do filtro
  const removerClienteFiltro = (clienteId) => {
    setClienteFiltro(prev => prev.filter(id => id !== clienteId));
  };

  // Função para remover uma área do filtro
  const removerAreaFiltro = (areaNome) => {
    setAreaFiltro(prev => prev.filter(nome => nome !== areaNome));
  };

  // Função para limpar todos os filtros
  const limparFiltros = () => {
    setCulturaFiltro([]);
    setClienteFiltro([]);
    setAreaFiltro([]);
  };

  // Função para atualizar dados forçando reload
  const handleAtualizarDados = () => {
    invalidateClientesCache(); // Limpar cache de clientes
    carregarClientes(true); // Forçar reload de clientes
    fetchDados(true); // Forçar reload de dados (sem debounce)
  };

  // Custom render para esconder os chips dentro do select (manter visual limpo)
  const tagRender = (props) => {
    // Não renderizar tags dentro do select, vamos mostrar em chips separados abaixo
    return null;
  };

  // Valor exibido no select quando há seleções (sempre retorna o array para manter o estado)
  const getSelectDisplayValue = () => {
    return culturaFiltro;
  };

  // Texto do placeholder baseado no estado (culturas)
  const getPlaceholderTextCulturas = () => {
    if (culturaFiltro.length === 0) {
      return 'Todas as Culturas';
    }
    return 'Selecione...';
  };

  // Texto do placeholder baseado no estado (clientes)
  const getPlaceholderTextClientes = () => {
    if (clienteFiltro.length === 0) {
      return 'Todos os Clientes';
    }
    return 'Selecione...';
  };
  
  // Texto do placeholder baseado no estado (áreas)
  const getPlaceholderTextArea = () => {
    if (areaFiltro.length === 0) {
      return 'Todas as Áreas';
    }
    return 'Selecione...';
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-in-out', padding: '24px' }}>
      {/* Barra de Controle Refinada */}
      <Card 
        bordered={false} 
        style={{ 
          marginBottom: 24, 
          borderRadius: 12, 
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)' 
        }}
        styles={{ body: { padding: '16px 24px' } }}
      >
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} md={18}>
            <Space size="large" wrap>
              <Space align="center">
                <FilterOutlined style={{ color: '#059669', fontSize: 18 }} />
                <Text strong style={{ fontSize: 16 }}>Filtros:</Text>
              </Space>
              
              {/* Select de Clientes */}
              <div style={{ position: 'relative', width: 220 }}>
                <Select 
                  mode="multiple"
                  value={clienteFiltro}
                  onChange={setClienteFiltro}
                  placeholder=" "
                  style={{ width: '100%', borderBottom: '1px solid #d9d9d9' }}
                  variant="borderless"
                  showSearch
                  optionLabelProp="label"
                  tagRender={tagRender}
                  maxTagCount={0}
                  loading={loadingClientes}
                  open={clienteSelectOpen}
                  onDropdownVisibleChange={setClienteSelectOpen}
                  onSearch={() => {}} 
                  filterOption={(input, option) => {
                    const cliente = clientes.find(c => c.id === option.value);
                    if (cliente) {
                      const nome = capitalizeNameShort(cliente.nome || cliente.razaoSocial || '').toLowerCase();
                      const razao = capitalizeNameShort(cliente.razaoSocial || cliente.nome || '').toLowerCase();
                      const busca = input.toLowerCase();
                      return nome.includes(busca) || razao.includes(busca);
                    }
                    return false;
                  }}
                  className="painel-frutas-select"
                  popupClassName="painel-frutas-select-dropdown"
                >
                {clientes.map((cliente) => {
                  const nomeFormatado = capitalizeNameShort(cliente.nome || cliente.razaoSocial || `Cliente #${cliente.id}`);
                  return (
                    <Option 
                      key={cliente.id} 
                      value={cliente.id}
                      label={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Avatar size={20} icon={<UserOutlined />} style={{ backgroundColor: '#059669' }} /> 
                          <span>{nomeFormatado}</span>
                        </div>
                      }
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar size={20} icon={<UserOutlined />} style={{ backgroundColor: '#059669' }} /> 
                        <span>{nomeFormatado}</span>
                      </div>
                    </Option>
                  );
                })}
                </Select>
                {!clienteSelectOpen && (
                  <div className="painel-frutas-placeholder">
                    <Avatar 
                      size={24} 
                      icon={<UserOutlined />} 
                      style={{ 
                        backgroundColor: '#059669', 
                        flexShrink: 0,
                        color: '#ffffff'
                      }} 
                    /> 
                    <span>
                      {getPlaceholderTextClientes()}
                    </span>
                  </div>
                )}
              </div>

              {/* Select de Áreas (NOVO) */}
              <div style={{ position: 'relative', width: 300 }}>
                <Select 
                  mode="multiple"
                  value={areaFiltro}
                  onChange={setAreaFiltro}
                  placeholder=" "
                  style={{ width: '100%', borderBottom: '1px solid #d9d9d9' }}
                  variant="borderless"
                  showSearch
                  optionLabelProp="label"
                  tagRender={tagRender}
                  maxTagCount={0}
                  open={areaSelectOpen}
                  onDropdownVisibleChange={setAreaSelectOpen}
                  onSearch={() => {}}
                  filterOption={(input, option) => {
                    return String(option.value).toLowerCase().includes(input.toLowerCase());
                  }}
                  className="painel-frutas-select"
                  popupClassName="painel-frutas-select-dropdown"
                >
                {todasAreas.map((area) => (
                  <Option 
                    key={area.nome} 
                    value={area.nome}
                    label={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar size={20} icon={<EnvironmentOutlined />} style={{ backgroundColor: '#059669' }} /> 
                        <span>{capitalizeName(area.nome)}</span>
                      </div>
                    }
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar size={20} icon={<EnvironmentOutlined />} style={{ backgroundColor: '#059669' }} /> 
                      <span>{capitalizeName(area.nome)}</span>
                      {area.tipo && (
                        <Text type="secondary" style={{ fontSize: 11, marginLeft: 'auto' }}>
                          ({area.tipo})
                        </Text>
                      )}
                    </div>
                  </Option>
                ))}
                </Select>
                {!areaSelectOpen && (
                  <div className="painel-frutas-placeholder">
                    <Avatar 
                      size={24} 
                      icon={<EnvironmentOutlined />} 
                      style={{ 
                        backgroundColor: '#059669', 
                        flexShrink: 0,
                        color: '#ffffff'
                      }} 
                    /> 
                    <span>
                      {getPlaceholderTextArea()}
                    </span>
                  </div>
                )}
              </div>

              {/* Select de Culturas */}
              <div style={{ position: 'relative', width: 220 }}>
                <Select 
                  mode="multiple"
                  value={getSelectDisplayValue()}
                  onChange={setCulturaFiltro}
                  placeholder=" "
                  style={{ width: '100%', borderBottom: '1px solid #d9d9d9' }}
                  variant="borderless"
                  showSearch
                  optionLabelProp="label"
                  tagRender={tagRender}
                  maxTagCount={0}
                  open={culturaSelectOpen}
                  onDropdownVisibleChange={setCulturaSelectOpen}
                  onSearch={() => {}} // Previne comportamento padrão, mas permite busca
                  filterOption={(input, option) => {
                    // Busca pelo nome da cultura no texto da opção
                    const cultura = dados.find(c => c.culturaId === option.value);
                    if (cultura) {
                      return cultura.cultura.toLowerCase().includes(input.toLowerCase());
                    }
                    return false;
                  }}
                  className="painel-frutas-select"
                  popupClassName="painel-frutas-select-dropdown"
                >
                {dados.map((cultura) => (
                  <Option 
                    key={cultura.culturaId} 
                    value={cultura.culturaId}
                    label={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <SafeAvatar size={20} src={getCulturaIconPath(cultura.cultura)} /> 
                        <span>{cultura.cultura}</span>
                      </div>
                    }
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <SafeAvatar size={20} src={getCulturaIconPath(cultura.cultura)} /> 
                      <span>{cultura.cultura}</span>
                    </div>
                  </Option>
                ))}
                </Select>
                {/* Placeholder customizado - escondido quando select está aberto ou há busca */}
                {!culturaSelectOpen && (
                  <div className="painel-frutas-placeholder">
                    <SafeAvatar size={24} src="/icons/frutas_64x64.png" shape="square" style={{ flexShrink: 0 }} /> 
                    <span>
                      {getPlaceholderTextCulturas()}
                    </span>
                  </div>
                )}
              </div>

              {(culturaFiltro.length > 0 || clienteFiltro.length > 0 || areaFiltro.length > 0) && (
                <Tooltip title="Limpar todos os filtros">
                  <Button 
                    type="text" 
                    icon={<ClearOutlined />} 
                    onClick={limparFiltros}
                    danger
                  >
                    Limpar
                  </Button>
                </Tooltip>
              )}
            </Space>
            
            {/* Linha de Filtros Aplicados com Chips */}
            {(culturaFiltro.length > 0 || clienteFiltro.length > 0 || areaFiltro.length > 0) && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
                <Space size={[8, 8]} wrap>
                  <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                    Filtros aplicados:
                  </Text>
                  {/* Chips de Clientes */}
                  {clientesSelecionados.map((cliente) => (
                    <Tag
                      key={`cliente-${cliente.id}`}
                      closable
                      onClose={(e) => {
                        e.preventDefault();
                        removerClienteFiltro(cliente.id);
                      }}
                      closeIcon={<CloseOutlined style={{ fontSize: 12 }} />}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '4px 8px',
                        borderRadius: 6,
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        color: '#166534',
                        fontSize: 13,
                        fontWeight: 500
                      }}
                    >
                      <Avatar size={16} icon={<UserOutlined />} style={{ backgroundColor: '#059669', color: '#ffffff' }} />
                      {capitalizeNameShort(cliente.nome || cliente.razaoSocial || `Cliente #${cliente.id}`)}
                    </Tag>
                  ))}
                  {/* Chips de Áreas */}
                  {areasSelecionadas.map((area) => (
                    <Tag
                      key={`area-${area.nome}`}
                      closable
                      onClose={(e) => {
                        e.preventDefault();
                        removerAreaFiltro(area.nome);
                      }}
                      closeIcon={<CloseOutlined style={{ fontSize: 12 }} />}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '4px 8px',
                        borderRadius: 6,
                        backgroundColor: '#ecfeff', // Um ciano bem claro para diferenciar
                        border: '1px solid #a5f3fc',
                        color: '#0891b2',
                        fontSize: 13,
                        fontWeight: 500
                      }}
                    >
                      <Avatar size={16} icon={<EnvironmentOutlined />} style={{ backgroundColor: '#06b6d4', color: '#ffffff' }} />
                      {capitalizeName(area.nome)}
                    </Tag>
                  ))}
                  {/* Chips de Culturas */}
                  {culturasSelecionadas.map((cultura) => (
                    <Tag
                      key={cultura.culturaId}
                      closable
                      onClose={(e) => {
                        e.preventDefault();
                        removerCulturaFiltro(cultura.culturaId);
                      }}
                      closeIcon={<CloseOutlined style={{ fontSize: 12 }} />}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '4px 8px',
                        borderRadius: 6,
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        color: '#166534',
                        fontSize: 13,
                        fontWeight: 500
                      }}
                    >
                      <SafeAvatar size={16} src={getCulturaIconPath(cultura.cultura)} shape="square" />
                      {cultura.cultura}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}
          </Col>

          <Col xs={24} md={6} style={{ textAlign: 'right' }}>
            <Button 
              type="primary"
              icon={<ReloadOutlined />} 
              onClick={handleAtualizarDados} 
              loading={loading || loadingClientes}
              style={{ borderRadius: 6, fontWeight: 500, backgroundColor: '#059669', borderColor: '#059669' }}
            >
              Atualizar Dados
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Conteúdo */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: '#666' }}>
            <Text type="secondary">Processando colheitas...</Text>
          </div>
        </div>
      ) : dados.length === 0 ? (
        <Empty 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
          description={
            <div style={{ color: '#888' }}>
              <Text strong>Nenhum dado encontrado.</Text>
              <br/>
              Tente ajustar os filtros ou registre novas colheitas.
            </div>
          } 
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {culturasFiltradas.map((cultura) => (
            <SecaoCultura 
              key={cultura.culturaId} 
              culturaId={cultura.culturaId}
              dadosIniciais={cultura}
              periodosDisponiveis={periodosDisponiveis}
              filtroAreas={areaFiltro} // Passando o filtro de áreas para o componente filho
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PainelFrutas;
