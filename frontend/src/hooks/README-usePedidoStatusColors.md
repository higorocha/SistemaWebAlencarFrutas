# Hook usePedidoStatusColors

Hook personalizado para acessar cores centralizadas de status de pedidos do tema.

## Uso

```javascript
import usePedidoStatusColors from '../../hooks/usePedidoStatusColors';

const MeuComponente = () => {
  const { getStatusColor, getStatusConfig, statusColors } = usePedidoStatusColors();
  
  // Obter apenas a cor
  const corStatus = getStatusColor('PEDIDO_CRIADO'); // "#1890ff"
  
  // Obter configuração completa
  const config = getStatusConfig('AGUARDANDO_COLHEITA'); 
  // { color: "#1890ff", text: "Aguardando Colheita" }
  
  // Acessar cores diretamente
  const corAzul = statusColors.PEDIDO_CRIADO; // "#1890ff"
  
  return (
    <Tag color={getStatusColor('PEDIDO_FINALIZADO')}>
      {getStatusConfig('PEDIDO_FINALIZADO').text}
    </Tag>
  );
};
```

## API

### `getStatusColor(status)`
Retorna a cor hexadecimal de um status específico.

**Parâmetros:**
- `status` (string): Status do pedido

**Retorna:** `string` - Cor hexadecimal

### `getStatusConfig(status)`
Retorna configuração completa (cor + texto) de um status.

**Parâmetros:**
- `status` (string): Status do pedido

**Retorna:** `Object` - `{ color: string, text: string }`

### `statusColors`
Objeto com todas as cores de status disponíveis.

## Status Suportados

- `PEDIDO_CRIADO` - Azul (#1890ff)
- `AGUARDANDO_COLHEITA` - Azul (#1890ff)
- `COLHEITA_REALIZADA` - Roxo (#722ed1)
- `AGUARDANDO_PRECIFICACAO` - Roxo (#722ed1)
- `PRECIFICACAO_REALIZADA` - Roxo (#722ed1)
- `AGUARDANDO_PAGAMENTO` - Amarelo (#faad14)
- `PAGAMENTO_PARCIAL` - Amarelo (#faad14)
- `PAGAMENTO_REALIZADO` - Verde (#52c41a)
- `PEDIDO_FINALIZADO` - Verde (#52c41a)
- `CANCELADO` - Vermelho (#ff4d4f)

## Vantagens

- **Centralização**: Cores definidas em um local único
- **Consistência**: Mesmas cores em toda a aplicação
- **Manutenção**: Alterações refletem automaticamente
- **Temas**: Suporte automático a modo claro/escuro
- **Type Safety**: IntelliSense para status válidos
