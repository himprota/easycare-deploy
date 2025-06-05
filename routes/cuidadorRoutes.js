// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // Manter jwt
require('dotenv').config();
console.log('JWT_SECRET no authRoutes:', process.env.JWT_SECRET);

// Importar os modelos específicos
const ClienteModel = require('../models/clienteModel');
const CuidadorModel = require('../models/cuidadorModel');

console.log('userRoutes.js: Router instanciado.');

// Função auxiliar para mapear dados do Cliente para o perfil
function mapClienteToProfile(cliente) {
    if (!cliente) return null;
    return {
        id: cliente.id_cliente,
        nomeCompleto: cliente.nome_completo,
        email: cliente.email,
        telefoneCompleto: cliente.ddd && cliente.telefone ? `(${cliente.ddd}) ${cliente.telefone}` : null,
        dataNascimento: cliente.data_nascimento,
        fotoPrincipalUrl: cliente.foto_principal_url || null,
        statusTitularidade: cliente.status_titularidade || null,
        cidadeMoradia: cliente.cidade_moradia || null,
        buscaProfissional: cliente.busca_profissional || null,
        preferenciasCuidador: {
            genero: cliente.pref_genero_cuidador || 'Indiferente',
            experienciaMinimaAnos: cliente.pref_experiencia_minima_anos ?? null,
            disponibilidadeHorarios: cliente.pref_disponibilidade_horarios || null,
            especialidadesDesejadas: cliente.pref_especialidades_desejadas ? cliente.pref_especialidades_desejadas.split(',') : []
        },
        cidadesAtendimento: cliente.cidades_atendimento ? cliente.cidades_atendimento.split(',') : [],
        publicarTelefone: cliente.publicar_telefone === 1,
        telefonePublico: cliente.telefone_publico || null,
        publicarEmail: cliente.publicar_email === 1,
        emailPublico: cliente.email_publico || null,
        tipoConta: 'cliente'
    };
}

// Função auxiliar para mapear dados do Cuidador para o perfil (SIMPLIFICADA)
function mapCuidadorToProfile(cuidador) {
    if (!cuidador) return null;
    return {
        id: cuidador.id_cuidador,
        nomeCompleto: cuidador.nome_completo,
        email: cuidador.email,
        telefoneCompleto: cuidador.ddd && cuidador.telefone ? `(${cuidador.ddd}) ${cuidador.telefone}` : null,
        dataNascimento: cuidador.data_nascimento,
        fotoPrincipalUrl: cuidador.foto_perfil_url || null,
        tipoConta: 'cuidador'
    };
}

