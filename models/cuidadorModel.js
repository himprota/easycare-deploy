// models/cuidadorModel.js (Exemplo, você deve adaptar o seu arquivo real)
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

class CuidadorModel {
    static async create(cuidadorData) {
        const {
            nomeCompleto, email, ddd, telefone, dataNascimento, cpf, senha,
            // ... outros campos específicos do cuidador (se houver no seu model real)
            fotoPrincipalUrl // Se estiver usando um campo de foto aqui
        } = cuidadorData;

        const id_cuidador = uuidv4();
        const salt = await bcrypt.genSalt(10);
        const senha_hash = await bcrypt.hash(senha, salt);

        const sql = `
            INSERT INTO Cuidador (
                id_cuidador, nome_completo, email, ddd, telefone, data_nascimento, cpf, senha_hash,
                foto_perfil_url, -- ou foto_principal_url, conforme seu DB
                ativo, data_cadastro
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP);
        `;
        const params = [
            id_cuidador, nomeCompleto, email, ddd, telefone, dataNascimento, cpf, senha_hash,
            fotoPrincipalUrl || null // Adapte para o nome real do seu campo de foto
        ];

        try {
            await db.run(sql, params);
            const { senha: _s, ...cuidadorRetorno } = cuidadorData;
            return { id_cuidador, ...cuidadorRetorno, message: 'Cuidador criado com sucesso.' };
        } catch (error) {
            console.error('Erro ao criar cuidador:', error.message);
            throw new Error(`Erro ao criar cuidador no banco de dados: ${error.message}`);
        }
    }

    static async findById(id_cuidador) {
        const sql = 'SELECT * FROM Cuidador WHERE id_cuidador = ?;';
        try {
            const cuidador = await db.get(sql.replace('*', 'id_cuidador, nome_completo, email, ddd, telefone, data_nascimento, cpf, data_cadastro, ultimo_login, ativo, foto_perfil_url'), [id_cuidador]);
            return cuidador;
        } catch (error) {
            console.error('Erro ao buscar cuidador por ID:', error.message);
            throw new Error('Erro ao buscar cuidador no banco de dados.');
        }
    }

    static async findByEmail(email) {
        const sql = 'SELECT * FROM Cuidador WHERE email = ?;';
        try {
            return await db.get(sql, [email]);
        } catch (error) {
            console.error('Erro ao buscar cuidador por email:', error.message);
            throw new Error('Erro ao buscar cuidador no banco de dados.');
        }
    }

    static async findByCpf(cpf) {
        const sql = 'SELECT * FROM Cuidador WHERE cpf = ?;';
        try {
            return await db.get(sql.replace('*', 'id_cuidador, nome_completo, email, ddd, telefone, data_nascimento, cpf, data_cadastro, ultimo_login, ativo'), [cpf]);
        } catch (error) {
            console.error('Erro ao buscar cuidador por CPF:', error.message);
            throw new Error('Erro ao buscar cuidador no banco de dados.');
        }
    }

    static async findByEmailOrCpf(email, cpf) {
        const sql = 'SELECT id_cuidador, email, cpf FROM Cuidador WHERE email = ? OR cpf = ?;';
        try {
            return await db.get(sql, [email, cpf]);
        } catch (error) {
            console.error('Erro ao buscar cuidador por email ou CPF:', error.message);
            throw new Error('Erro ao buscar cuidador por email ou CPF no banco de dados.');
        }
    }

