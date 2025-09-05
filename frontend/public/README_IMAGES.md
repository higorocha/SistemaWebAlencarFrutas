# 🖼️ Imagens Públicas para Geração de PDF

Este diretório contém imagens essenciais para a geração de PDFs de boletos no frontend.

## ✅ Arquivos Necessários

- `logo_extendida.png` - Logo principal da empresa para cabeçalho dos boletos
- `qrcode_placeholder.png` - Imagem placeholder para QR codes indisponíveis

## 🔧 Manutenção

### Atualizando as Imagens

Se as imagens originais em `frontend/src/components/assets/img/` ou `frontend/src/assets/img/` forem atualizadas, execute os comandos abaixo para sincronizar:

```bash
# A partir da raiz do projeto
copy "frontend\src\components\assets\img\logoEstendido.png" "frontend\public\logo_extendida.png"
copy "frontend\src\assets\img\qrcode_placeholder.png" "frontend\public\qrcode_placeholder.png"
```

### Por que essas imagens estão aqui?

1. **Webpack Build Issues**: Durante o build de produção, as importações estáticas das imagens podem falhar ou ter caminhos alterados
2. **Deploy Reliability**: Imagens na pasta `public/` são sempre acessíveis via URL pública 
3. **Fallback System**: O sistema de geração de PDFs tenta primeiro a importação estática, depois as URLs públicas

## 🚨 Importante

- **NÃO REMOVA** estes arquivos - eles são essenciais para o funcionamento correto em produção
- Se o deploy no Render apresentar problemas com logos, verifique primeiro se estes arquivos existem
- Os logs do console mostrarão qual método de carregamento foi usado

## 🔍 Debug

Para verificar se as imagens estão sendo carregadas corretamente, monitore os logs do console:
- `✅ Logo carregada com sucesso` - Importação funcionou
- `📄 Usando fallback de texto para logo` - Todas as opções falharam 