// Rota de Cadastro de Novo Usuário (Cliente ou Cuidador)
router.post('/register', async (req, res) => {
    const {
        tipoUsuario, nome, email, telefoneCompleto, dataNascimento, cpf, senha,
        statusTitularidade, cidadeMoradia, buscaProfissional,
    } = req.body;

    if (!tipoUsuario || !nome || !email || !telefoneCompleto || !dataNascimento || !cpf || !senha) {
        return res.status(400).json({ message: 'Todos os campos básicos obrigatórios devem ser preenchidos (tipoUsuario, nome, email, telefoneCompleto, dataNascimento, cpf, senha).' });
    }

    try {
        const ddd = telefoneCompleto.substring(0, 2);
        const telefone = telefoneCompleto.substring(2);

        let novoUsuarioRegistrado;
        let userId;
        let userTypeForToken;

        const commonData = {
            nomeCompleto: nome,
            email,
            ddd,
            telefone,
            dataNascimento,
            cpf,
            senha
        };

        if (tipoUsuario === 'cliente') {
            const clienteExistente = await ClienteModel.findByEmailOrCpf(email, cpf);
            if (clienteExistente) {
                return res.status(409).json({ message: `Este ${clienteExistente.email === email ? 'e-mail' : 'CPF'} já está cadastrado como cliente.` });
            }
            const clienteData = { ...commonData, statusTitularidade, cidadeMoradia, buscaProfissional };
            novoUsuarioRegistrado = await ClienteModel.create(clienteData);
            userId = novoUsuarioRegistrado.id_cliente;
            userTypeForToken = 'cliente';
        } else if (tipoUsuario === 'cuidador') {
            const cuidadorExistente = await CuidadorModel.findByEmailOrCpf(email, cpf);
            if (cuidadorExistente) {
                return res.status(409).json({ message: `Este ${cuidadorExistente.email === email ? 'e-mail' : 'CPF'} já está cadastrado como cuidador.` });
            }
            const cuidadorData = { ...commonData };
            novoUsuarioRegistrado = await CuidadorModel.create(cuidadorData);
            userId = novoUsuarioRegistrado.id_cuidador;
            userTypeForToken = 'cuidador';
        } else {
            return res.status(400).json({ message: 'Tipo de usuário inválido. Deve ser "cliente" ou "cuidador".' });
        }

        const payload = { user: { id: userId, email: novoUsuarioRegistrado.email, tipoConta: userTypeForToken } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

        res.status(201).json({
            message: `${userTypeForToken.charAt(0).toUpperCase() + userTypeForToken.slice(1)} cadastrado(a) com sucesso!`,
            token: token,
            userId: userId,
            email: novoUsuarioRegistrado.email,
            tipoConta: userTypeForToken
        });

    } catch (error) {
        console.error(`Erro ao processar cadastro de ${tipoUsuario || 'desconhecido'}:`, error);
        if (error.message.includes('já cadastrado')) {
            return res.status(409).json({ message: error.message });
        }
        if (error.message.includes('Campo obrigatório faltando')) {
            return res.status(400).json({ message: 'Dados inválidos ou faltando.' });
        }
        res.status(500).json({ message: `Erro interno do servidor ao cadastrar ${tipoUsuario || 'usuário'}.` });
    }
});

// Rota de Login (para Cliente ou Cuidador)
router.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
    }

    try {
        let user = null;
        let userType = null;
        let userIdField = null;

        user = await ClienteModel.findByEmail(email);
        if (user && user.ativo) {
            userType = 'cliente';
            userIdField = 'id_cliente';
        } else if (user && !user.ativo) {
            return res.status(401).json({ message: 'Conta de cliente inativa.' });
        }

        if (!user) {
            user = await CuidadorModel.findByEmail(email);
            if (user && user.ativo) {
                userType = 'cuidador';
                userIdField = 'id_cuidador';
            } else if (user && !user.ativo) {
                return res.status(401).json({ message: 'Conta de cuidador inativa.' });
            }
        }

        if (!user) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        const isMatch = await bcrypt.compare(senha, user.senha_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        if (userType === 'cliente') {
            await ClienteModel.updateLastLogin(user[userIdField]);
        } else if (userType === 'cuidador') {
            await CuidadorModel.updateLastLogin(user[userIdField]);
        }

        const payload = {
            user: {
                id: user[userIdField],
                email: user.email,
                tipoConta: userType
            }
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            message: 'Login bem-sucedido!',
            token: token,
            userId: user[userIdField],
            email: user.email,
            tipoConta: userType
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Rota para obter o perfil do usuário autenticado (Cliente ou Cuidador)
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const { id, tipoConta } = req.user;
        console.log(`userRoutes.js: Atingiu rota /profile GET. UserID: ${id}, TipoConta: ${tipoConta}`);

        let user;
        let userProfile;

        if (tipoConta === 'cliente') {
            user = await ClienteModel.findById(id);
            userProfile = mapClienteToProfile(user);
        } else if (tipoConta === 'cuidador') {
            user = await CuidadorModel.findById(id);
            userProfile = mapCuidadorToProfile(user);
        } else {
            return res.status(400).json({ message: 'Tipo de conta inválido no token.' });
        }

        if (!userProfile) {
            return res.status(404).json({ message: 'Perfil não encontrado.' });
        }

        res.status(200).json(userProfile);
    } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar perfil.' });
    }
});

// Rota para atualizar o perfil do usuário autenticado (Cliente ou Cuidador)
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { id, tipoConta } = req.user;
        const updatesFromBody = req.body;
        console.log(`userRoutes.js: Atingiu rota /profile PUT. UserID: ${id}, TipoConta: ${tipoConta}`);

        let updatedUserRaw;
        let userProfile;

        const dbUpdates = {};

        if (tipoConta === 'cliente') {
            if (updatesFromBody.nomeCompleto) dbUpdates.nome_completo = updatesFromBody.nomeCompleto;
            if (updatesFromBody.telefoneCompleto) {
                dbUpdates.ddd = updatesFromBody.telefoneCompleto.substring(0, 2);
                dbUpdates.telefone = updatesFromBody.telefoneCompleto.substring(2);
            }
            if (updatesFromBody.dataNascimento) dbUpdates.data_nascimento = updatesFromBody.dataNascimento;
            if (updatesFromBody.fotoPrincipalUrl) dbUpdates.foto_principal_url = updatesFromBody.fotoPrincipalUrl;
            if (updatesFromBody.statusTitularidade) dbUpdates.status_titularidade = updatesFromBody.statusTitularidade;
            if (updatesFromBody.cidadeMoradia) dbUpdates.cidade_moradia = updatesFromBody.cidadeMoradia;
            if (updatesFromBody.buscaProfissional) dbUpdates.busca_profissional = updatesFromBody.buscaProfissional;
            if (updatesFromBody.preferenciasCuidador) {
                if (updatesFromBody.preferenciasCuidador.genero) dbUpdates.pref_genero_cuidador = updatesFromBody.preferenciasCuidador.genero;
                if (updatesFromBody.preferenciasCuidador.experienciaMinimaAnos !== undefined) dbUpdates.pref_experiencia_minima_anos = parseInt(updatesFromBody.preferenciasCuidador.experienciaMinimaAnos, 10) || null;
                if (updatesFromBody.preferenciasCuidador.disponibilidadeHorarios) dbUpdates.pref_disponibilidade_horarios = updatesFromBody.preferenciasCuidador.disponibilidadeHorarios;
                if (Array.isArray(updatesFromBody.preferenciasCuidador.especialidadesDesejadas)) dbUpdates.pref_especialidades_desejadas = updatesFromBody.preferenciasCuidador.especialidadesDesejadas.join(',');
            }
            if (Array.isArray(updatesFromBody.cidadesAtendimento)) dbUpdates.cidades_atendimento = updatesFromBody.cidadesAtendimento.join(',');
            if (updatesFromBody.publicarTelefone !== undefined) dbUpdates.publicar_telefone = updatesFromBody.publicarTelefone ? 1 : 0;
            if (updatesFromBody.telefonePublico !== undefined) dbUpdates.telefone_publico = updatesFromBody.telefonePublico;
            if (updatesFromBody.publicarEmail !== undefined) dbUpdates.publicar_email = updatesFromBody.publicarEmail ? 1 : 0;
            if (updatesFromBody.emailPublico !== undefined) dbUpdates.email_publico = updatesFromBody.emailPublico;

            updatedUserRaw = await ClienteModel.update(id, dbUpdates);
            userProfile = mapClienteToProfile(updatedUserRaw);
        } else if (tipoConta === 'cuidador') {
            if (updatesFromBody.nomeCompleto) dbUpdates.nome_completo = updatesFromBody.nomeCompleto;
            if (updatesFromBody.telefoneCompleto) {
                dbUpdates.ddd = updatesFromBody.telefoneCompleto.substring(0, 2);
                dbUpdates.telefone = updatesFromBody.telefoneCompleto.substring(2);
            }
            if (updatesFromBody.dataNascimento) dbUpdates.data_nascimento = updatesFromBody.dataNascimento;

            updatedUserRaw = await CuidadorModel.update(id, dbUpdates);
            userProfile = mapCuidadorToProfile(updatedUserRaw);
        } else {
            return res.status(400).json({ message: 'Tipo de conta inválido no token.' });
        }

        if (!userProfile || !updatedUserRaw || (updatedUserRaw.changes === 0 && !await (tipoConta === 'cliente' ? ClienteModel.findById(id) : CuidadorModel.findById(id)))) {
            return res.status(404).json({ message: 'Usuário não encontrado ou nenhum dado para atualizar.' });
        }
        if (updatedUserRaw.changes === 0 && userProfile) {
            return res.status(200).json({ message: "Nenhum dado foi alterado (valores podem ser os mesmos).", profile: userProfile });
        }

        res.status(200).json(userProfile);
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao atualizar perfil.' });
    }
});

