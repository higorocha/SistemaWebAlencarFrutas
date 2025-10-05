# 🌱 Ícones Agrícolas - Sistema Alencar Frutas

## 📚 Bibliotecas Utilizadas

### **Iconify (Recomendado)**
- **Pacote:** `@iconify/react`
- **Coleções:** `@iconify/icons-mdi`, `@iconify/icons-healthicons`
- **Vantagens:** 200k+ ícones, carregamento sob demanda, melhor performance

### **Font Awesome (Alternativa)**
- **Pacote:** `@fortawesome/react-fontawesome`
- **Limitações:** Poucos ícones agrícolas específicos

---

## 🎯 Ícones Recomendados por Categoria

### **🌾 Agricultura Geral**
```jsx
import { Icon } from "@iconify/react";

// Agricultura principal
<Icon icon="healthicons:agriculture" />
<Icon icon="mdi:agriculture" />
<Icon icon="healthicons:agriculture-outline" />

// Fazenda e Campo
<Icon icon="mdi:farm" />
<Icon icon="mdi:field" />
<Icon icon="mdi:land-fields" />
```

### **🌱 Plantas e Culturas**
```jsx
// Plantas gerais
<Icon icon="mdi:plant" />
<Icon icon="mdi:leaf" />
<Icon icon="mdi:tree" />
<Icon icon="mdi:forest" />

// Cultivos específicos
<Icon icon="mdi:corn" />        // Milho
<Icon icon="mdi:carrot" />      // Cenoura
<Icon icon="mdi:potato" />      // Batata
<Icon icon="mdi:wheat" />       // Trigo
<Icon icon="mdi:banana" />      // Banana
<Icon icon="mdi:fruit-apple" /> // Maçã
<Icon icon="mdi:fruit" />       // Fruta genérica
<Icon icon="mdi:vegetable" />   // Vegetal
```

### **🔧 Equipamentos Agrícolas**
```jsx
// Maquinário
<Icon icon="mdi:tractor" />
<Icon icon="mdi:excavator" />
<Icon icon="mdi:dump-truck" />

// Ferramentas
<Icon icon="mdi:shovel" />
<Icon icon="mdi:rake" />
<Icon icon="mdi:hoe" />
<Icon icon="mdi:watering-can" />
<Icon icon="mdi:sprinkler" />
<Icon icon="mdi:irrigation" />
```

### **🏗️ Infraestrutura**
```jsx
// Construções
<Icon icon="mdi:barn" />
<Icon icon="mdi:greenhouse" />
<Icon icon="mdi:warehouse" />
<Icon icon="mdi:silo" />

// Armazenamento
<Icon icon="mdi:grain" />
<Icon icon="mdi:seed" />
<Icon icon="mdi:fertilizer" />
<Icon icon="mdi:pesticide" />
```

### **👥 Pessoas e Equipes**
```jsx
// Trabalhadores
<Icon icon="mdi:account-group" />
<Icon icon="healthicons:agriculture-worker-alt" />
<Icon icon="mdi:farmer" />
<Icon icon="mdi:worker" />
```

### **📊 Operações Agrícolas**
```jsx
// Processos
<Icon icon="mdi:harvest" />
<Icon icon="mdi:crop" />
<Icon icon="mdi:seed-plus" />
<Icon icon="mdi:plant-plus" />

// Monitoramento
<Icon icon="mdi:chart-line" />
<Icon icon="mdi:clipboard-list" />
<Icon icon="mdi:calendar-check" />
```

---

## 🚀 Como Usar

### **1. Instalação**
```bash
npm install @iconify/react @iconify/icons-mdi @iconify/icons-healthicons
```

### **2. Importação**
```jsx
import { Icon } from "@iconify/react";
```

### **3. Regra de Consistência** ⚠️
> **IMPORTANTE:** O ícone do título da página DEVE ser o mesmo ícone usado no menu do sidebar para manter consistência visual.

#### **✅ Exemplos de Consistência:**

**Sidebar:**
```jsx
{ 
  text: "Culturas", 
      icon: <Icon icon="mdi:seedling" style={{ fontSize: '20px' }} />,
  path: "/culturas" 
},
{ 
  text: "Frutas", 
  icon: <Icon icon="mdi:fruit-apple" style={{ fontSize: '20px' }} />, 
  path: "/frutas" 
}
```

**Páginas (mesmos ícones):**
```jsx
// Página Culturas
<Icon 
  icon="mdi:plant" 
  style={{ fontSize: isMobile ? '20px' : '24px', color: "#059669" }} 
/>

// Página Frutas
<Icon 
  icon="mdi:fruit-apple" 
  style={{ fontSize: isMobile ? '20px' : '24px', color: "#059669" }} 
/>
```

### **4. Uso Básico**
```jsx
// Ícone simples
<Icon icon="mdi:plant" />

// Com estilização
<Icon 
  icon="healthicons:agriculture" 
  style={{ 
    fontSize: '24px',
    color: '#059669',
    marginRight: '8px'
  }} 
/>

// Em componentes Ant Design
<Button 
  icon={<Icon icon="mdi:seed-plus" style={{ fontSize: '16px' }} />}
>
  Adicionar Cultura
</Button>
```

### **5. Padrões de Tamanho Estabelecidos**

