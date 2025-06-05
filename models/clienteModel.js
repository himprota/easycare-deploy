// models/clienteModel.js
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

class ClienteModel {
    static async create(clienteData) {
        const {
            nomeCompleto, email, ddd, telefone, dataNascimento, cpf, senha,
            statusTitularidade, cidadeMoradia, buscaProfissional,
            prefGeneroCuidador, prefExperienciaMinimaAnos, prefDisponibilidadeHorarios,
            prefEspecialidadesDesejadas, cidadesAtendimento,
            publicarTelefone, telefonePublico, publicarEmail, emailPublico, fotoPrincipalUrl
        } = clienteData;

        const id_cliente = uuidv4();
        const salt = await bcrypt.genSalt(10);
        const senha_hash = await bcrypt.hash(senha, salt);

        const sql = `
            INSERT INTO Cliente (
                id_cliente, nome_completo, email, ddd, telefone, data_nascimento, cpf, senha_hash,
                status_titularidade, cidade_moradia, busca_profissional,
                pref_genero_cuidador, pref_experiencia_minima_anos, pref_disponibilidade_horarios,
                pref_especialidades_desejadas, cidades_atendimento,
                publicar_telefone, telefone_publico, publicar_email, email_publico, foto_principal_url,
                ativo, data_cadastro
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP);
        `;
        const params = [
            id_cliente, nomeCompleto, email, ddd, telefone, dataNascimento, cpf, senha_hash,
            statusTitularidade || null, cidadeMoradia || null, buscaProfissional || null,
            prefGeneroCuidador || null, prefExperienciaMinimaAnos || null, prefDisponibilidadeHorarios || null,
            prefEspecialidadesDesejadas || null, cidadesAtendimento || null,
            publicarTelefone ? 1 : 0, telefonePublico || null,
            publicarEmail ? 1 : 0, emailPublico || null, fotoPrincipalUrl || null
        ];

        try {
            await db.run(sql, params);
            const { senha: _s, ...clienteRetorno } = clienteData;
            return { id_cliente, ...clienteRetorno, message: 'Cliente criado com sucesso.' };
        } catch (error) {
            console.error('Erro ao criar cliente:', error.message);
            throw new Error(`Erro ao criar cliente no banco de dados: ${error.message}`);
        }
    }

    static async findById(id_cliente) {
        const sql = 'SELECT * FROM Cliente WHERE id_cliente = ?;';
        try {
            const cliente = await db.get(sql.replace('*', 'id_cliente, nome_completo, email, ddd, telefone, data_nascimento, cpf, data_cadastro, ultimo_login, ativo, status_titularidade, cidade_moradia, busca_profissional, pref_genero_cuidador, pref_experiencia_minima_anos, pref_disponibilidade_horarios, pref_especialidades_desejadas, cidades_atendimento, publicar_telefone, telefone_publico, publicar_email, email_publico, foto_principal_url'), [id_cliente]);
            return cliente;
        } catch (error) {
            console.error('Erro ao buscar cliente por ID:', error.message);
            throw new Error('Erro ao buscar cliente no banco de dados.');
        }
    }

    static async findByEmail(email) {
        const sql = 'SELECT * FROM Cliente WHERE email = ?;';
        try {
            return await db.get(sql, [email]);
        } catch (error) {
            console.error('Erro ao buscar cliente por email:', error.message);
            throw new Error('Erro ao buscar cliente no banco de dados.');
        }
    }

    static async findByCpf(cpf) {
        const sql = 'SELECT * FROM Cliente WHERE cpf = ?;';
        try {
            return await db.get(sql.replace('*', 'id_cliente, nome_completo, email, ddd, telefone, data_nascimento, cpf, data_cadastro, ultimo_login, ativo'), [cpf]);
        } catch (error) {
            console.error('Erro ao buscar cliente por CPF:', error.message);
            throw new Error('Erro ao buscar cliente no banco de dados.');
        }
    }

    static async findByEmailOrCpf(email, cpf) {
        const sql = 'SELECT id_cliente, email, cpf FROM Cliente WHERE email = ? OR cpf = ?;';
        try {
            return await db.get(sql, [email, cpf]);
        } catch (error) {
            console.error('Erro ao buscar cliente por email ou CPF:', error.message);
            throw new Error('Erro ao buscar cliente por email ou CPF no banco de dados.');
        }
    }