    static async update(id_cuidador, updateData) {
        const allowedFields = [
            'nome_completo', 'ddd', 'telefone', 'data_nascimento',
            'foto_perfil_url', // ou foto_principal_url
            'ultimo_login', 'ativo'
        ];

        let sets = [];
        let params = [];

        for (const key in updateData) {
            if (allowedFields.includes(key) && updateData[key] !== undefined) {
                if (key === 'ativo') {
                    params.push(updateData[key] ? 1 : 0);
                } else {
                    params.push(updateData[key] === null ? null : updateData[key]);
                }
                sets.push(`${key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)} = ?`);
            }
        }

        if (sets.length === 0) {
            return { changes: 0, message: 'Nenhum dado válido para atualizar.' };
        }

        params.push(id_cuidador);
        const sql = `UPDATE Cuidador SET ${sets.join(', ')} WHERE id_cuidador = ?;`;

        try {
            const result = await db.run(sql, params);
            if (result.changes === 0) {
                const cuidadorExistente = await this.findById(id_cuidador);
                if (!cuidadorExistente) {
                    throw new Error('Cuidador não encontrado.');
                }
                return { changes: 0, message: 'Nenhum dado foi alterado (valores podem ser os mesmos). Cuidador encontrado.' };
            }
            return { changes: result.changes, message: 'Cuidador atualizado com sucesso.' };
        } catch (error) {
            console.error('Erro ao atualizar cuidador:', error.message);
            throw new Error(`Erro ao atualizar cuidador no banco de dados: ${error.message}`);
        }
    }

    static async updatePassword(id_cuidador, newPasswordHash) {
        const sql = 'UPDATE Cuidador SET senha_hash = ? WHERE id_cuidador = ?;';
        try {
            const result = await db.run(sql, [newPasswordHash, id_cuidador]);
            if (result.changes === 0) {
                throw new Error('Cuidador não encontrado ou senha não alterada.');
            }
            return { changes: result.changes, message: 'Senha atualizada com sucesso.' };
        } catch (error) {
            console.error('Erro ao atualizar senha do cuidador:', error.message);
            throw new Error('Erro ao atualizar senha do cuidador no banco de dados.');
        }
    }

    static async updateLastLogin(id_cuidador) {
        const sql = 'UPDATE Cuidador SET ultimo_login = CURRENT_TIMESTAMP WHERE id_cuidador = ?;';
        try {
            const result = await db.run(sql, [id_cuidador]);
            if (result.changes === 0) {
                console.warn(`Tentativa de atualizar ultimo_login para cuidador não encontrado: ${id_cuidador}`);
            }
            return { changes: result.changes };
        } catch (error) {
            console.error('Erro ao atualizar último login do cuidador:', error.message);
            throw new Error('Erro ao atualizar último login do cuidador.');
        }
    }

    static async delete(id_cuidador) {
        const sql = 'DELETE FROM Cuidador WHERE id_cuidador = ?;';
        try {
            const result = await db.run(sql, [id_cuidador]);
            if (result.changes === 0) {
                throw new Error('Cuidador não encontrado para exclusão.');
            }
            return { changes: result.changes, message: 'Cuidador excluído com sucesso.' };
        } catch (error) {
            console.error('Erro ao excluir cuidador:', error.message);
            throw new Error('Erro ao excluir cuidador do banco de dados.');
        }
    }

    static async findAllActiveForMatching() {
        const sql = `
        SELECT
            id_cuidador,
            nome_completo,
            ddd,
            telefone,
            foto_perfil_url,
            descricao_servicos AS bio,
            cidade_atuacao AS cidade
        FROM Cuidador
        WHERE ativo = 1;
    `;
        try {
            const cuidadores = await db.all(sql);
            return cuidadores.map(cuidador => ({
                id: cuidador.id_cuidador,
                nome: cuidador.nome_completo,
                fotoUrl: cuidador.foto_perfil_url,
                tipoConta: 'cuidador',
                bio: cuidador.bio,
                cidade: cuidador.cidade,
                ddd: cuidador.ddd,
                telefone: cuidador.telefone
            }));
        } catch (error) {
            console.error('Erro ao buscar todos os cuidadores ativos para match:', error.message);
            throw new Error('Erro ao buscar cuidadores para match no banco de dados.');
        }
    }
}

module.exports = CuidadorModel;