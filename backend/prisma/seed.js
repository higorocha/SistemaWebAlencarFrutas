const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar usuário administrador padrão
  const hashedPassword = await bcrypt.hash('123456', 10); // Senha padrão: 123456

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@alencarfrutas.com.br' },
    update: {},
    create: {
      nome: 'Administrador',
      email: 'admin@alencarfrutas.com.br',
      senha: hashedPassword,
      role: 'ADMIN',
      status: 'ATIVO',
    },
  });

  console.log('✅ Usuário administrador criado:', {
    id: adminUser.id,
    nome: adminUser.nome,
    email: adminUser.email,
    role: adminUser.role,
  });

  console.log('\n📋 Credenciais de acesso:');
  console.log('Email: admin@alencarfrutas.com');
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