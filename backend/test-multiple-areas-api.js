// Script para testar a API de criação de pedidos com múltiplas áreas e fitas
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5002';

async function testCreatePedidoWithMultipleAreas() {
  try {
    console.log('🧪 Testando criação de pedido com múltiplas áreas e fitas...\n');
    
    const pedidoData = {
      clienteId: 1, // Assumindo que existe um cliente com ID 1
      dataPrevistaColheita: '2024-03-20T00:00:00Z',
      observacoes: 'Pedido de teste com múltiplas áreas',
      frutas: [
        {
          frutaId: 1, // Assumindo que existe uma fruta com ID 1
          quantidadePrevista: 1000.0,
          unidadeMedida1: 'KG',
          unidadeMedida2: 'CX',
          areas: [
            {
              areaPropriaId: 1, // Área própria
              observacoes: 'Área principal da colheita'
            },
            {
              areaFornecedorId: 1, // Área de fornecedor (se existir)
              observacoes: 'Área do parceiro'
            }
          ],
          fitas: [
            {
              fitaBananaId: 1, // Fita (se existir)
              quantidadeFita: 500.0,
              observacoes: 'Fita vermelha premium'
            }
          ]
        }
      ]
    };

    console.log('📤 Enviando dados do pedido:');
    console.log(JSON.stringify(pedidoData, null, 2));
    console.log('\n');

    const response = await axios.post(`${API_BASE_URL}/pedidos`, pedidoData);
    
    console.log('✅ Pedido criado com sucesso!');
    console.log('📥 Resposta da API:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Erro ao criar pedido:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

async function testGetPedido(id) {
  try {
    console.log(`\n🔍 Buscando pedido com ID ${id}...`);
    
    const response = await axios.get(`${API_BASE_URL}/pedidos/${id}`);
    
    console.log('✅ Pedido encontrado!');
    console.log('📥 Estrutura retornada:');
    
    const pedido = response.data;
    console.log(`ID: ${pedido.id}`);
    console.log(`Número: ${pedido.numeroPedido}`);
    console.log(`Cliente: ${pedido.cliente?.nome}`);
    console.log(`Status: ${pedido.status}`);
    
    if (pedido.frutasPedidos && pedido.frutasPedidos.length > 0) {
      console.log('\n🍎 Frutas do pedido:');
      pedido.frutasPedidos.forEach((fp, index) => {
        console.log(`  Fruta ${index + 1}: ${fp.fruta?.nome}`);
        console.log(`  Quantidade: ${fp.quantidadePrevista} ${fp.unidadeMedida1}`);
        
        // Verificar compatibilidade
        if (fp.areaPropria || fp.areaFornecedor) {
          console.log('  ✅ Campos de compatibilidade presentes');
          console.log(`  Área própria: ${fp.areaPropria?.nome || 'N/A'}`);
          console.log(`  Área fornecedor: ${fp.areaFornecedor?.nome || 'N/A'}`);
        }
        
        // Verificar nova estrutura
        if (fp.areas && fp.areas.length > 0) {
          console.log(`  ✅ Nova estrutura: ${fp.areas.length} área(s)`);
          fp.areas.forEach((area, aIndex) => {
            console.log(`    Área ${aIndex + 1}: ${area.areaPropria?.nome || area.areaFornecedor?.nome || 'N/A'}`);
          });
        }
        
        if (fp.fitas && fp.fitas.length > 0) {
          console.log(`  ✅ Fitas: ${fp.fitas.length} fita(s)`);
          fp.fitas.forEach((fita, fIndex) => {
            console.log(`    Fita ${fIndex + 1}: ${fita.fitaBanana?.nome || 'N/A'}`);
          });
        }
        
        console.log('');
      });
    }
    
  } catch (error) {
    console.error(`❌ Erro ao buscar pedido ${id}:`, error.message);
  }
}

// Executar testes
async function runTests() {
  console.log('🚀 Iniciando testes da API de pedidos com múltiplas áreas...\n');
  
  // Primeiro, tentar criar um pedido
  await testCreatePedidoWithMultipleAreas();
  
  // Depois, buscar um pedido existente (ID 1 como exemplo)
  await testGetPedido(1);
  
  console.log('\n✨ Testes concluídos!');
}

runTests();