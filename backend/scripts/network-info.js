#!/usr/bin/env node

const os = require('os');

// Função para detectar automaticamente o IP da rede local
function getLocalNetworkIP() {
  const interfaces = os.networkInterfaces();
  
  // Priorizar interfaces ativas (WiFi, Ethernet)
  const priorityInterfaces = ['Wi-Fi', 'Ethernet', 'en0', 'eth0'];
  
  for (const interfaceName of priorityInterfaces) {
    const networkInterface = interfaces[interfaceName];
    if (networkInterface) {
      for (const alias of networkInterface) {
        if (alias.family === 'IPv4' && !alias.internal) {
          return { ip: alias.address, interface: interfaceName };
        }
      }
    }
  }
  
  // Fallback: buscar qualquer interface IPv4 não-interna
  for (const interfaceName in interfaces) {
    const networkInterface = interfaces[interfaceName];
    if (networkInterface) {
      for (const alias of networkInterface) {
        if (alias.family === 'IPv4' && !alias.internal) {
          return { ip: alias.address, interface: interfaceName };
        }
      }
    }
  }
  
  return { ip: 'localhost', interface: 'fallback' };
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  const networkInfo = getLocalNetworkIP();
  const port = process.env.PORT || 5002;
  const frontendPort = 3002;
  
  console.log('\n🌐 === INFORMAÇÕES DE REDE ===');
  console.log(`📡 Interface: ${networkInfo.interface}`);
  console.log(`🔢 IP da Rede: ${networkInfo.ip}`);
  console.log(`\n📱 === URLs DE ACESSO ===`);
  console.log(`🏠 Local (este computador):`);
  console.log(`   Frontend: http://localhost:${frontendPort}`);
  console.log(`   Backend:  http://localhost:${port}`);
  console.log(`\n🌐 Rede Local (outros dispositivos):`);
  console.log(`   Frontend: http://${networkInfo.ip}:${frontendPort}`);
  console.log(`   Backend:  http://${networkInfo.ip}:${port}`);
  console.log(`   API Docs: http://${networkInfo.ip}:${port}/api`);
  console.log('\n💡 Para acessar de outros dispositivos na mesma rede:');
  console.log(`   Use: http://${networkInfo.ip}:${frontendPort}`);
  console.log('\n');
}

module.exports = { getLocalNetworkIP };