// Rota para alterar a senha (Cliente ou Cuidador)
router.put('/profile/password', authMiddleware, async (req, res) => {
    try {
        const { id, tipoConta, email } = req.user;
        const { oldPassword, newPassword } = req.body;
        console.log(`userRoutes.js: Atingiu rota /profile/password PUT. UserID: ${id}, TipoConta: ${tipoConta}`);

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ message: 'Senha atual e nova senha são obrigatórias.' });
        }

        let user;
        if (tipoConta === 'cliente') {
            user = await ClienteModel.findByEmail(email);
        } else if (tipoConta === 'cuidador') {
            user = await CuidadorModel.findByEmail(email);
        } else {
            return res.status(400).json({ message: 'Tipo de conta inválido no token.' });
        }

        if (!user || (user.id_cliente !== id && user.id_cuidador !== id)) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.senha_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Senha atual incorreta.' });
        }

        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        let success = false;
        if (tipoConta === 'cliente') {
            success = await ClienteModel.updatePassword(id, newPasswordHash);
        } else if (tipoConta === 'cuidador') {
            success = await CuidadorModel.updatePassword(id, newPasswordHash);
        }

        if (success) {
            res.status(200).json({ message: 'Senha alterada com sucesso!' });
        } else {
            res.status(500).json({ message: 'Não foi possível alterar a senha.' });
        }

    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao alterar senha.' });
    }
});

// Rota para buscar candidatos para "match"
router.get('/match-candidates', authMiddleware, async (req, res) => {
    console.log('USER_ROUTES: Rota /match-candidates acessada.');
    try {
        const { tipoConta: tipoContaUsuarioLogado, id: idUsuarioLogado } = req.user;
        console.log(`USER_ROUTES: User: ${idUsuarioLogado}, Tipo: ${tipoContaUsuarioLogado}`);
        let candidates = [];

        if (tipoContaUsuarioLogado === 'cliente') {
            console.log('USER_ROUTES: Usuário é cliente, buscando cuidadores...');
            candidates = await CuidadorModel.findAllActiveForMatching();
            console.log('USER_ROUTES: Cuidadores retornados:', candidates);
        } else if (tipoContaUsuarioLogado === 'cuidador') {
            console.log('USER_ROUTES: Usuário é cuidador, buscando clientes...');
            candidates = await ClienteModel.findAllActiveForMatching();
            console.log('USER_ROUTES: Clientes retornados:', candidates);
        } else {
            console.error('USER_ROUTES: Tipo de conta inválido para match:', tipoContaUsuarioLogado);
            return res.status(400).json({ message: 'Tipo de conta do usuário logado é inválido para match.' });
        }
        res.json(candidates);
    } catch (error) {
        console.error('USER_ROUTES: ERRO em /match-candidates:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar candidatos.', errorDetails: error.message });
    }
});

module.exports = router;