
const express = require('express');
const conexao = require('./database');

const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(express.json());

// Login
app.post('/login', (req, res) => {
    const { usuario, senha } = req.body;

    conexao.query(
        'SELECT * FROM usuarios WHERE nome_usuario = ? AND senha = ?',
        [usuario, senha],
        (erro, resultado) => {
            if (erro) {
                res.send('Erro ao fazer login');
            } else if (resultado.length > 0) {
                res.send('alunos.html');
            } else {
                res.send('Usuário ou senha incorretos');
            }
        }
    );
});

// Cadastrar aluno
app.post('/alunos', (req, res) => {
    const { nome, cpf, telefone, email, nascimento } = req.body;

    conexao.query(
        'INSERT INTO alunos (nome, cpf, telefone, email, data_nascimento) VALUES (?, ?, ?, ?, ?)',
        [nome, cpf, telefone, email, nascimento],
        (erro, resultado) => {
            if (erro) {
                console.log(erro);
                res.send('Erro ao cadastrar aluno. Verifique se o CPF já está cadastrado.');
            } else {
                res.json({
                    mensagem: 'Aluno cadastrado com sucesso!',
                    id_aluno: resultado.insertId
                });
            }
        }
    );
});

// Listar alunos com seus planos
app.get('/alunos', (req, res) => {
    const sql = `
        SELECT alunos.*, 
               planos.nome AS plano,
               matriculas.id_matricula,
               matriculas.id_plano
        FROM alunos
        LEFT JOIN matriculas ON alunos.id_aluno = matriculas.id_aluno
        LEFT JOIN planos ON matriculas.id_plano = planos.id_plano
    `;

    conexao.query(sql, (erro, resultado) => {
        if (erro) {
            console.log(erro);
            res.send('Erro ao buscar alunos');
        } else {
            res.json(resultado);
        }
    });
});

// Editar aluno
app.put('/alunos/:id', (req, res) => {
    const { nome, cpf, telefone, email, nascimento } = req.body;

    conexao.query(
        'UPDATE alunos SET nome = ?, cpf = ?, telefone = ?, email = ?, data_nascimento = ? WHERE id_aluno = ?',
        [nome, cpf, telefone, email, nascimento, req.params.id],
        (erro) => {
            if (erro) {
                console.log(erro);
                res.send('Erro ao editar aluno. Verifique se o CPF já está cadastrado.');
            } else {
                res.send('Aluno atualizado com sucesso!');
            }
        }
    );
});

// Excluir aluno, pagamentos e matrículas
app.delete('/alunos/:id', (req, res) => {
    const id = req.params.id;

    conexao.query(
        'DELETE FROM pagamentos WHERE id_matricula IN (SELECT id_matricula FROM matriculas WHERE id_aluno = ?)',
        [id],
        (erro) => {
            if (erro) {
                res.send('Erro ao excluir pagamentos');
                return;
            }

            conexao.query(
                'DELETE FROM matriculas WHERE id_aluno = ?',
                [id],
                (erro) => {
                    if (erro) {
                        res.send('Erro ao excluir matrícula');
                        return;
                    }

                    conexao.query(
                        'DELETE FROM alunos WHERE id_aluno = ?',
                        [id],
                        (erro) => {
                            res.send(erro ? 'Erro ao excluir aluno' : 'Aluno excluído com sucesso!');
                        }
                    );
                }
            );
        }
    );
});

// Cadastrar plano
app.post('/planos', (req, res) => {
    const { nome, valor, duracao, descricao } = req.body;

    conexao.query(
        'INSERT INTO planos (nome, valor, duracao_dias, descricao) VALUES (?, ?, ?, ?)',
        [nome, valor, duracao, descricao],
        (erro) => {
            res.send(erro ? 'Erro ao cadastrar plano' : 'Plano cadastrado com sucesso!');
        }
    );
});

// Cadastrar matrícula e gerar pagamento
app.post('/matriculas', (req, res) => {
    const { id_aluno, id_plano } = req.body;

    const dataInicio = new Date().toISOString().slice(0, 10);

    conexao.query(
        'SELECT duracao_dias, valor FROM planos WHERE id_plano = ?',
        [id_plano],
        (erro, resultado) => {
            if (erro || resultado.length === 0) {
                res.send('Erro ao buscar plano');
                return;
            }

            const duracao = resultado[0].duracao_dias;
            const valor = resultado[0].valor;

            const dataFim = new Date();
            dataFim.setDate(dataFim.getDate() + duracao);

            const fim = dataFim.toISOString().slice(0, 10);

            conexao.query(
                'INSERT INTO matriculas (id_aluno, id_plano, data_inicio, data_fim) VALUES (?, ?, ?, ?)',
                [id_aluno, id_plano, dataInicio, fim],
                (erro, resultadoMatricula) => {
                    if (erro) {
                        res.send('Erro ao cadastrar matrícula');
                        return;
                    }

                    const idMatricula = resultadoMatricula.insertId;

                    conexao.query(
                        'INSERT INTO pagamentos (id_matricula, valor, data_vencimento, status) VALUES (?, ?, ?, ?)',
                        [idMatricula, valor, fim, 'PENDENTE'],
                        (erro) => {
                            if (erro) {
                                res.send('Erro ao gerar pagamento');
                            } else {
                                res.send('Matrícula e pagamento cadastrados com sucesso!');
                            }
                        }
                    );
                }
            );
        }
    );
});

