
 // Login
const formularioLogin = document.getElementById('form-login');

if (formularioLogin) {
    formularioLogin.addEventListener('submit', async function(event) {
        event.preventDefault();

        const usuario = document.getElementById('usuario').value;
        const senha = document.getElementById('senha').value;

        const resposta = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, senha })
        });

        const resultado = await resposta.text();

        if (resultado === 'alunos.html') {
            window.location.href = 'alunos.html';
        } else {
            alert(resultado);
        }
    });
}

// Cadastro de alunos
const formularioAluno = document.getElementById('form-aluno');

if (formularioAluno) {
    formularioAluno.addEventListener('submit', async function(event) {
        event.preventDefault();

        const aluno = {
            nome: document.getElementById('nome').value,
            telefone: document.getElementById('telefone').value,
            email: document.getElementById('email').value,
            nascimento: document.getElementById('nascimento').value
        };

        const resposta = await fetch('/alunos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(aluno)
        });

        const resultado = await resposta.json();

        if (resultado.id_aluno) {
            formularioAluno.reset();
            carregarAlunos();
            mostrarPlanos(resultado.id_aluno, aluno.nome);
        } else {
            alert('Erro ao cadastrar aluno.');
        }
    });
}

// Mostrar alunos na tabela
async function carregarAlunos() {
    const tabela = document.getElementById('tabela-alunos');

    if (!tabela) return;

    const resposta = await fetch('/alunos');
    const alunos = await resposta.json();

    tabela.innerHTML = '';

    if (alunos.length === 0) {
        tabela.innerHTML = '<tr><td colspan="6">Nenhum aluno cadastrado.</td></tr>';
        return;
    }

    alunos.forEach(function(aluno) {
        const data = aluno.data_nascimento
            ? String(aluno.data_nascimento).slice(0, 10).split('-').reverse().join('/')
            : '';

        tabela.innerHTML += `
            <tr>
                <td>${aluno.nome}</td>
                <td>${aluno.telefone || ''}</td>
                <td>${aluno.email || ''}</td>
                <td>${data}</td>
                <td>${aluno.plano || 'Sem plano'}</td>
                <td>
                    <button onclick="editarAluno(${aluno.id_aluno})">Editar aluno</button>
                    ${aluno.id_matricula ? `
                        <button onclick="editarPlano(${aluno.id_matricula}, ${aluno.id_plano})">Editar plano</button>
                    ` : ''}
                    <button onclick="excluirAluno(${aluno.id_aluno})">Excluir</button>
                </td>
            </tr>
        `;
    });
}

// Editar aluno
async function editarAluno(id) {
    const resposta = await fetch('/alunos');
    const alunos = await resposta.json();
    const aluno = alunos.find(a => a.id_aluno === id);

    if (!aluno) return;

    const nome = prompt('Nome:', aluno.nome);
    if (nome === null) return;

    const telefone = prompt('Telefone:', aluno.telefone || '');
    if (telefone === null) return;

    const email = prompt('E-mail:', aluno.email || '');
    if (email === null) return;

    const nascimento = prompt(
        'Data de nascimento (AAAA-MM-DD):',
        aluno.data_nascimento
            ? String(aluno.data_nascimento).slice(0, 10)
            : ''
    );

    if (nascimento === null) return;

    const respostaEdicao = await fetch('/alunos/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, telefone, email, nascimento })
    });

    alert(await respostaEdicao.text());
    carregarAlunos();
}

// Editar plano do aluno
async function editarPlano(idMatricula, idPlanoAtual) {
    const resposta = await fetch('/planos');
    const planos = await resposta.json();

    let lista = 'Digite o número do plano que deseja escolher:\n\n';

    planos.forEach(function(plano) {
        lista += plano.id_plano + ' - ' + plano.nome + ' - R$ ' + plano.valor + '\n';
    });

    const escolha = prompt(lista, idPlanoAtual);

    if (escolha === null) return;

    const respostaEdicao = await fetch('/matriculas/' + idMatricula, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_plano: escolha })
    });

    alert(await respostaEdicao.text());
    carregarAlunos();
}

// Excluir aluno
async function excluirAluno(id) {
    if (!confirm('Deseja realmente excluir este aluno?')) return;

    const resposta = await fetch('/alunos/' + id, {
        method: 'DELETE'
    });

    alert(await resposta.text());
    carregarAlunos();
}

// Mostrar os planos para o aluno
let alunoPlanoAtual = null;

async function mostrarPlanos(idAluno, nomeAluno) {
    alunoPlanoAtual = idAluno;

    const telaPlanos = document.getElementById('tela-planos');
    const listaPlanos = document.getElementById('lista-planos');
    const nomeAlunoPlano = document.getElementById('nome-aluno-plano');
    const tabela = document.querySelector('.tabela');
    const cadastro = document.querySelector('.novo-aluno');

    telaPlanos.style.display = 'block';
    tabela.style.display = 'none';
    cadastro.style.display = 'none';

    nomeAlunoPlano.textContent = 'Plano para: ' + nomeAluno;

    const resposta = await fetch('/planos');
    const planos = await resposta.json();

    listaPlanos.innerHTML = '';

    if (planos.length === 0) {
        listaPlanos.innerHTML = '<p>Nenhum plano cadastrado.</p>';
        return;
    }

    planos.forEach(function(plano) {
        listaPlanos.innerHTML += `
            <div class="cartao-plano">
                <h3>${plano.nome}</h3>

                <div class="valor-plano">
                    R$ ${Number(plano.valor).toFixed(2).replace('.', ',')}
                </div>

                <p class="duracao-plano">
                    ${plano.duracao_dias} dias
                </p>

                <p>${plano.descricao || ''}</p>

                <button onclick="selecionarPlano(${plano.id_plano})">
                    Selecionar plano
                </button>
            </div>
        `;
    });
}

