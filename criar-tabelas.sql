USE iron_fit;
USE iron_fit;

CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nome_usuario VARCHAR(50) NOT NULL UNIQUE,
    senha VARCHAR(100) NOT NULL
);

CREATE TABLE alunos (
    id_aluno INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    telefone VARCHAR(20),
    email VARCHAR(100),
    data_nascimento DATE,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE planos (
    id_plano INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    duracao_dias INT NOT NULL,
    descricao TEXT
);

CREATE TABLE matriculas (
    id_matricula INT AUTO_INCREMENT PRIMARY KEY,
    id_aluno INT NOT NULL,
    id_plano INT NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'ATIVA',
    FOREIGN KEY (id_aluno) REFERENCES alunos(id_aluno),
    FOREIGN KEY (id_plano) REFERENCES planos(id_plano)
);

CREATE TABLE pagamentos (
    id_pagamento INT AUTO_INCREMENT PRIMARY KEY,
    id_matricula INT NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    forma_pagamento VARCHAR(50),
    status VARCHAR(20) DEFAULT 'PENDENTE',
    FOREIGN KEY (id_matricula) REFERENCES matriculas(id_matricula)
);

