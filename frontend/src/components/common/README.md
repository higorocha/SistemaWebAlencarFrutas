# Componentes Comuns Reutilizáveis

Este diretório contém componentes reutilizáveis organizados por categoria para facilitar a manutenção e reutilização.

## 📁 Estrutura de Diretórios

```
common/
├── buttons/           # Botões reutilizáveis
│   ├── HeaderButton.js
│   ├── PrimaryButton.js
│   ├── SecondaryButton.js
│   ├── ButtonStyles.css
│   └── index.js
├── inputs/            # Inputs reutilizáveis
│   ├── HectaresInput.js
│   └── index.js
├── menus/             # Menus e dropdowns
│   ├── ModernDropdownMenu.js
│   └── index.js
├── loaders/           # Componentes de carregamento
│   ├── LoadingFallback.js
│   └── index.js
├── search/            # Componentes de busca
│   ├── SearchInput.js
│   └── index.js
├── MiniComponents/    # Componentes menores especializados
│   ├── MiniInputSimples.js
│   ├── MiniInputSearchPersonalizavel.js
│   ├── MiniInputSearchWithChips.js
│   ├── MiniInputNumberSimples.js
│   ├── MiniDateInputPersonalizavel.js
│   ├── MiniRangeDateInputPersonalizavel.js
│   ├── MiniMonthYearInput.js
│   ├── MiniSelectPersonalizavel.js
│   ├── MiniTextAreaPersonalizavel.js
│   ├── MiniSearchWithFilters.js
│   └── SearchWithChips.js
├── ModernDropdownMenu.css
└── README.md
```

## 🎯 Botões Reutilizáveis

### HeaderButton
Botão especial para cabeçalhos de seções com destaque visual.
- **Estilo:** Fundo branco, bordas verdes, texto verde
- **Uso:** Exclusivo para cabeçalhos de seções
- **Hover:** Sombra suave com elevação
- **Import:** `import { HeaderButton } from '../common/buttons';`

### PrimaryButton
Botão primário padrão do sistema para ações principais.
- **Estilo:** Fundo verde escuro, texto branco, bordas da mesma cor
- **Uso:** Ações principais (Adicionar Áreas Agrícolas, Salvar, etc.)
- **Hover:** Sombra suave com elevação
- **Import:** `import { PrimaryButton } from '../common/buttons';`

### SecondaryButton
Botão secundário com estilo similar ao primário.
- **Estilo:** Mesmo fundo verde do PrimaryButton, bordas verdes claras
- **Uso:** Ações secundárias (Adicionar Culturas, Cancelar, etc.)
- **Hover:** Sombra suave com elevação
- **Import:** `import { SecondaryButton } from '../common/buttons';`

## 📝 Inputs Reutilizáveis

### HectaresInput
Input especializado para valores em hectares.
- **Formatação:** Separador de milhares, 2 casas decimais, sufixo "ha"
- **Uso:** Campos de área em hectares
- **Import:** `import { HectaresInput } from '../common/inputs';`

## 🍽️ Menus Reutilizáveis

### ModernDropdownMenu
Menu dropdown moderno e reutilizável.
- **Características:** Suporte a categorias, ícones, descrições
- **Uso:** Menus de ações em tabelas e listas
- **Import:** `import { ModernDropdownMenu } from '../common/menus';`

## ⏳ Loaders Reutilizáveis

### LoadingFallback
Componente de carregamento com suporte a modo compacto.
- **Características:** Spinner animado, mensagem customizável, modo compacto
- **Uso:** Estados de carregamento em toda aplicação
- **Import:** `import { LoadingFallback } from '../common/loaders';`

## 🔍 Componentes de Busca

### SearchInput
Input de busca com ícone e botão de limpar.
- **Características:** Placeholder customizável, botão de busca, limpeza automática
- **Uso:** Busca em listas e tabelas
- **Import:** `import { SearchInput } from '../common/search';`

## 🎛️ MiniComponents

### Componentes Especializados
Conjunto de componentes menores para casos específicos:

- **MiniInputSimples:** Input com validação e máscaras
- **MiniInputSearchPersonalizavel:** Busca personalizada
- **MiniInputSearchWithChips:** Busca com chips internos
- **MiniInputNumberSimples:** Input numérico com validação
- **MiniDateInputPersonalizavel:** Seletor de data personalizado
- **MiniRangeDateInputPersonalizavel:** Seletor de intervalo de datas
- **MiniMonthYearInput:** Seletor de mês/ano
- **MiniSelectPersonalizavel:** Select dropdown personalizado
- **MiniTextAreaPersonalizavel:** Área de texto personalizada
- **MiniSearchWithFilters:** Busca com filtros avançados
- **SearchWithChips:** Busca com chips externos

