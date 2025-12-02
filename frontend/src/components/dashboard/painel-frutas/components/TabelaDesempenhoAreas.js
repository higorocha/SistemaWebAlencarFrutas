import React, { useState } from 'react';
import { List, Progress, Tooltip, Select, Avatar, Typography, Empty } from 'antd';
import { getFruitIconPath } from '../../../../utils/fruitIcons';
import { EnvironmentOutlined, UserOutlined } from '@ant-design/icons';
import { capitalizeName, formataLeitura } from '../../../../utils/formatters';

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

const TabelaDesempenhoAreas = ({ frutas, mediaGeral, unidade, culturaIcon }) => {
  const [frutaSelecionada, setFrutaSelecionada] = useState('Todas');

  const getDadosTabela = () => {
    let todasAreas = [];
    
    if (frutaSelecionada === 'Todas') {
      const mapa = new Map();
      frutas.forEach(f => {
        f.areas.forEach(a => {
          const id = `${a.nome}-${a.tipo}`;
          if (!mapa.has(id)) mapa.set(id, { ...a, totalColhido: 0 });
          mapa.get(id).totalColhido += a.totalColhido;
        });
      });
      todasAreas = Array.from(mapa.values());
    } else {
      const fruta = frutas.find(f => f.nome === frutaSelecionada);
      todasAreas = fruta ? fruta.areas : [];
    }

    return todasAreas.map((a) => ({
      ...a,
      produtividade: a.tamanhoHa > 0 ? (a.totalColhido / a.tamanhoHa) : 0
    })).sort((a, b) => b.produtividade - a.produtividade);
  };

  const dataSource = getDadosTabela();

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Seletor Estilizado */}
      <div style={{ marginBottom: 12, borderBottom: '1px solid #f0f0f0', paddingBottom: 12 }}>
        <Select 
          value={frutaSelecionada} 
          onChange={setFrutaSelecionada} 
          style={{ width: '100%' }}
          bordered={false}
          className="custom-select-fruta"
        >
          <Select.Option value="Todas">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <SafeAvatar size={20} src="/icons/frutas_64x64.png" shape="square" /> 
              <span style={{ fontWeight: 500 }}>Todas as Frutas</span>
            </div>
          </Select.Option>
          {frutas.map(f => (
            <Select.Option key={f.id} value={f.nome}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SafeAvatar size={20} src={culturaIcon || getFruitIconPath(f.nome)} /> 
                <span>{capitalizeName(f.nome)}</span>
              </div>
            </Select.Option>
          ))}
        </Select>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', maxHeight: '300px' }}>
        {dataSource.length === 0 ? (
          <Empty description="Sem dados de área" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={dataSource}
            split={false}
            renderItem={item => {
              const percentual = mediaGeral > 0 ? (item.produtividade / mediaGeral) * 100 : 0;
              // Cores baseadas no desempenho (usando tons de verde para consistência)
              let statusColor = '#f59e0b'; // Médio (Amber, não vermelho)
              if (percentual >= 100) statusColor = '#059669'; // Bom (Verde principal)
              if (percentual < 60) statusColor = '#dc2626'; // Ruim (Vermelho, mas mais escuro)

              return (
                <List.Item style={{ 
                  padding: '12px', 
                  marginBottom: 8, 
                  background: '#fafafa', 
                  borderRadius: 8,
                  border: '1px solid #f0f0f0' 
                }}>
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text strong style={{ color: '#333' }}>
                        {item.tipo === 'Propria' ? <EnvironmentOutlined style={{ marginRight: 6, color: '#059669' }} /> : <UserOutlined style={{ marginRight: 6, color: '#888' }} />}
                        {item.nome}
                      </Text>
                      <Text strong style={{ color: '#333' }}>
                        {formataLeitura ? formataLeitura(item.totalColhido) : item.totalColhido.toLocaleString('pt-BR')} {unidade}
                      </Text>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 6 }}>
                      <span>{item.tamanhoHa} hectares</span>
                      <span>Eficiência: {percentual.toFixed(0)}% da média</span>
                    </div>

                    <Tooltip title={`Produtividade: ${formataLeitura ? formataLeitura(Math.round(item.produtividade)) : item.produtividade.toFixed(0)} ${unidade}/ha (Média da Cultura: ${formataLeitura ? formataLeitura(Math.round(mediaGeral)) : mediaGeral.toFixed(0)})`}>
                      <Progress 
                        percent={Math.min(percentual, 100)} 
                        strokeColor={statusColor} 
                        showInfo={false} 
                        size="small" 
                        strokeWidth={8}
                        trailColor="#e2e8f0"
                      />
                    </Tooltip>
                    <div style={{ textAlign: 'right', marginTop: 2 }}>
                      <Text style={{ fontSize: 10, color: statusColor, fontWeight: 600 }}>
                        {formataLeitura ? formataLeitura(Math.round(item.produtividade)) : item.produtividade.toFixed(0)} {unidade}/ha
                      </Text>
                    </div>
                  </div>
                </List.Item>
              );
            }}
          />
        )}
      </div>
    </div>
  );
};

export default TabelaDesempenhoAreas;