// Editar matrícula (trocar plano) e atualizar pagamento pendente
app.put('/matriculas/:id', (req, res) => {
    const { id_plano } = req.body;
    const idMatricula = req.params.id;

    conexao.query(
        'SELECT duracao_dias, valor FROM planos WHERE id_plano = ?',
        [id_plano],
        (erro, resultado) => {
            if (erro || resultado.length === 0) {
                res.send('Erro ao buscar plano');
                return;
            }

            const duracao = resultado[0].duracao_dias;
            const valor = resultado[0].valor;

            const dataFim = new Date();
            dataFim.setDate(dataFim.getDate() + duracao);

            const fim = dataFim.toISOString().slice(0, 10);

            conexao.query(
                'UPDATE matriculas SET id_plano = ?, data_fim = ? WHERE id_matricula = ?',
                [id_plano, fim, idMatricula],
                (erro) => {
                    if (erro) {
                        res.send('Erro ao editar plano');
                        return;
                    }

                    conexao.query(
                        'UPDATE pagamentos SET valor = ?, data_vencimento = ? WHERE id_matricula = ? AND status = "PENDENTE"',
                        [valor, fim, idMatricula],
                        (erro) => {
                            res.send(erro ? 'Erro ao atualizar pagamento' : 'Plano atualizado com sucesso!');
                        }
                    );
                }
            );
        }
    );
});

// Listar planos
app.get('/planos', (req, res) => {
    conexao.query('SELECT * FROM planos', (erro, resultado) => {
        if (erro) {
            res.send('Erro ao buscar planos');
        } else {
            res.json(resultado);
        }
    });
});

// Editar plano
app.put('/planos/:id', (req, res) => {
    const { nome, valor, duracao, descricao } = req.body;

    conexao.query(
        'UPDATE planos SET nome = ?, valor = ?, duracao_dias = ?, descricao = ? WHERE id_plano = ?',
        [nome, valor, duracao, descricao, req.params.id],
        (erro) => {
            res.send(erro ? 'Erro ao editar plano' : 'Plano atualizado com sucesso!');
        }
    );
});

// Excluir plano
app.delete('/planos/:id', (req, res) => {
    conexao.query(
        'DELETE FROM planos WHERE id_plano = ?',
        [req.params.id],
        (erro) => {
            res.send(erro ? 'Erro ao excluir plano' : 'Plano excluído com sucesso!');
        }
    );
});

// Listar matrículas com nome, CPF, telefone e plano
app.get('/matriculas', (req, res) => {
    const sql = `
        SELECT alunos.nome AS nome,
               alunos.cpf AS cpf,
               alunos.telefone AS telefone,
               planos.nome AS plano,
               matriculas.data_inicio,
               matriculas.data_fim
        FROM matriculas
        INNER JOIN alunos ON matriculas.id_aluno = alunos.id_aluno
        INNER JOIN planos ON matriculas.id_plano = planos.id_plano
        ORDER BY matriculas.id_matricula DESC
    `;

    conexao.query(sql, (erro, resultado) => {
        if (erro) {
            console.log(erro);
            res.send('Erro ao buscar matrículas');
        } else {
            res.json(resultado);
        }
    });
});

// Listar pagamentos com aluno, CPF, telefone e plano
app.get('/pagamentos', (req, res) => {
    const sql = `
        SELECT pagamentos.id_pagamento,
               alunos.nome AS aluno,
               alunos.cpf AS cpf,
               alunos.telefone AS telefone,
               planos.nome AS plano,
               pagamentos.valor,
               pagamentos.data_vencimento,
               pagamentos.data_pagamento,
               pagamentos.status
        FROM pagamentos
        INNER JOIN matriculas ON pagamentos.id_matricula = matriculas.id_matricula
        INNER JOIN alunos ON matriculas.id_aluno = alunos.id_aluno
        INNER JOIN planos ON matriculas.id_plano = planos.id_plano
        ORDER BY pagamentos.data_vencimento
    `;

    conexao.query(sql, (erro, resultado) => {
        if (erro) {
            console.log(erro);
            res.send('Erro ao buscar pagamentos');
        } else {
            res.json(resultado);
        }
    });
});

// Registrar pagamento
app.put('/pagamentos/:id', (req, res) => {
    const id = req.params.id;

    conexao.query(
        'UPDATE pagamentos SET status = ?, data_pagamento = CURDATE() WHERE id_pagamento = ? AND status = ?',
        ['PAGO', id, 'PENDENTE'],
        (erro, resultado) => {
            if (erro) {
                res.send('Erro ao registrar pagamento');
            } else if (resultado.affectedRows === 0) {
                res.send('Pagamento não encontrado ou já pago');
            } else {
                res.send('Pagamento registrado com sucesso!');
            }
        }
    );
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`Iron Fit funcionando na porta ${port}`);
});
