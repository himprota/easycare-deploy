// config/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

// Define o caminho para o arquivo do banco de dados SQLite
// Ele será criado na raiz do seu projeto se não existir
const DB_PATH = process.env.DATABASE_PATH || path.resolve(__dirname, '../easycare.db');

let db;

function connectDb() {
    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
            if (err) {
                console.error(`Erro ao conectar ao banco de dados SQLite: ${err.message}`);
                return reject(err);
            }
            console.log(`Conectado ao banco de dados SQLite em: ${DB_PATH}`);
            // Habilitar chaves estrangeiras (importante para integridade referencial)
            db.run("PRAGMA foreign_keys = ON;", (pragmaErr) => {
                if (pragmaErr) {
                    console.error(`Erro ao habilitar PRAGMA foreign_keys: ${pragmaErr.message}`);
                    return reject(pragmaErr);
                }
                console.log('PRAGMA foreign_keys = ON;');
                initializeDb(); // Chama a função para criar tabelas se elas não existirem
                resolve(db);
            });
        });
    });
}

function initializeDb() {
    const createClienteTableSql = `
        CREATE TABLE IF NOT EXISTS Cliente (
            id_cliente TEXT PRIMARY KEY NOT NULL,
            nome_completo TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            ddd TEXT NOT NULL,
            telefone TEXT NOT NULL,
            data_nascimento TEXT NOT NULL,
            cpf TEXT UNIQUE NOT NULL,
            senha_hash TEXT NOT NULL,
            data_cadastro TEXT DEFAULT CURRENT_TIMESTAMP,
            ultimo_login TEXT,
            ativo INTEGER DEFAULT 1,
            
            status_titularidade TEXT, 
            cidade_moradia TEXT,      
            busca_profissional TEXT, 
            
            pref_genero_cuidador TEXT,
            pref_experiencia_minima_anos INTEGER,
            pref_disponibilidade_horarios TEXT,
            pref_especialidades_desejadas TEXT,
            
            cidades_atendimento TEXT, 
            
            publicar_telefone INTEGER DEFAULT 0,
            telefone_publico TEXT,
            publicar_email INTEGER DEFAULT 0,
            email_publico TEXT,
            foto_principal_url TEXT
        );
    `;

    const createCuidadorTableSql = `
    CREATE TABLE IF NOT EXISTS Cuidador (
        id_cuidador TEXT PRIMARY KEY NOT NULL,
        nome_completo TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        ddd TEXT NOT NULL,
        telefone TEXT NOT NULL,
        data_nascimento TEXT NOT NULL,
        cpf TEXT UNIQUE NOT NULL,
        senha_hash TEXT NOT NULL,
        foto_perfil_url TEXT,
        descricao_curta TEXT, -- Certifique-se que esta coluna está aqui
        cidade_atuacao TEXT,  -- Certifique-se que esta coluna está aqui
        data_cadastro TEXT DEFAULT CURRENT_TIMESTAMP,
        ultimo_login TEXT,
        ativo INTEGER DEFAULT 1
    );
    `;

    // --- NOVAS TABELAS PARA CHAT E LIKES ---
    const createLikesTableSql = `
        CREATE TABLE IF NOT EXISTS Likes (
            liker_id TEXT NOT NULL,
            liked_id TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (liker_id, liked_id)
            -- Como id_cliente e id_cuidador são IDs separados, não podemos ter uma FOREIGN KEY direta aqui
            -- a menos que haja uma tabela 'Users' unificada. A validação de IDs pode ser feita na aplicação.
        );
    `;

    const createChatRoomsTableSql = `
        CREATE TABLE IF NOT EXISTS ChatRooms (
            id_sala TEXT PRIMARY KEY,
            user_pair_id TEXT UNIQUE NOT NULL, -- ID único do par de usuários (ex: "id1_id2")
            user1_id TEXT NOT NULL,            -- ID do primeiro usuário no par
            user2_id TEXT NOT NULL,            -- ID do segundo usuário no par
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            -- Opcional: FOREIGN KEYs aqui também, se tiver uma tabela 'Users' unificada.
        );
    `;

    const createMessagesTableSql = `
        CREATE TABLE IF NOT EXISTS Messages (
            id_mensagem TEXT PRIMARY KEY,
            id_sala TEXT NOT NULL,
            sender_id TEXT NOT NULL,
            message_text TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (id_sala) REFERENCES ChatRooms(id_sala) ON DELETE CASCADE
            -- Opcional: FOREIGN KEY (sender_id) REFERENCES Users(id) ON DELETE CASCADE
        );
    `;
    // --- FIM NOVAS TABELAS ---

    db.serialize(() => {
        db.run(createClienteTableSql, (err) => {
            if (err) {
                console.error(`Erro ao criar tabela Cliente: ${err.message}`);
            } else {
                console.log('Tabela Cliente verificada/criada.');
            }
        });

        db.run(createCuidadorTableSql, (err) => {
            if (err) {
                console.error(`Erro ao criar tabela Cuidador: ${err.message}`);
            } else {
                console.log('Tabela Cuidador verificada/criada com a coluna foto_perfil_url.');
            }
        });

        // --- Adicionando as novas tabelas aqui ---
        db.run(createLikesTableSql, (err) => {
            if (err) {
                console.error(`Erro ao criar tabela Likes: ${err.message}`);
            } else {
                console.log('Tabela Likes verificada/criada.');
            }
        });

        db.run(createChatRoomsTableSql, (err) => {
            if (err) {
                console.error(`Erro ao criar tabela ChatRooms: ${err.message}`);
            } else {
                console.log('Tabela ChatRooms verificada/criada.');
            }
        });

        db.run(createMessagesTableSql, (err) => {
            if (err) {
                console.error(`Erro ao criar tabela Messages: ${err.message}`);
            } else {
                console.log('Tabela Messages verificada/criada.');
            }
        });
        // --- FIM da adição das novas tabelas ---
    });
}

// Funções de conveniência para executar queries
const database = {
    get: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.get(sql, params, (err, row) => {
                if (err) {
                    console.error(`Erro ao executar get: ${err.message}`);
                    return reject(err);
                }
                resolve(row);
            });
        });
    },
    all: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error(`Erro ao executar all: ${err.message}`);
                    return reject(err);
                }
                resolve(rows);
            });
        });
    },
    run: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function (err) {
                if (err) {
                    console.error(`Erro ao executar run: ${err.message}`);
                    return reject(err);
                }
                resolve({ id: this.lastID, changes: this.changes });
            });
        });
    },
    close: () => {
        return new Promise((resolve, reject) => {
            db.close((err) => {
                if (err) {
                    console.error(`Erro ao fechar o banco de dados: ${err.message}`);
                    return reject(err);
                }
                console.log('Conexão com o banco de dados fechada.');
                resolve();
            });
        });
    }
};


// Chamar a função de conexão no início
connectDb().catch(err => {
    console.error("Falha ao iniciar a conexão com o banco de dados:", err);
    process.exit(1);
});

module.exports = database;