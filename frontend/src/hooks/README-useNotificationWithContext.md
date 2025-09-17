# useNotificationWithContext

Hook personalizado para notificações que **respeitam ConfigProvider** e aparecem sobre modais com z-index correto.

## 🎯 Problema Resolvido

- **Static methods** (`notification.*`, `message.*`) não acessam ConfigProvider
- Notificações apareciam **atrás de modais** por problema de z-index
- Hook baseado em `useNotification` **respeita z-index configurado** no ConfigProvider

## 📚 Como Usar

### Importação
```javascript
import useNotificationWithContext from '../hooks/useNotificationWithContext';
```

### Uso Básico (API Familiar)
```javascript
const MeuComponente = () => {
  const { success, error, info, warning, contextHolder } = useNotificationWithContext();

  const handleOperacao = async () => {
    try {
      await operacaoAsync();
      success('Sucesso', 'Operação realizada com sucesso!'); // ✅ Igual showNotification
    } catch (err) {
      error('Erro', 'Falha na operação!'); // ✅ Igual showNotification
    }
  };

  return (
    <>
      {contextHolder} {/* ← OBRIGATÓRIO para z-index funcionar */}
      <div>
        <Button onClick={handleOperacao}>Executar</Button>
      </div>
    </>
  );
};
```

### API Alternativa (Completa)
```javascript
const { showNotificationWithContext, contextHolder } = useNotificationWithContext();

// Uso igual ao showNotification original
showNotificationWithContext('success', 'Sucesso', 'Operação concluída!');
showNotificationWithContext('error', 'Erro', 'Algo deu errado!');
showNotificationWithContext('info', 'Info', 'Informação importante!');
showNotificationWithContext('warning', 'Aviso', 'Atenção necessária!');
```

## ⚠️ Importante

1. **contextHolder obrigatório**: Sempre incluir `{contextHolder}` no JSX
2. **z-index correto**: Configurado para `100001` no ConfigProvider (App.js)
3. **Estilo idêntico**: Usa mesmo CSS que `showNotification` (`globalNotifications.css`)

## 🔧 Configuração Global

Configuração no `App.js`:
```javascript
<ConfigProvider
  theme={{
    components: {
      Notification: {
        zIndexPopupBase: 100001, // ✅ Maior que modais (100000)
      },
    },
  }}
>
```

## 📋 Quando Usar

- ✅ **Dentro de modais** que precisam mostrar notificações
- ✅ **Componentes específicos** que têm problemas de z-index
- ✅ **Casos pontuais** onde `showNotification` aparece atrás

## 📋 Quando NÃO Usar

- ❌ **Uso geral**: `showNotification` já funciona bem na maioria dos casos
- ❌ **Código legado**: Só migrar se houver problema específico de z-index

## 🎨 Benefícios

- **Z-index correto**: Aparece sobre todos os modais
- **API familiar**: Mesma interface que `showNotification`
- **Estilo consistente**: Usa CSS global existente
- **Context-aware**: Respeita ConfigProvider completamente