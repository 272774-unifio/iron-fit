
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

// Formatar CPF automaticamente
const campoCPF = document.getElementById('cpf');

if (campoCPF) {
    campoCPF.addEventListener('input', function() {
        let cpf = this.value.replace(/\D/g, '').slice(0, 11);

        if (cpf.length > 9) {
            cpf = cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
        } else if (cpf.length > 6) {
            cpf = cpf.replace(/^(\d{3})(\d{3})(\d{1,3})$/, '$1.$2.$3');
        } else if (cpf.length > 3) {
            cpf = cpf.replace(/^(\d{3})(\d{1,3})$/, '$1.$2');
        }

        this.value = cpf;
    });
}

// Cadastro de alunos
const formularioAluno = document.getElementById('form-aluno');

if (formularioAluno) {
    formularioAluno.addEventListener('submit', async function(event) {
        event.preventDefault();

        const aluno = {
            nome: document.getElementById('nome').value,
            cpf: document.getElementById('cpf').value,
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
            alert('Erro ao cadastrar aluno. Verifique se o CPF já está cadastrado.');
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
        tabela.innerHTML = '<tr><td colspan="7">Nenhum aluno cadastrado.</td></tr>';
        return;
    }

    alunos.forEach(function(aluno) {
        const data = aluno.data_nascimento
            ? String(aluno.data_nascimento).slice(0, 10).split('-').reverse().join('/')
            : '';

        tabela.innerHTML += `
            <tr>
                <td>${aluno.nome}</td>
                <td>${aluno.cpf || ''}</td>
                <td>${aluno.telefone || ''}</td>
                <td>${aluno.email || ''}</td>
                <td>${data}</td>
                <td>${aluno.plano || 'Sem plano'}</td>
                <td>
                    <button class="btn-editar" onclick="editarAluno(${aluno.id_aluno})">Editar aluno</button>
                    ${aluno.id_matricula ? `
                        <button class="btn-editar" onclick="editarPlano(${aluno.id_matricula}, ${aluno.id_plano})">Editar plano</button>
                    ` : ''}
                    <button class="btn-excluir" onclick="excluirAluno(${aluno.id_aluno})">Excluir</button>
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

    const cpf = prompt('CPF:', aluno.cpf || '');
    if (cpf === null) return;

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
        body: JSON.stringify({ nome, cpf, telefone, email, nascimento })
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

                <button class="btn-editar" onclick="selecionarPlano(${plano.id_plano})">
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
                    <button class="btn-editar" onclick="editarCadastroPlano(${plano.id_plano})">Editar</button>
                    <button class="btn-excluir" onclick="excluirPlano(${plano.id_plano})">Excluir</button>
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

    if (matriculas.length === 0) {
        tabela.innerHTML = `
            <tr>
                <td colspan="5">Nenhuma matrícula cadastrada.</td>
            </tr>
        `;
        return;
    }

    matriculas.forEach(function(matricula) {

        const inicio = matricula.data_inicio
            ? String(matricula.data_inicio).slice(0, 10).split('-').reverse().join('/')
            : '';

        const fim = matricula.data_fim
            ? String(matricula.data_fim).slice(0, 10).split('-').reverse().join('/')
            : '';

        const hoje = new Date();
        const dataHoje = hoje.getFullYear() + '-' +
            String(hoje.getMonth() + 1).padStart(2, '0') + '-' +
            String(hoje.getDate()).padStart(2, '0');

        const dataVencimento = matricula.data_fim
            ? String(matricula.data_fim).slice(0, 10)
            : '';

        let situacao = 'Ativa';

        if (dataVencimento && dataVencimento < dataHoje) {
            situacao = 'Encerrada';
        }

        tabela.innerHTML += `
            <tr
                data-cpf="${matricula.cpf || ''}"
                data-telefone="${matricula.telefone || ''}"
            >
                <td>${matricula.nome}</td>
                <td>${matricula.plano}</td>
                <td>${inicio}</td>
                <td>${fim}</td>
                <td>${situacao}</td>
            </tr>
        `;
    });

    filtrarMatriculas();
}

// Pesquisar matrícula por nome, CPF ou telefone
function filtrarMatriculas() {
    const pesquisa = document.getElementById('pesquisar-matricula');

    if (!pesquisa) return;

    const texto = pesquisa.value.toLowerCase().trim();
    const numerosPesquisa = texto.replace(/\D/g, '');

    const linhas = document.querySelectorAll('#tabela-matriculas tr');

    linhas.forEach(function(linha) {
        if (!linha.cells[0]) return;

        const nome = linha.cells[0].textContent.toLowerCase();

        const cpf = linha.dataset.cpf || '';
        const cpfLimpo = cpf.replace(/\D/g, '');

        const telefone = linha.dataset.telefone || '';
        const telefoneLimpo = telefone.replace(/\D/g, '');

        const encontrouNome = nome.includes(texto);

        const encontrouCpf = numerosPesquisa !== '' &&
            cpfLimpo.includes(numerosPesquisa);

        const encontrouTelefone = numerosPesquisa !== '' &&
            telefoneLimpo.includes(numerosPesquisa);

        if (
            texto === '' ||
            encontrouNome ||
            encontrouCpf ||
            encontrouTelefone
        ) {
            linha.style.display = '';
        } else {
            linha.style.display = 'none';
        }
    });
}

// Evento da pesquisa de matrículas
const pesquisaMatricula = document.getElementById('pesquisar-matricula');

if (pesquisaMatricula) {
    pesquisaMatricula.addEventListener('input', filtrarMatriculas);
}

carregarMatriculas();

// Listar pagamentos
async function carregarPagamentos() {
    const tabela = document.getElementById('lista-pagamentos');

    if (!tabela) return;

    try {
        const resposta = await fetch('/pagamentos');
        const pagamentos = await resposta.json();

        tabela.innerHTML = '';

        if (pagamentos.length === 0) {
            tabela.innerHTML = `
                <tr>
                    <td colspan="7">Nenhum pagamento cadastrado.</td>
                </tr>
            `;
            return;
        }

        pagamentos.forEach(function(pagamento) {
            const vencimento = pagamento.data_vencimento
                ? String(pagamento.data_vencimento).slice(0, 10).split('-').reverse().join('/')
                : '';

            const dataPagamento = pagamento.data_pagamento
                ? String(pagamento.data_pagamento).slice(0, 10).split('-').reverse().join('/')
                : 'Não pago';

            const hoje = new Date();
            const dataHoje = hoje.getFullYear() + '-' +
                String(hoje.getMonth() + 1).padStart(2, '0') + '-' +
                String(hoje.getDate()).padStart(2, '0');

            const dataVencimento = pagamento.data_vencimento
                ? String(pagamento.data_vencimento).slice(0, 10)
                : '';

            let situacao = pagamento.status;

            if (pagamento.status !== 'PAGO') {
                if (dataVencimento && dataVencimento < dataHoje) {
                    situacao = 'VENCIDO';
                } else {
                    situacao = 'PENDENTE';
                }
            }

            let acao = 'Pago';

            if (situacao === 'PENDENTE' || situacao === 'VENCIDO') {
                acao = `
                    <button class="btn-editar" onclick="registrarPagamento(${pagamento.id_pagamento})">
                        Registrar pagamento
                    </button>
                `;
            }

            tabela.innerHTML += `
                <tr
                    data-cpf="${pagamento.cpf || ''}"
                    data-telefone="${pagamento.telefone || ''}"
                >
                    <td>${pagamento.aluno}</td>
                    <td>${pagamento.plano}</td>
                    <td>R$ ${Number(pagamento.valor).toFixed(2).replace('.', ',')}</td>
                    <td>${vencimento}</td>
                    <td>${dataPagamento}</td>
                    <td>${situacao}</td>
                    <td>${acao}</td>
                </tr>
            `;
        });

        filtrarPagamentos();

    } catch (erro) {
        tabela.innerHTML = `
            <tr>
                <td colspan="7">Erro ao carregar pagamentos.</td>
            </tr>
        `;
    }
}

// Pesquisar pagamento por nome, CPF ou telefone
function filtrarPagamentos() {
    const pesquisa = document.getElementById('pesquisar-pagamento');

    if (!pesquisa) return;

    const texto = pesquisa.value.toLowerCase().trim();
    const numerosPesquisa = texto.replace(/\D/g, '');

    const linhas = document.querySelectorAll('#lista-pagamentos tr');

    linhas.forEach(function(linha) {
        if (!linha.cells[0]) return;

        const nome = linha.cells[0].textContent.toLowerCase();

        const cpf = linha.dataset.cpf || '';
        const cpfLimpo = cpf.replace(/\D/g, '');

        const telefone = linha.dataset.telefone || '';
        const telefoneLimpo = telefone.replace(/\D/g, '');

        const encontrouNome = nome.includes(texto);

        const encontrouCpf = numerosPesquisa !== '' &&
            cpfLimpo.includes(numerosPesquisa);

        const encontrouTelefone = numerosPesquisa !== '' &&
            telefoneLimpo.includes(numerosPesquisa);

        if (
            texto === '' ||
            encontrouNome ||
            encontrouCpf ||
            encontrouTelefone
        ) {
            linha.style.display = '';
        } else {
            linha.style.display = 'none';
        }
    });
}

// Evento da pesquisa de pagamentos
const pesquisaPagamento = document.getElementById('pesquisar-pagamento');

if (pesquisaPagamento) {
    pesquisaPagamento.addEventListener('input', filtrarPagamentos);
}

// Registrar pagamento
async function registrarPagamento(id) {
    const confirmar = confirm('Deseja registrar este pagamento como pago?');

    if (!confirmar) return;

    const resposta = await fetch('/pagamentos/' + id, {
        method: 'PUT'
    });

    const resultado = await resposta.text();

    alert(resultado);

    carregarPagamentos();
}

// Carregar pagamentos
carregarPagamentos();