#### **📏 Tamanhos Padronizados:**
```jsx
// Sidebar (20px) - Menu lateral
<Icon icon="mdi:plant" style={{ fontSize: '20px' }} />

// Títulos de Página (31px desktop / 26px mobile) - AUMENTADO 30%
<Icon 
  icon="mdi:plant" 
  style={{ 
    fontSize: isMobile ? '26px' : '31px',
    color: "#059669"
  }} 
/>

// Títulos de Página (fixo) - 31px - AUMENTADO 30%
<Icon 
  icon="mdi:store" 
  style={{ 
    fontSize: '31px',
    color: "#059669"
  }} 
/>

// Botões de Ação - Padrão PlusCircleOutlined (Ant Design)
<PlusCircleOutlined /> // Ícone padrão para botões "Adicionar/Novo"

// Cards pequenos (18px)
<Icon icon="mdi:banana" style={{ fontSize: '18px' }} />
```

#### **🎯 Regra de Consistência:**
- **Sidebar:** `20px` (fixo)
- **Títulos (Responsivos):** `31px` (desktop) / `26px` (mobile) - **+30%**
- **Títulos (Fixos):** `31px` - **+30%**
- **Botões "Adicionar/Novo":** `PlusCircleOutlined` (Ant Design)
- **Cards:** `18px` (fixo)

#### **✅ Padronização dos Botões:**
```jsx
// Padrão para todos os botões "Adicionar/Novo"
<PrimaryButton
  icon={<PlusCircleOutlined />}
  onClick={handleOpenDialog}
>
  Adicionar/Novo Item
</PrimaryButton>

// Aplicado em:
// - Clientes: "Novo Cliente"
// - Culturas: "Adicionar Cultura"  
// - Frutas: "Adicionar Fruta"
// - Áreas Agrícolas: "Adicionar Área Agrícola"
// - Fornecedores: "Novo Fornecedor"
// - Turma Colheita: "Nova Turma de Colheita"
```

---

## 🎨 Cores Recomendadas

```jsx
// Verde principal do sistema
color: '#059669'

// Verde escuro para hover
color: '#047857'

// Verde claro para backgrounds
color: '#10b981'

// Cores temáticas
color: '#22c55e'  // Verde agricultura
color: '#f59e0b'  // Amarelo colheita
color: '#ef4444'  // Vermelho alertas
```

---

## 📋 Implementação Completa - Menu Cadastro

### **✅ Implementado - Sidebar (Iconify)**
```jsx
const cadastroItems = [
  { 
    text: "Clientes", 
    icon: <Icon icon="mdi:account-group" style={{ fontSize: '20px' }} />, 
    path: "/clientes" 
  },
  { 
    text: "Culturas", 
      icon: <Icon icon="mdi:seedling" style={{ fontSize: '20px' }} />,
    path: "/culturas" 
  },
  { 
    text: "Frutas", 
      icon: <Icon icon="healthicons:fruits" style={{ fontSize: '20px' }} />,
    path: "/frutas" 
  },
  { 
    text: "Áreas Agrícolas", 
      icon: <Icon icon="mdi:map-marker" style={{ fontSize: '20px' }} />,
    path: "/areas-agricolas" 
  },
  { 
    text: "Fornecedores", 
      icon: <Icon icon="mdi:truck-delivery" style={{ fontSize: '20px' }} />,
    path: "/fornecedores" 
  },
  { 
    text: "Turma de Colheita", 
      icon: <Icon icon="game-icons:farmer" style={{ fontSize: '20px' }} />,
    path: "/turma-colheita" 
  },
];
```

### **✅ Implementado - Páginas (Consistência)**
```jsx
// Página Clientes
<Icon icon="mdi:account-group" style={{ fontSize: isMobile ? '26px' : '31px', color: "#059669" }} />

// Página Culturas  
<Icon icon="mdi:seedling" style={{ fontSize: isMobile ? '26px' : '31px', color: "#059669" }} />

// Página Frutas
<Icon icon="healthicons:fruits" style={{ fontSize: isMobile ? '26px' : '31px', color: "#059669" }} />

// Página Áreas Agrícolas
<Icon icon="mdi:map-marker" style={{ fontSize: '31px', color: "#059669" }} />

// Página Turma Colheita
<Icon icon="game-icons:farmer" style={{ fontSize: '31px', color: "#059669" }} />

// Página Fornecedores
<Icon icon="mdi:truck-delivery" style={{ fontSize: '31px', color: "#059669" }} />
```

---

## ✅ Vantagens do Iconify

1. **🎯 Específico para Agricultura:** Ícones dedicados para o setor
2. **⚡ Performance:** Carregamento sob demanda
3. **🎨 Consistência:** Design unificado
4. **📱 Responsivo:** Funciona bem em mobile
5. **🔧 Flexível:** Fácil customização de tamanho e cor
6. **📦 Bundle Size:** Tree-shaking automático

---

## 🔄 Status da Migração

### **✅ Fase 1: Menu Cadastro (Concluída)**
- ✅ **Sidebar:** Todos os ícones do menu Cadastro
- ✅ **Página Clientes:** Ícone consistente
- ✅ **Página Culturas:** Ícone consistente  
- ✅ **Página Frutas:** Ícone consistente
- ✅ **Página Áreas Agrícolas:** Ícone consistente
- ✅ **Página Turma Colheita:** Ícone consistente

### **🔄 Fase 2: Próximos Passos**
- 🔄 Menu Pedidos (Dashboard, Pedidos)
- 🔄 Menu Produção (Banana)
- 🔄 Outras páginas do sistema
- 🔄 Componentes de formulário

### **🔄 Fase 3: Otimização**
- 🔄 Remoção de dependências antigas
- 🔄 Bundle optimization
- 🔄 Documentação final

---

## 📝 Notas de Implementação

- **Compatibilidade:** Funciona com Ant Design, Material UI
- **Fallbacks:** Manter ícones antigos como backup inicial
- **Performance:** Ícones carregados apenas quando necessários
- **Acessibilidade:** Ícones SVG são screen-reader friendly
- **Temas:** Suporta modo claro/escuro automaticamente