// Selecionar plano e cadastrar matrícula
async function selecionarPlano(idPlano) {
    const resposta = await fetch('/matriculas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id_aluno: alunoPlanoAtual,
            id_plano: idPlano
        })
    });

    const resultado = await resposta.text();

    alert(resultado);

    fecharPlanos();
    carregarAlunos();
}

// Voltar para a tela de alunos
function fecharPlanos() {
    document.getElementById('tela-planos').style.display = 'none';
    document.querySelector('.tabela').style.display = 'block';
    document.querySelector('.novo-aluno').style.display = 'block';

    alunoPlanoAtual = null;
}

// Cadastro de planos
const formularioPlano = document.getElementById('form-plano');

if (formularioPlano) {
    formularioPlano.addEventListener('submit', async function(event) {
        event.preventDefault();

        const plano = {
            nome: document.getElementById('nome-plano').value,
            valor: document.getElementById('valor').value,
            duracao: document.getElementById('duracao').value,
            descricao: document.getElementById('descricao').value
        };

        const resposta = await fetch('/planos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(plano)
        });

        alert(await resposta.text());

        formularioPlano.reset();
        carregarPlanos();
    });
}

// Listar planos
async function carregarPlanos() {
    const tabela = document.getElementById('tabela-planos');

    if (!tabela) return;

    const resposta = await fetch('/planos');
    const planos = await resposta.json();

    tabela.innerHTML = '';

    if (planos.length === 0) {
        tabela.innerHTML = '<tr><td colspan="5">Nenhum plano cadastrado.</td></tr>';
        return;
    }

    planos.forEach(function(plano) {
        tabela.innerHTML += `
            <tr>
                <td>${plano.nome}</td>
                <td>R$ ${Number(plano.valor).toFixed(2).replace('.', ',')}</td>
                <td>${plano.duracao_dias} dias</td>
                <td>${plano.descricao || ''}</td>
                <td>
                    <button onclick="editarCadastroPlano(${plano.id_plano})">Editar</button>
                    <button onclick="excluirPlano(${plano.id_plano})">Excluir</button>
                </td>
            </tr>
        `;
    });
}

// Editar plano
async function editarCadastroPlano(id) {
    const resposta = await fetch('/planos');
    const planos = await resposta.json();

    const plano = planos.find(function(p) {
        return p.id_plano === id;
    });

    if (!plano) return;

    const nome = prompt('Nome do plano:', plano.nome);
    if (nome === null) return;

    const valor = prompt('Valor:', plano.valor);
    if (valor === null) return;

    const duracao = prompt('Duração em dias:', plano.duracao_dias);
    if (duracao === null) return;

    const descricao = prompt('Descrição:', plano.descricao || '');
    if (descricao === null) return;

    const respostaEdicao = await fetch('/planos/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, valor, duracao, descricao })
    });

    alert(await respostaEdicao.text());
    carregarPlanos();
}

// Excluir plano
async function excluirPlano(id) {
    if (!confirm('Deseja realmente excluir este plano?')) return;

    const resposta = await fetch('/planos/' + id, {
        method: 'DELETE'
    });

    alert(await resposta.text());
    carregarPlanos();
}

// Carregar alunos e planos
carregarAlunos();
carregarPlanos();
// Listar matrículas
async function carregarMatriculas() {
    const tabela = document.getElementById('tabela-matriculas');

    if (!tabela) return;

    const resposta = await fetch('/matriculas');
    const matriculas = await resposta.json();

    tabela.innerHTML = '';

    matriculas.forEach(function(matricula) {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const vencimento = new Date(matricula.data_fim);
        vencimento.setHours(0, 0, 0, 0);

        let situacao = 'Ativa';

        if (vencimento < hoje) {
            situacao = 'Encerrada';
        }

        tabela.innerHTML += `
            <tr>
                <td>${matricula.nome}</td>
                <td>${matricula.plano}</td>
                <td>${new Date(matricula.data_fim).toLocaleDateString('pt-BR')}</td>
                <td>${situacao}</td>
            </tr>
        `;
    });
}

// Pesquisar matrícula
const pesquisaMatricula = document.getElementById('pesquisar-matricula');

if (pesquisaMatricula) {
    pesquisaMatricula.addEventListener('input', function() {
        const pesquisa = this.value.toLowerCase();
        const linhas = document.querySelectorAll('#tabela-matriculas tr');

        linhas.forEach(function(linha) {
            const nome = linha.cells[0].textContent.toLowerCase();

            if (nome.includes(pesquisa)) {
                linha.style.display = '';
            } else {
                linha.style.display = 'none';
            }
        });
    });
}

carregarMatriculas();