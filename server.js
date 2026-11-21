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
    const { nome, telefone, email, nascimento } = req.body;

    conexao.query(
        'INSERT INTO alunos (nome, telefone, email, data_nascimento) VALUES (?, ?, ?, ?)',
        [nome, telefone, email, nascimento],
        (erro, resultado) => {
            if (erro) {
                res.send('Erro ao cadastrar aluno');
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
            res.send('Erro ao buscar alunos');
        } else {
            res.json(resultado);
        }
    });
});

// Editar aluno
app.put('/alunos/:id', (req, res) => {
    const { nome, telefone, email, nascimento } = req.body;

    conexao.query(
        'UPDATE alunos SET nome = ?, telefone = ?, email = ?, data_nascimento = ? WHERE id_aluno = ?',
        [nome, telefone, email, nascimento, req.params.id],
        (erro) => {
            res.send(erro ? 'Erro ao editar aluno' : 'Aluno atualizado com sucesso!');
        }
    );
});

// Excluir aluno e suas matrículas
app.delete('/alunos/:id', (req, res) => {
    const id = req.params.id;

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
                    if (erro) {
                        res.send('Erro ao excluir aluno');
                    } else {
                        res.send('Aluno excluído com sucesso!');
                    }
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

// Cadastrar matrícula
app.post('/matriculas', (req, res) => {
    const { id_aluno, id_plano } = req.body;

    const dataInicio = new Date().toISOString().slice(0, 10);

    conexao.query(
        'SELECT duracao_dias FROM planos WHERE id_plano = ?',
        [id_plano],
        (erro, resultado) => {
            if (erro || resultado.length === 0) {
                res.send('Erro ao buscar plano');
                return;
            }

            const duracao = resultado[0].duracao_dias;

            const dataFim = new Date();
            dataFim.setDate(dataFim.getDate() + duracao);

            const fim = dataFim.toISOString().slice(0, 10);

            conexao.query(
                'INSERT INTO matriculas (id_aluno, id_plano, data_inicio, data_fim) VALUES (?, ?, ?, ?)',
                [id_aluno, id_plano, dataInicio, fim],
                (erro) => {
                    res.send(erro ? 'Erro ao cadastrar matrícula' : 'Matrícula cadastrada com sucesso!');
                }
            );
        }
    );
});

// Editar matrícula (trocar plano do aluno)
app.put('/matriculas/:id', (req, res) => {
    const { id_plano } = req.body;

    conexao.query(
        'SELECT duracao_dias FROM planos WHERE id_plano = ?',
        [id_plano],
        (erro, resultado) => {
            if (erro || resultado.length === 0) {
                res.send('Erro ao buscar plano');
                return;
            }

            const duracao = resultado[0].duracao_dias;

            const dataFim = new Date();
            dataFim.setDate(dataFim.getDate() + duracao);

            const fim = dataFim.toISOString().slice(0, 10);

            conexao.query(
                'UPDATE matriculas SET id_plano = ?, data_fim = ? WHERE id_matricula = ?',
                [id_plano, fim, req.params.id],
                (erro) => {
                    res.send(erro ? 'Erro ao editar plano' : 'Plano atualizado com sucesso!');
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

// Listar matrículas
app.get('/matriculas', (req, res) => {
    const sql = `
        SELECT alunos.nome, planos.nome AS plano,
               matriculas.data_inicio, matriculas.data_fim
        FROM matriculas
        INNER JOIN alunos ON matriculas.id_aluno = alunos.id_aluno
        INNER JOIN planos ON matriculas.id_plano = planos.id_plano
    `;

    conexao.query(sql, (erro, resultado) => {
        if (erro) {
            res.send('Erro ao buscar matrículas');
        } else {
            res.json(resultado);
        }
    });
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`Iron Fit funcionando na porta ${port}`);
});