**Import:** `import ComponentName from '../common/MiniComponents/ComponentName';`

## 🎨 Tema e Cores

Todos os componentes seguem o padrão de cores definido no `theme.js`:

```javascript
// Botões
buttonPrimary: "#047857"      // Verde escuro (fundo dos botões principais)
buttonSecondary: "#10b981"    // Verde claro (hover e bordas secundárias)
buttonText: "#ffffff"         // Branco (texto dos botões)
buttonHeader: "#ffffff"       // Branco (fundo do HeaderButton)
buttonHeaderBorder: "#059669" // Verde (bordas do HeaderButton)
buttonHeaderText: "#059669"   // Verde (texto do HeaderButton)
buttonHeaderHover: "#f0fdf4" // Verde muito claro (hover do HeaderButton)

// Campos
fieldError: "#dc2626"         // Vermelho
fieldGroupBorder: "#d1fae5"  // Verde claro
```

## 📋 Exemplos de Uso

### HeaderButton
```javascript
<HeaderButton
  icon={<AimOutlined />}
  onClick={handleClick}
>
  Capturar Coordenadas
</HeaderButton>
```

### PrimaryButton (Ação Principal)
```javascript
<PrimaryButton
  icon={<PlusOutlined />}
  onClick={handleAddArea}
>
  Adicionar Área Agrícola
</PrimaryButton>
```

### SecondaryButton (Ação Secundária)
```javascript
<SecondaryButton
  icon={<PlusOutlined />}
  onClick={handleAddCulture}
>
  Adicionar Cultura
</SecondaryButton>
```

### HectaresInput
```javascript
<HectaresInput
  label="Área Total (hectares)"
  value={areaTotal}
  onChange={handleChange}
  error={errors.areaTotal}
  required
/>
```

### ModernDropdownMenu
```javascript
<ModernDropdownMenu
  record={record}
  items={menuItems}
  categories={menuCategories}
/>
```

### LoadingFallback
```javascript
<LoadingFallback 
  message="Carregando dados..." 
  compact={false} 
/>
```

### SearchInput
```javascript
<SearchInput
  placeholder="Buscar áreas..."
  value={searchQuery}
  onChange={setSearchQuery}
/>
```

## 🎨 Estilos de Hover

Todos os botões utilizam um sistema de hover simplificado via CSS:

```css
/* Hover padrão para todos os botões */
.primary-button-hover:hover,
.secondary-button-hover:hover,
.header-button-hover:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.15) !important;
  transform: translateY(-1px);
}
```

**Características:**
- **Sombra suave:** Elevação visual sem mudança de cor
- **Transição suave:** 0.3s de transição para todos os elementos
- **Sem conflitos:** CSS puro evita problemas de re-renderização
- **Consistência:** Mesmo comportamento para todos os botões

## 🔧 Manutenção

- **Novos botões:** Adicionar em `buttons/` e exportar no `index.js`
- **Novos inputs:** Adicionar em `inputs/` e exportar no `index.js`
- **Novos menus:** Adicionar em `menus/` e exportar no `index.js`
- **Novos loaders:** Adicionar em `loaders/` e exportar no `index.js`
- **Novos search:** Adicionar em `search/` e exportar no `index.js`
- **Novos MiniComponents:** Adicionar em `MiniComponents/`
- **Tema:** Sempre usar cores do `theme.palette.forms`
- **Hover:** Adicionar classes CSS em `ButtonStyles.css`
- **Documentação:** Atualizar este README ao adicionar componentes

## 🎯 Benefícios

1. **Consistência:** Todos os componentes seguem o mesmo padrão visual
2. **Reutilização:** Componentes podem ser usados em todo o sistema
3. **Manutenção:** Mudanças no tema se aplicam automaticamente
4. **Organização:** Estrutura clara e fácil de navegar
5. **Performance:** Componentes otimizados e bem estruturados
6. **Hover Simples:** Efeitos CSS puros sem conflitos de estado
7. **Categorização:** Componentes organizados por função
8. **Escalabilidade:** Fácil adição de novos componentes 