# Automação de Sub-tarefas Jira com Commits Git

Este projeto contém um script Node.js para automatizar a criação, atribuição e finalização de sub-tarefas no Jira a partir de commits Git locais. Ele foi projetado para agilizar o processo de reporte de atividades para desenvolvedores.

## Funcionalidades

- **Interativo:** O script solicita o ID da "História" ou tarefa principal de forma interativa no terminal.
- **Leitura de Commits:** Identifica todos os commits feitos localmente que ainda não foram enviados ao repositório remoto.
- **Criação de Sub-tarefas:** Para cada commit, uma nova sub-tarefa é criada no Jira, usando a mensagem do commit como título.
- **Atribuição Automática:** As sub-tarefas recém-criadas são automaticamente atribuídas ao usuário configurado.
- **Finalização Automática:** Após a atribuição, as sub-tarefas são movidas para o status "Finalizado" (ou outro status configurado).
- **Sem Dependências:** O script usa apenas APIs nativas do Node.js (`fetch`, `readline`, `child_process`), não exigindo a instalação de pacotes externos.

## Pré-requisitos

- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [Git](https://git-scm.com/)

---

## Configuração Passo a Passo

Siga estes passos para configurar o ambiente e o script.

### 1. Obter Informações do Jira

Você precisará de várias informações da sua instância do Jira. Reserve um momento para coletar todos os dados a seguir.

| Variável no Script        | Descrição e Como Obter                                                                                                                                                                                                                                                                                                                              |
| :------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `JIRA_URL`                | A URL base da sua instância do Jira. Ex: `https://suaempresa.atlassian.net`                                                                                                                                                                                                                                                                         |
| `JIRA_EMAIL`              | O seu e-mail de login no Jira. Ex: `seu.email@empresa.com`                                                                                                                                                                                                                                                                                          |
| `JIRA_API_TOKEN`          | Um token de API, **não sua senha**. Gere um em: [Gerenciar tokens de API](https://id.atlassian.com/manage-profile/security/api-tokens).                                                                                                                                                                                                             |
| `PROJECT_KEY`             | A chave do seu projeto no Jira. Ex: `PROJ`, `APP`, `ESS`.                                                                                                                                                                                                                                                                                           |
| `SUBTASK_ISSUE_TYPE_ID`   | O ID numérico do tipo de issue "Sub-tarefa". Descubra-o acessando no navegador: `[JIRA_URL]/rest/api/2/project/[PROJECT_KEY]` e procure por `"name": "Sub-task"` (ou "Subtarefa"). Anote o `"id"` correspondente.                                                                                                                                   |
| `JIRA_ACCOUNT_ID`         | Seu ID de usuário único. Vá no seu perfil do Jira e copie o valor no final da URL. Ex: `.../people/`**`5c8a1b2f3d4e5f6a7b8c9d0e`**                                                                                                                                                                                                                  |
| `JIRA_TRANSITION_ID_DONE` | O ID da transição para o status "Finalizado". Rode o comando abaixo (substituindo os valores) e procure na resposta o `"id"` da transição com `"name": "Done"` (ou "Finalizar", "Concluído", etc.). <br> `bash curl --request GET --url '[JIRA_URL]/rest/api/2/issue/[ID_DE_UM_CARD_QUALQUER]/transitions' --user '[JIRA_EMAIL]:[JIRA_API_TOKEN]' ` |

### 2. Configurar o Script

1.  Certifique-se de que o script (ex: `criar-subtarefas.js`) está na pasta do seu projeto.
2.  Abra o arquivo do script em um editor de texto.
3.  Localize a seção de **CONFIGURAÇÃO** no topo do arquivo.
4.  Preencha todas as constantes com os valores que você coletou no passo anterior.

**Exemplo da seção de configuração:**

```javascript
// --- CONFIGURAÇÃO BÁSICA ---
const JIRA_URL =
  "[https://suaempresa.atlassian.net](https://suaempresa.atlassian.net)";
const JIRA_EMAIL = "seu.email@empresa.com";
const JIRA_API_TOKEN = "SEUTOKENCOPIADOAQUI";
const PROJECT_KEY = "ESS";
const SUBTASK_ISSUE_TYPE_ID = "10210";

// --- CONFIGURAÇÃO AVANÇADA (PARA ATRIBUIR E FINALIZAR) ---
const JIRA_ACCOUNT_ID = "5c8a1b2f3d4e5f6a7b8c9d0e";
const JIRA_TRANSITION_ID_DONE = "31";
```

### 3. Configurar o `package.json`

Para que a sintaxe moderna `import` funcione corretamente, seu arquivo `package.json` na raiz do projeto deve conter a linha `"type": "module"`.

```json
{
  "name": "meu-projeto",
  "version": "1.0.0",
  "type": "module"
}
```

---

## Como Usar

1.  Abra o terminal e navegue até a pasta raiz do seu projeto Git.
2.  Faça seus commits normalmente, usando mensagens claras e descritivas que servirão como títulos para as sub-tarefas.
    ```bash
    git commit -m "Implementa validação no formulário de login"
    git commit -m "Adiciona teste de unidade para o serviço de autenticação"
    ```
3.  Execute o script no terminal **sem argumentos**:
    ```bash
    node criar-subtarefas.js
    ```
4.  O script irá solicitar que você digite o ID da tarefa principal (a "História"):
    ```
    Digite o ID do card principal (ex: ESS-123):
    ```
5.  Digite o ID (ex: `ESS-399`) e pressione **Enter**.
6.  A automação será executada, e você verá o progresso de cada etapa (criação, atribuição, finalização) no terminal.
7.  Após a execução, você pode enviar seus commits para o repositório remoto:
    ```bash
    git push
    ```

## Solução de Problemas Comuns

- **Erro `ReferenceError: require is not defined`**: Garanta que seu `package.json` contém `"type": "module"` e que o script usa a sintaxe `import`, conforme o modelo.
- **Erro `fatal: no upstream configured for branch`**: Se o `git log` falhar, sua branch local pode não estar vinculada a uma remota. Resolva com `git branch --set-upstream-to=origin/sua-branch`.
- **Erros da API do Jira (401, 403)**: Verifique se seu `JIRA_EMAIL` e `JIRA_API_TOKEN` estão corretos e se sua conta tem permissão para criar, editar e transicionar issues no projeto.
