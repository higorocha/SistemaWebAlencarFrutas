# 📋 Plano de Implementação - Painel de Frutas

## 🎯 Objetivo
Criar um painel analítico completo para visualização de dados de colheita, agrupados por culturas, frutas e áreas agrícolas.

---

## 📊 Estrutura de Dados (Schema Analysis)

### Relacionamentos Principais:
- **Cultura** → **Fruta** (1:N)
- **Fruta** → **FrutasPedidos** (1:N)
- **FrutasPedidos** → **FrutasPedidosAreas** (1:N)
- **FrutasPedidosAreas** → **AreaAgricola** OU **AreaFornecedor** (polimórfico)
- **Pedido** → **dataColheita** (DateTime?) - data da colheita realizada

### Campos Importantes:
- `FrutasPedidos.unidadePrecificada` - UnidadeMedida (KG, CX, TON, UND, ML, LT)
- `FrutasPedidos.quantidadePrecificada` - Quantidade na unidade precificada
- `FrutasPedidosAreas.quantidadeColhidaUnidade1` - Quantidade colhida
- `AreaAgricola.areaTotal` - Tamanho da área em hectares
- `AreaFornecedor.quantidadeHa` - Tamanho da área em hectares
- `Pedido.dataColheita` - Data da colheita (para filtros)

---

## 🏗️ Arquitetura de Componentes

### Estrutura de Pastas:
```
components/dashboard/painel-frutas/
├── index.js                          # Export principal
├── PainelFrutas.js                   # Componente container principal
├── sections/
│   ├── GraficoCulturasFrutas.js      # Seção 1: Gráfico Culturas/Frutas
│   ├── GraficoAreasFrutas.js         # Seção 2: Gráfico Áreas/Frutas
│   └── ListagemAreas.js              # Seção 3: Listagem de Áreas
├── components/
│   ├── ToggleTipoVisualizacao.js     # Toggle Culturas/Frutas
│   ├── ListaSelecaoItens.js          # Lista para adicionar/remover do gráfico
│   ├── ToggleTipoArea.js             # Toggle Áreas Próprias/Fornecedores
│   └── FiltrosListagemAreas.js       # Filtros da seção 3
└── hooks/
    ├── useDadosCulturasFrutas.js      # Hook para dados da seção 1
    ├── useDadosAreasFrutas.js         # Hook para dados da seção 2
    └── useDadosListagemAreas.js       # Hook para dados da seção 3
```

---

## 📦 Seção 1: Gráfico Culturas/Frutas

### Funcionalidades:
1. **Toggle de Tipo**: Culturas OU Frutas
2. **Gráfico de Linhas**: Evolução temporal agrupada por `unidadePrecificada`
3. **Lista Lateral**: 
   - Se Culturas: lista todas as culturas (com checkbox)
   - Se Frutas: lista todas as frutas (com checkbox)
   - Permite adicionar/remover do gráfico
4. **Agrupamento**: Sempre por `unidadePrecificada` (KG, CX, TON, etc)

### Dados Necessários:
- **Endpoint**: Criar novo endpoint `/api/painel-frutas/culturas-frutas`
- **Query Params**: 
  - `tipo`: 'culturas' | 'frutas'
  - `ids`: string[] (IDs selecionados)
  - `dataInicio`: ISO string
  - `dataFim`: ISO string
- **Response**: 
  ```json
  {
    "periodos": ["2024-01", "2024-02", ...],
    "series": [
      {
        "nome": "Banana",
        "unidadePrecificada": "KG",
        "dados": [100, 150, 200, ...]
      }
    ]
  }
  ```

### Componentes:
- `GraficoCulturasFrutas.js` - Container principal
- `ToggleTipoVisualizacao.js` - Toggle Culturas/Frutas
- `ListaSelecaoItens.js` - Lista com checkboxes

### Biblioteca de Gráficos:
- **Recharts** (já usado no Dashboard) - `LineChart`, `Line`, `XAxis`, `YAxis`, `Tooltip`, `Legend`, `ResponsiveContainer`

---

## 📦 Seção 2: Gráfico Áreas e Frutas

### Funcionalidades:
1. **Toggle de Tipo de Área**: Áreas Próprias OU Áreas de Fornecedores
2. **Seleção de Frutas**: Multi-select de frutas
3. **Gráfico de Linhas**: Total colhido da fruta na área naquele mês
4. **Agrupamento**: Por área + fruta + mês

### Dados Necessários:
- **Endpoint**: Criar novo endpoint `/api/painel-frutas/areas-frutas`
- **Query Params**:
  - `tipoArea`: 'proprias' | 'fornecedores'
  - `frutaIds`: number[] (IDs das frutas selecionadas)
  - `dataInicio`: ISO string
  - `dataFim`: ISO string
- **Response**:
  ```json
  {
    "periodos": ["2024-01", "2024-02", ...],
    "series": [
      {
        "areaNome": "Área 1",
        "frutaNome": "Banana",
        "dados": [500, 600, 700, ...]
      }
    ]
  }
  ```

### Componentes:
- `GraficoAreasFrutas.js` - Container principal
- `ToggleTipoArea.js` - Toggle Áreas Próprias/Fornecedores
- `SelectFrutas.js` - Multi-select de frutas

---

## 📦 Seção 3: Listagem de Áreas

