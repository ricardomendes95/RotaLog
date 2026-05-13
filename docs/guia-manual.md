# Guia Manual — App Rotas

Este guia descreve tudo que você precisa fazer manualmente no terminal ou no celular para configurar, rodar e distribuir o app.

---

## Pré-requisitos

### 1. Node.js
Verifique se já está instalado:
```bash
node --version
```
Se não estiver, baixe a versão LTS em: https://nodejs.org

### 2. Git (opcional, mas recomendado)
```bash
git --version
```

---

## Parte 1 — Criar o Projeto Expo

Execute estes comandos uma única vez para criar a base do projeto:

```bash
# Entrar na pasta do projeto
cd /home/ricardo/dev/app-rotas

# Criar o projeto Expo com TypeScript (o ponto cria dentro da pasta atual)
npx create-expo-app . --template expo-template-blank-typescript
```

> **Atenção no WSL2:** se aparecer um erro de permissão ao criar o projeto, tente:
> ```bash
> sudo chown -R $USER /home/ricardo/dev/app-rotas
> ```

---

## Parte 2 — Instalar Dependências

Após criar o projeto, instale todas as bibliotecas de uma vez:

```bash
npx expo install \
  react-native-maps \
  expo-location \
  expo-sqlite \
  expo-media-library \
  expo-sharing \
  react-native-view-shot \
  @react-navigation/native \
  @react-navigation/stack \
  @react-navigation/bottom-tabs \
  react-native-screens \
  react-native-safe-area-context \
  react-native-gesture-handler
```

> Use sempre `npx expo install` (não `npm install`) para que o Expo escolha automaticamente as versões compatíveis com o seu SDK.

---

## Parte 3 — Rodar o App em Modo Desenvolvimento

### 3.1 Instalar o Expo Go no celular Android

1. Abrir a Google Play Store no celular
2. Buscar **"Expo Go"** e instalar

### 3.2 Rodar o servidor de desenvolvimento

No terminal do computador (pasta do projeto):

```bash
cd /home/ricardo/dev/app-rotas
npx expo start
```

> **WSL2:** o modo LAN geralmente não funciona no WSL2 porque o celular não enxerga o IP da máquina virtual. Use o modo tunnel:
>
> ```bash
> npx expo start --tunnel
> ```
>
> Se pedir para instalar `@expo/ngrok`, confirme com `y`.

### 3.3 Abrir no celular

1. Abrir o **Expo Go** no celular
2. Tocar em **"Scan QR Code"**
3. Escanear o QR Code que aparece no terminal
4. O app vai abrir automaticamente com hot-reload

---

## Parte 4 — Permissão de Localização em Segundo Plano (Android 11+)

Para o rastreamento continuar funcionando com o app minimizado, você precisa conceder a permissão "Permitir sempre":

1. Ao abrir o app pela primeira vez, ele vai pedir permissão de localização
2. Conceder **"Enquanto usa o app"** (opção padrão)
3. Ir em: **Configurações do Android → Apps → App Rotas → Permissões → Localização**
4. Selecionar **"Permitir sempre"**

---

## Parte 5 — Gerar APK para Instalar Sem Expo Go

Para ter o app instalado diretamente no celular, sem depender do Expo Go, você precisa gerar um APK usando o serviço de build na nuvem do Expo (EAS Build). É gratuito para uso pessoal.

### 5.1 Criar conta no Expo

Acesse https://expo.dev e crie uma conta gratuita.

### 5.2 Fazer login no terminal

```bash
npx expo login
```

Informe seu e-mail e senha da conta que você criou.

### 5.3 Instalar o EAS CLI

```bash
npm install -g eas-cli
```

### 5.4 Configurar o EAS no projeto

```bash
cd /home/ricardo/dev/app-rotas
eas build:configure
```

Isso cria o arquivo `eas.json`. Quando perguntar sobre o Android build profile, pode aceitar os padrões.

### 5.5 Gerar o APK (build na nuvem)

```bash
eas build -p android --profile preview
```

- O EAS vai compilar o app nos servidores do Expo (leva entre 5 e 15 minutos)
- Ao terminar, você recebe um link no terminal para baixar o arquivo `.apk`

### 5.6 Instalar o APK no celular

1. **Habilitar fontes desconhecidas no Android:**
   - Configurações → Segurança → Instalar apps desconhecidos
   - Habilitar para o navegador ou gerenciador de arquivos que você vai usar

2. **Transferir o APK para o celular** (escolha um método):
   - Baixar direto do link no celular
   - Enviar pelo Google Drive
   - Transferir por cabo USB

3. **Instalar:** tocar no arquivo `.apk` no gerenciador de arquivos e confirmar a instalação

---

## Parte 6 — Atualizar o App

Após cada mudança no código, o Expo Go atualiza automaticamente via hot-reload enquanto o servidor está rodando.

Para gerar um novo APK com as mudanças:

```bash
eas build -p android --profile preview
```

---

## Parte 7 — Comandos Úteis do Dia a Dia

| Comando | Para que serve |
|---|---|
| `npx expo start` | Iniciar servidor de desenvolvimento |
| `npx expo start --tunnel` | Iniciar servidor com tunnel (WSL2) |
| `npx expo start --clear` | Limpar cache e iniciar |
| `npx expo install <pacote>` | Instalar dependência compatível com o SDK |
| `eas build -p android --profile preview` | Gerar APK |
| `npx expo doctor` | Verificar se há problemas de compatibilidade nas dependências |

---

## Resolução de Problemas Comuns

| Problema | Solução |
|---|---|
| "Network response timed out" no Expo Go | Use `npx expo start --tunnel` |
| QR Code não funciona | Verifique se celular e computador estão na mesma rede Wi-Fi |
| App trava ao pedir localização | Verifique se a permissão foi concedida nas configurações do Android |
| Mapa aparece em branco | Verifique conexão com internet (tiles OSM precisam de internet) |
| Build falha no EAS | Execute `npx expo doctor` e corrija as incompatibilidades |
| `npx expo install` trava | Tente `npx expo install --npm` para forçar o npm |
