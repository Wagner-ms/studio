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

## Passo 3: Obter as Credenciais e Configurar a Hospedagem (Netlify, Vercel, etc.)

Para que sua aplicação funcione em produção, você deve adicionar **TODAS** as variáveis de ambiente necessárias nas configurações do seu provedor de hospedagem. A maneira mais fácil de fazer isso na Netlify é importando um arquivo.

1.  **Crie o arquivo de importação:**
    *   No seu computador, crie um novo arquivo de texto.
    *   Copie todo o conteúdo do arquivo `src/.env` que está no seu projeto.
    *   Cole o conteúdo neste novo arquivo de texto.
    *   Salve o arquivo com um nome como `minhas-variaveis.env`. **Guarde este arquivo em um local seguro e não o envie para o seu repositório do GitHub.**

2.  **Importe as variáveis na Netlify:**
    *   Acesse o dashboard do seu site na Netlify.
    *   Navegue até **Site configuration > Environment variables**.
    *   Clique no botão **"Import from a file"**.
    *   Selecione o arquivo `minhas-variaveis.env` que você acabou de criar.

3.  **Acione um novo deploy:**
    *   Após a importação ser concluída, vá para a aba **Deploys**.
    *   Clique em **Trigger deploy > Clear cache and deploy site** para publicar a nova versão com as variáveis corretas.

Depois de seguir estes passos, sua aplicação estará completamente configurada para se comunicar com os serviços do Firebase em produção.
