# Guia de Configuração do Projeto no Console do Firebase

Este guia detalha os passos essenciais para configurar seu projeto Firebase (`valicare-xlbs5`) e garantir que a aplicação funcione corretamente.

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

## Passo 3: Gerar Chave de Conta de Serviço (Credenciais do Admin)

O back-end da aplicação (Server Actions) precisa de credenciais de administrador para se comunicar com o Firebase de forma segura.

1.  No Console do Firebase, clique no ícone de engrenagem ao lado de "Visão geral do projeto" (Project Overview) no canto superior esquerdo e selecione **Configurações do projeto**.
2.  Vá para a aba **Contas de serviço** (Service accounts).
3.  Clique no botão **Gerar nova chave privada**.
4.  Um aviso aparecerá. Clique em **Gerar chave** para confirmar.
5.  O navegador fará o download de um arquivo `.json`. **Guarde este arquivo em um local seguro, pois ele concede acesso total de administrador ao seu projeto Firebase.**

## Passo 4: Adicionar as Credenciais ao seu Projeto

Agora, você precisa adicionar as informações deste arquivo `.json` ao arquivo `.env` na raiz do seu projeto.

1.  Abra o arquivo `.json` que você baixou. Ele terá uma estrutura parecida com esta:
    ```json
    {
      "type": "service_account",
      "project_id": "valicare-xlbs5",
      "private_key_id": "...",
      "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
      "client_email": "firebase-adminsdk-...@valicare-xlbs5.iam.gserviceaccount.com",
      "client_id": "...",
      "auth_uri": "...",
      "token_uri": "...",
      "auth_provider_x509_cert_url": "...",
      "client_x509_cert_url": "..."
    }
    ```

2.  Abra o arquivo `.env` do seu projeto e preencha as seguintes variáveis usando os valores do arquivo `.json`:
    *   `FIREBASE_PROJECT_ID`: Copie o valor de `project_id`.
    *   `FIREBASE_CLIENT_EMAIL`: Copie o valor de `client_email`.
    *   `FIREBASE_PRIVATE_KEY`: Copie **todo** o conteúdo de `private_key`, incluindo `-----BEGIN PRIVATE KEY-----` e `-----END PRIVATE KEY-----`.

Depois de seguir estes quatro passos, sua aplicação estará completamente configurada para se comunicar com os serviços do Firebase.