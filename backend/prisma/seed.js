const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar usuário administrador padrão
  const hashedPassword = await bcrypt.hash('Jhlinha054!', 10); // Senha padrão: 123456

  const adminUser = await prisma.usuario.upsert({
    where: { email: 'higorocha@alencarfrutas.com.br' },
    update: {},
    create: {
      nome: 'Administrador',
      cpf: '000.000.000-00',
      email: 'higorocha@alencarfrutas.com.br',
      senha: hashedPassword,
      nivel: 'ADMINISTRADOR',
    },
  });

  console.log('✅ Usuário administrador criado:', {
    id: adminUser.id,
    nome: adminUser.nome,
    email: adminUser.email,
    nivel: adminUser.nivel,
  });

  console.log('\n📋 Credenciais de acesso:');
  console.log('Email: admin@alencarfrutas.com.br');
  console.log('Senha: 123456');
  console.log('\n⚠️  ALTERE A SENHA APÓS O PRIMEIRO LOGIN!');

  console.log('\n🌱 Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });