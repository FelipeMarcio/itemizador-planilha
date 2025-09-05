# Itemizador de Planilhas

Um aplicativo web para transformar sequências de itens com máscaras personalizadas, ideal para profissionais que trabalham com planilhas e documentação técnica.

## 🚀 Como Usar

1. **Cole sua itemização original** no campo à esquerda
2. **Configure o número inicial** da nova sequência
3. **Defina a máscara de formatação** (use X para números)
4. **Clique em "Gerar Nova Itemização"**
5. **Copie os resultados** para usar em suas planilhas

## 📋 Exemplos de Máscaras

- `XXXX.XX.XX.XX` → 0001.01.01.01, 0002.01.01.01, ...
- `XXXX.XX.XX.XX.XX` → 0001.01.01.01.01, 0002.01.01.01.01, ...
- `XX-XX` → 01-01, 02-01, 03-01, ...
- `Item XXXX` → Item 0001, Item 0002, Item 0003, ...

## 🛠️ Como Executar Localmente

```bash
# Instalar dependências
npm install

# Executar em modo de desenvolvimento
npm start

# Construir para produção
npm run build
```

## 🌐 Como Compartilhar

### Opção 1: GitHub Pages (Recomendado)

1. **Crie um repositório no GitHub** chamado `itemizador-planilha`
2. **Substitua "seu-usuario"** no `package.json` pelo seu nome de usuário do GitHub
3. **Execute os comandos:**
   ```bash
   git init
   git add .
   git commit -m "Primeira versão do Itemizador"
   git branch -M main
   git remote add origin https://github.com/seu-usuario/itemizador-planilha.git
   git push -u origin main
   npm run deploy
   ```
4. **Ative o GitHub Pages** nas configurações do repositório
5. **Compartilhe o link:** `https://seu-usuario.github.io/itemizador-planilha`

### Opção 2: Netlify (Alternativa Gratuita)

1. **Faça o build:** `npm run build`
2. **Acesse [netlify.com](https://netlify.com)**
3. **Arraste a pasta `build`** para o Netlify
4. **Compartilhe o link gerado**

### Opção 3: Vercel (Alternativa Gratuita)

1. **Instale o Vercel CLI:** `npm i -g vercel`
2. **Execute:** `vercel`
3. **Siga as instruções** e compartilhe o link

## 📱 Recursos

- ✅ Transformação automática de sequências
- ✅ Correção de erros na itemização
- ✅ Comparação lado a lado
- ✅ Copiar resultados para área de transferência
- ✅ Interface responsiva
- ✅ Funciona offline

## 🤝 Contribuições

Sinta-se à vontade para contribuir com melhorias e novas funcionalidades!

## 📄 Licença

Este projeto está sob a licença MIT.