    static async update(id_cliente, updateData) {
        const allowedFields = [
            'nome_completo', 'ddd', 'telefone', 'data_nascimento',
            'status_titularidade', 'cidade_moradia', 'busca_profissional',
            'pref_genero_cuidador', 'pref_experiencia_minima_anos', 'pref_disponibilidade_horarios',
            'pref_especialidades_desejadas', 'cidades_atendimento',
            'publicar_telefone', 'telefone_publico', 'publicar_email', 'email_publico', 'foto_principal_url',
            'ultimo_login', 'ativo'
        ];

        let sets = [];
        let params = [];

        for (const key in updateData) {
            if (allowedFields.includes(key) && updateData[key] !== undefined) {
                if (key === 'publicar_telefone' || key === 'publicar_email' || key === 'ativo') {
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

        params.push(id_cliente);
        const sql = `UPDATE Cliente SET ${sets.join(', ')} WHERE id_cliente = ?;`;

        try {
            const result = await db.run(sql, params);
            if (result.changes === 0) {
                const clienteExistente = await this.findById(id_cliente);
                if (!clienteExistente) {
                    throw new Error('Cliente não encontrado.');
                }
                return { changes: 0, message: 'Nenhum dado foi alterado (valores podem ser os mesmos). Cliente encontrado.' };
            }
            return { changes: result.changes, message: 'Cliente atualizado com sucesso.' };
        } catch (error) {
            console.error('Erro ao atualizar cliente:', error.message);
            throw new Error(`Erro ao atualizar cliente no banco de dados: ${error.message}`);
        }
    }

    static async updatePassword(id_cliente, newPasswordHash) {
        const sql = 'UPDATE Cliente SET senha_hash = ? WHERE id_cliente = ?;';
        try {
            const result = await db.run(sql, [newPasswordHash, id_cliente]);
            if (result.changes === 0) {
                throw new Error('Cliente não encontrado ou senha não alterada.');
            }
            return { changes: result.changes, message: 'Senha atualizada com sucesso.' };
        } catch (error) {
            console.error('Erro ao atualizar senha do cliente:', error.message);
            throw new Error('Erro ao atualizar senha do cliente no banco de dados.');
        }
    }

    static async updateLastLogin(id_cliente) {
        const sql = 'UPDATE Cliente SET ultimo_login = CURRENT_TIMESTAMP WHERE id_cliente = ?;';
        try {
            const result = await db.run(sql, [id_cliente]);
            if (result.changes === 0) {
                console.warn(`Tentativa de atualizar ultimo_login para cliente não encontrado: ${id_cliente}`);
            }
            return { changes: result.changes };
        } catch (error) {
            console.error('Erro ao atualizar último login do cliente:', error.message);
            throw new Error('Erro ao atualizar último login do cliente.');
        }
    }

    static async delete(id_cliente) {
        const sql = 'DELETE FROM Cliente WHERE id_cliente = ?;';
        try {
            const result = await db.run(sql, [id_cliente]);
            if (result.changes === 0) {
                throw new Error('Cliente não encontrado para exclusão.');
            }
            return { changes: result.changes, message: 'Cliente excluído com sucesso.' };
        } catch (error) {
            console.error('Erro ao excluir cliente:', error.message);
            throw new Error('Erro ao excluir cliente do banco de dados.');
        }
    }

    static async findAllActiveForMatching() {
        const sql = `
        SELECT
            id_cliente,
            nome_completo,
            ddd,
            telefone,
            foto_principal_url,
            busca_profissional,
            cidade_moradia
        FROM Cliente
        WHERE ativo = 1;
    `;
        try {
            const clientes = await db.all(sql);
            return clientes.map(cliente => ({
                id: cliente.id_cliente,
                nome: cliente.nome_completo,
                fotoUrl: cliente.foto_principal_url,
                tipoConta: 'Cliente',
                bio: cliente.busca_profissional,
                cidade: cliente.cidade_moradia,
                ddd: cliente.ddd,
                telefone: cliente.telefone
            }));
        } catch (error) {
            console.error('Erro ao buscar todos os clientes ativos para match:', error.message);
            throw new Error('Erro ao buscar clientes para match no banco de dados.');
        }
    }
}

module.exports = ClienteModel;