### Funcionalidades:
1. **Cards Colapsáveis**: Cada área em um card (Collapse do Ant Design)
2. **Conteúdo Expandido**: 
   - Lista de todas as frutas colhidas naquela área
   - Média por hectare: `quantidadeColhida / tamanhoArea`
3. **Filtros no Topo**:
   - Busca por nome da área
   - Multi-select de frutas
   - Range Date para data de colheita (usando `Pedido.dataColheita`)

### Dados Necessários:
- **Endpoint**: Criar novo endpoint `/api/painel-frutas/listagem-areas`
- **Query Params**:
  - `busca`: string (nome da área)
  - `frutaIds`: number[] (IDs das frutas)
  - `dataInicio`: ISO string
  - `dataFim`: ISO string
- **Response**:
  ```json
  {
    "areas": [
      {
        "id": 1,
        "nome": "Área 1",
        "tipo": "propria" | "fornecedor",
        "tamanhoHa": 10.5,
        "frutas": [
          {
            "frutaId": 1,
            "frutaNome": "Banana",
            "quantidadeColhida": 5000,
            "unidade": "KG",
            "mediaPorHectare": 476.19
          }
        ]
      }
    ]
  }
  ```

### Componentes:
- `ListagemAreas.js` - Container principal
- `FiltrosListagemAreas.js` - Componente de filtros
- `CardArea.js` - Card individual de área (colapsável)

---

## 🎨 Design e Layout

### Layout Geral:
```
┌─────────────────────────────────────────┐
│  Seção 1: Gráfico Culturas/Frutas      │
│  [Toggle] [Gráfico] | [Lista Seleção]  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Seção 2: Gráfico Áreas e Frutas       │
│  [Toggle Áreas] [Select Frutas]        │
│  [Gráfico de Linhas]                    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Seção 3: Listagem de Áreas            │
│  [Filtros: Busca | Frutas | Datas]     │
│  [Card Área 1] [Card Área 2] ...       │
└─────────────────────────────────────────┘
```

### Estilo:
- Usar `Card` do Ant Design para cada seção
- Altura consistente com outras seções do Dashboard (612px desktop, 432px mobile)
- Cores: Verde (#059669) para elementos principais
- Responsivo: Mobile-first

---

## 🔧 Implementação Técnica

### Bibliotecas:
- **Recharts**: Gráficos de linhas (já instalado)
- **Ant Design**: Componentes UI (já instalado)
- **Moment.js**: Manipulação de datas (já instalado)

### Hooks Customizados:
1. `useDadosCulturasFrutas` - Gerencia estado e fetch da seção 1
2. `useDadosAreasFrutas` - Gerencia estado e fetch da seção 2
3. `useDadosListagemAreas` - Gerencia estado e fetch da seção 3

### Estados Principais:
```javascript
// Seção 1
const [tipoVisualizacao, setTipoVisualizacao] = useState('frutas'); // 'culturas' | 'frutas'
const [itensSelecionados, setItensSelecionados] = useState([]); // IDs selecionados
const [dadosGrafico, setDadosGrafico] = useState(null);

// Seção 2
const [tipoArea, setTipoArea] = useState('proprias'); // 'proprias' | 'fornecedores'
const [frutasSelecionadas, setFrutasSelecionadas] = useState([]);
const [dadosGraficoAreas, setDadosGraficoAreas] = useState(null);

// Seção 3
const [filtros, setFiltros] = useState({
  busca: '',
  frutas: [],
  dataInicio: null,
  dataFim: null
});
const [areas, setAreas] = useState([]);
```

---

## 📝 Ordem de Implementação

### Fase 1: Estrutura Base
1. ✅ Criar estrutura de pastas
2. ✅ Criar componente `PainelFrutas.js` principal
3. ✅ Integrar no Dashboard.js (já feito)

### Fase 2: Seção 1 - Gráfico Culturas/Frutas
1. Criar componente `GraficoCulturasFrutas.js`
2. Criar `ToggleTipoVisualizacao.js`
3. Criar `ListaSelecaoItens.js`
4. Criar hook `useDadosCulturasFrutas.js`
5. Criar endpoint backend `/api/painel-frutas/culturas-frutas`
6. Implementar gráfico com Recharts
7. Testar e ajustar layout

### Fase 3: Seção 2 - Gráfico Áreas e Frutas
1. Criar componente `GraficoAreasFrutas.js`
2. Criar `ToggleTipoArea.js`
3. Criar hook `useDadosAreasFrutas.js`
4. Criar endpoint backend `/api/painel-frutas/areas-frutas`
5. Implementar gráfico com Recharts
6. Testar e ajustar layout

### Fase 4: Seção 3 - Listagem de Áreas
1. Criar componente `ListagemAreas.js`
2. Criar `FiltrosListagemAreas.js`
3. Criar `CardArea.js`
4. Criar hook `useDadosListagemAreas.js`
5. Criar endpoint backend `/api/painel-frutas/listagem-areas`
6. Implementar cards colapsáveis
7. Testar e ajustar layout

### Fase 5: Ajustes Finais
1. Ajustar responsividade
2. Otimizar performance
3. Adicionar loading states
4. Adicionar tratamento de erros
5. Testes finais

---

## 🚀 Próximos Passos

**Começar pela Seção 1** - Gráfico Culturas/Frutas, pois é a mais simples e estabelece o padrão para as demais.

