import { Buffer } from 'node:buffer'
import { exec } from 'node:child_process'

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

const basicAuth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString(
  'base64'
)
const commonHeaders = {
  Authorization: `Basic ${basicAuth}`,
  Accept: 'application/json',
  'Content-Type': 'application/json',
}

function getGitCommits() {
  return new Promise(resolve => {
    const command = `git log @{u}..HEAD --pretty=format:%s`
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.warn(
          `Aviso: Não foi possível comparar com a branch remota. Verifique se a branch existe no remote ('origin').`
        )
        resolve([])
        return
      }
      const commits = stdout
        .trim()
        .split('\n')
        .filter(line => line)
      resolve(commits)
    })
  })
}

async function createJiraSubtask(parentIssueKey, summary) {
  console.log(`  -> 1. Criando sub-tarefa para o commit: '${summary}'...`)
  const apiUrl = `${JIRA_URL}/rest/api/2/issue`
  const payload = {
    fields: {
      project: { key: PROJECT_KEY },
      parent: { key: parentIssueKey },
      summary,
      description: `Sub-tarefa criada automaticamente a partir do commit: '${summary}'`,
      issuetype: { id: SUBTASK_ISSUE_TYPE_ID },
    },
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: commonHeaders,
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Status ${response.status}: ${JSON.stringify(errorData)}`)
    }

    const responseData = await response.json()
    const issueKey = responseData.key
    console.log(`     ✅ Sub-tarefa '${issueKey}' criada com sucesso.`)
    return issueKey
  } catch (error) {
    console.error(`     ❌ Erro ao criar sub-tarefa: ${error.message}`)
    return null
  }
}

async function assignJiraIssue(issueKey) {
  console.log(`  -> 2. Atribuindo o card '${issueKey}' para sua conta...`)
  const apiUrl = `${JIRA_URL}/rest/api/2/issue/${issueKey}`
  const payload = { fields: { assignee: { accountId: JIRA_ACCOUNT_ID } } }

  try {
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: commonHeaders,
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Status ${response.status}: ${JSON.stringify(errorData)}`)
    }

    console.log(`     ✅ Card '${issueKey}' atribuído com sucesso.`)
    return true
  } catch (error) {
    console.error(
      `     ❌ Erro ao atribuir o card '${issueKey}': ${error.message}`
    )
    return false
  }
}

async function transitionJiraIssue(issueKey) {
  console.log(`  -> 3. Movendo o card '${issueKey}' para 'Finalizado'...`)
  const apiUrl = `${JIRA_URL}/rest/api/2/issue/${issueKey}/transitions`
  const payload = { transition: { id: JIRA_TRANSITION_ID_DONE } }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: commonHeaders,
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Status ${response.status}: ${JSON.stringify(errorData)}`)
    }

    console.log(
      `     ✅ Card '${issueKey}' movido para o status final com sucesso.`
    )
    return true
  } catch (error) {
    console.error(
      `     ❌ Erro ao transicionar o card '${issueKey}': ${error.message}`
    )
    return false
  }
}

async function main() {
    const rl = readline.createInterface({ input, output });
    let parentStoryId = '';

    try {
        const rawInput = await rl.question('Digite o ID do card principal (ex: ESS-123): ');
        parentStoryId = rawInput.trim().toUpperCase();

        if (!parentStoryId || !/^[A-Z]+-[0-9]+$/.test(parentStoryId)) {
            console.error("Erro: O ID do card fornecido é inválido. Ele deve estar no formato 'PROJ-123'.");
            return; 
        }

    } finally {
        rl.close();
    }
    
    console.log(`\nIniciando automação para a História '${parentStoryId}'.`);
    
    const commits = await getGitCommits('main');

    if (!commits || commits.length === 0) {
        console.log("\nNenhum commit novo para processar.");
        return;
    }

    console.log(`\nEncontrados ${commits.length} commits. Processando um por um...`);
    for (const commitMessage of commits) {
        console.log(`\n--- Processando commit: "${commitMessage}" ---`);
        
        const newIssueKey = await createJiraSubtask(parentStoryId, commitMessage);
        
        if (newIssueKey) {
            const assigned = await assignJiraIssue(newIssueKey);
            if (assigned) {
                await transitionJiraIssue(newIssueKey);
            }
        }
        console.log(`--- Fim do processamento para: "${commitMessage}" ---`);
    }
}


main();
