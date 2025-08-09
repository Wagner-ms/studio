# Guia de Configuração do Projeto no Console do Firebase

Este guia detalha os passos essenciais para configurar seu projeto Firebase (`valicare-xlbs5`) e garantir que a aplicação funcione corretamente, tanto em desenvolvimento local quanto em produção (Netlify, Vercel, etc.).

## Passo 1: Configurar o Banco de Dados Firestore

A aplicação utiliza o Firestore para salvar os dados dos produtos.

1.  Acesse o [Console do Firebase](https://console.firebase.google.com/) e selecione o seu projeto `valicare-xlbs5`.
2.  No menu à esquerda, vá em **Build > Firestore Database**.
3.  Clique em **Criar banco de dados**.
4.  Selecione **Iniciar em modo de produção** e clique em "Avançar".
5.  Escolha um local para os seus servidores (por exemplo, `southamerica-east1` para São Paulo) e clique em **Ativar**.
6.  Após a criação, vá para a aba **Regras** (Rules).
7.  Substitua as regras existentes pelo seguinte código e clique em **Publicar**.

    ```javascript
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        // Permite leitura e escrita em todas as coleções.
        // CUIDADO: Isso deixa seus dados abertos. Ideal para desenvolvimento.
        // Para produção, implemente regras de autenticação mais seguras.
        match /{document=**} {
          allow read, write: if true;
        }
      }
    }
    ```

    > **Aviso Importante:** As regras acima são apenas para desenvolvimento e permitem que qualquer pessoa leia e escreva no seu banco de dados. Para um aplicativo em produção, você deve restringir o acesso, geralmente exigindo autenticação do usuário.

## Passo 2: Configurar o Firebase Storage

A aplicação usa o Storage para fazer o upload das fotos das etiquetas dos produtos.

1.  No menu à esquerda, vá em **Build > Storage**.
2.  Clique em **Primeiros passos**.
3.  Siga as instruções na tela, selecionando o modo de produção e o mesmo local que você escolheu para o Firestore.
4.  Após a criação, vá para a aba **Regras** (Rules).
5.  Substitua as regras existentes pelo seguinte código e clique em **Publicar**.

    ```javascript
    rules_version = '2';
    service firebase.storage {
      match /b/{bucket}/o {
        // Permite leitura e escrita de todos os arquivos por qualquer pessoa.
        // CUIDADO: Ideal apenas para desenvolvimento.
        // Para produção, restrinja o acesso com base na autenticação do usuário.
        match /{allPaths=**} {
          allow read, write: if true;
        }
      }
    }
    ```

## Passo 3: Obter as Credenciais (Variáveis de Ambiente)

Para que sua aplicação se comunique com o Firebase, ela precisa de dois conjuntos de chaves: as de **Servidor (Admin)** e as de **Cliente (Públicas)**.

### 3.1 - Credenciais de Servidor (Admin)

Estas são as chaves **secretas** que permitem que seu backend (Server Actions) gerencie o banco de dados.

1.  No Console do Firebase, clique no ícone de engrenagem ao lado de "Visão geral do projeto" (Project Overview) e selecione **Configurações do projeto**.
2.  Vá para a aba **Contas de serviço** (Service accounts).
3.  Clique no botão **Gerar nova chave privada**.
4.  Um aviso aparecerá. Clique em **Gerar chave** para confirmar.
5.  O navegador fará o download de um arquivo `.json`. **Guarde este arquivo em um local seguro.**
6.  Abra o arquivo `.json` e use os valores dele para preencher as seguintes variáveis no seu arquivo `.env`:
    *   `FIREBASE_PROJECT_ID`: Copie o valor de `project_id`.
    *   `FIREBASE_CLIENT_EMAIL`: Copie o valor de `client_email`.
    *   `FIREBASE_PRIVATE_KEY`: Copie **todo** o conteúdo de `private_key`.

### 3.2 - Credenciais de Cliente (Públicas)

Estas são as chaves **públicas** que permitem que o navegador do usuário se conecte a serviços como o Storage para fazer uploads.

1.  Ainda em **Configurações do projeto**, vá para a aba **Geral**.
2.  Role para baixo até a seção **Seus apps**.
3.  Selecione seu aplicativo web (ou crie um se não houver).
4.  Clique no ícone de engrenagem para ver as **Configurações**.
5.  Selecione **Configuração do SDK > Configuração** e você verá um objeto de configuração.
6.  Use esses valores para preencher as seguintes variáveis no seu arquivo `.env` (elas já devem estar lá, mas você pode confirmar):
    *   `NEXT_PUBLIC_FIREBASE_API_KEY` (valor de `apiKey`)
    *   `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` (valor de `authDomain`)
    *   `NEXT_PUBLIC_FIREBASE_PROJECT_ID` (valor de `projectId`)
    *   `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` (valor de `storageBucket`)
    *   `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` (valor de `messagingSenderId`)
    *   `NEXT_PUBLIC_FIREBASE_APP_ID` (valor de `appId`)

## Passo 4: Configurar a Hospedagem (Netlify, Vercel, etc.)

Para que sua aplicação funcione em produção, você deve adicionar **TODAS** as variáveis de ambiente do seu arquivo `.env` nas configurações do seu provedor de hospedagem.

1.  Acesse o dashboard do seu site (ex: Netlify).
2.  Navegue até a seção de configurações do site, geralmente em **"Site configuration" > "Environment variables"**.
3.  Clique em **"Add a variable"** e adicione, uma por uma, todas as 9 variáveis do seu arquivo `.env` com seus respectivos valores.
4.  Após adicionar todas as variáveis, acione um novo deploy do seu site (geralmente em **Deploys > Trigger deploy > Clear cache and deploy site**).

Depois de seguir estes quatro passos, sua aplicação estará completamente configurada para se comunicar com os serviços do Firebase, tanto localmente quanto em produção.
