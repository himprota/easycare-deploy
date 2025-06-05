// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
console.log('JWT_SECRET no authRoutes:', process.env.JWT_SECRET);

const ClienteModel = require('../models/clienteModel');
const CuidadorModel = require('../models/cuidadorModel');
const crypto = require('crypto'); // NOVO: Módulo nativo do Node.js para geração de tokens

// Rota de Cadastro de Novo Usuário (Cliente ou Cuidador)
router.post('/register', async (req, res) => {
    // Campos básicos esperados do frontend
    const {
        tipoUsuario, nome, email, telefoneCompleto, dataNascimento, cpf, senha,
        // Campos de perfil do Cliente (se enviados no cadastro)
        statusTitularidade, cidadeMoradia, buscaProfissional,
        // ... outros campos específicos de cliente que podem vir do formulário ...

        // Campos de perfil do Cuidador (se enviados no cadastro - AGORA REMOVIDOS PARA SIMPLIFICAÇÃO INICIAL)
        // cidadeAtuacao, descricaoServicos, etc. Se forem adicionados de volta ao CuidadorModel,
        // precisariam ser extraídos aqui também. Por ora, Cuidador só terá os campos básicos.
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

        // Dados comuns para ambos os tipos de usuário
        const commonData = {
            nomeCompleto: nome,
            email,
            ddd,
            telefone,
            dataNascimento,
            cpf,
            senha // Senha em texto plano, o model fará o hash
        };

        if (tipoUsuario === 'cliente') {
            const clienteExistente = await ClienteModel.findByEmailOrCpf(email, cpf);
            if (clienteExistente) {
                return res.status(409).json({ message: `Este ${clienteExistente.email === email ? 'e-mail' : 'CPF'} já está cadastrado como cliente.` });
            }
            // Adiciona campos específicos de Cliente se existirem
            const clienteData = {
                ...commonData,
                statusTitularidade, // Virá como undefined se não enviado, o model trata com '|| null'
                cidadeMoradia,
                buscaProfissional,
                // Adicione outros campos de perfil de cliente aqui se forem coletados no cadastro
                // Ex: prefGeneroCuidador: req.body.prefGeneroCuidador
            };
            novoUsuarioRegistrado = await ClienteModel.create(clienteData);
            userId = novoUsuarioRegistrado.id_cliente;
            userTypeForToken = 'cliente';
        } else if (tipoUsuario === 'cuidador') {
            const cuidadorExistente = await CuidadorModel.findByEmailOrCpf(email, cpf);
            if (cuidadorExistente) {
                return res.status(409).json({ message: `Este ${cuidadorExistente.email === email ? 'e-mail' : 'CPF'} já está cadastrado como cuidador.` });
            }
            // Com a simplificação, cuidadorData usa apenas commonData para o cadastro inicial
            const cuidadorData = { ...commonData };
            novoUsuarioRegistrado = await CuidadorModel.create(cuidadorData);
            userId = novoUsuarioRegistrado.id_cuidador;
            userTypeForToken = 'cuidador';
        } else {
            return res.status(400).json({ message: 'Tipo de usuário inválido. Deve ser "cliente" ou "cuidador".' });
        }

        // Não é ideal gerar token no registro; geralmente o usuário faz login depois.
        // Mas se for necessário, aqui está:
        const payload = { user: { id: userId, email: novoUsuarioRegistrado.email, tipoConta: userTypeForToken } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

        res.status(201).json({
            message: `${userTypeForToken.charAt(0).toUpperCase() + userTypeForToken.slice(1)} cadastrado(a) com sucesso!`,
            token: token, // Retornando o token no cadastro
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
        let userIdField = null; // Para pegar o nome correto do campo ID (id_cliente ou id_cuidador)

        user = await ClienteModel.findByEmail(email);
        if (user && user.ativo) { // Verifica se o usuário está ativo
            userType = 'cliente';
            userIdField = 'id_cliente';
        } else if (user && !user.ativo) {
            return res.status(401).json({ message: 'Conta de cliente inativa.' });
        }

        if (!user) { // Se não for cliente, tenta como cuidador
            user = await CuidadorModel.findByEmail(email);
            if (user && user.ativo) { // Verifica se o usuário está ativo
                userType = 'cuidador';
                userIdField = 'id_cuidador';
            } else if (user && !user.ativo) {
                return res.status(401).json({ message: 'Conta de cuidador inativa.' });
            }
        }

        if (!user) { // Se não encontrou em nenhuma tabela ou não estava ativo e já retornou
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        const isMatch = await bcrypt.compare(senha, user.senha_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        // Atualiza o último login
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
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    console.log(`authRoutes.js: Atingiu rota /forgot-password POST para email: ${email}`); // Log para depuração

    if (!email) {
        return res.status(400).json({ message: 'E-mail é obrigatório.' });
    }

    try {
        let user = await ClienteModel.findByEmail(email);
        let tipoConta = 'cliente';

        if (!user) {
            user = await CuidadorModel.findByEmail(email);
            tipoConta = 'cuidador';
        }

        // Importante: Sempre retorne a mesma mensagem para evitar enumeração de usuários
        if (!user) {
            console.log(`authRoutes.js: E-mail ${email} não encontrado, mas enviando resposta de sucesso genérica.`);
            return res.status(200).json({ message: 'Se o e-mail estiver cadastrado, um link de redefinição foi enviado.' });
        }

        // Gerar token único e sua expiração (1 hora a partir de agora)
        const token = crypto.randomBytes(20).toString('hex');
        const expires = Date.now() + 3600000; // 1 hora em milissegundos

        let successSaveToken = false;
        if (tipoConta === 'cliente') {
            successSaveToken = await ClienteModel.saveResetToken(user.id_cliente, token, expires);
        } else { // cuidador
            successSaveToken = await CuidadorModel.saveResetToken(user.id_cuidador, token, expires);
        }

        if (!successSaveToken) {
            console.error(`authRoutes.js: Erro ao salvar token para ${email}.`);
            return res.status(500).json({ message: 'Erro ao gerar token de redefinição.' });
        }

        // Enviar o e-mail (usando o serviço de e-mail)
        await sendResetPasswordEmail(email, token);

        res.status(200).json({ message: 'Se o e-mail estiver cadastrado, um link de redefinição foi enviado.' });

    } catch (error) {
        console.error('authRoutes.js: ERRO em /forgot-password:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao solicitar redefinição de senha.', errorDetails: error.message });
    }
});

// Rota para redefinir a senha (usando o token do e-mail)
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body; // Assume que o token e a nova senha virão no corpo da requisição
    console.log(`authRoutes.js: Atingiu rota /reset-password POST para token: ${token ? token.substring(0, 10) + '...' : 'N/A'}`); // Log para depuração

    if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token e nova senha são obrigatórios.' });
    }

    try {
        let user = await ClienteModel.findByResetToken(token);
        let tipoConta = 'cliente';

        if (!user) {
            user = await CuidadorModel.findByResetToken(token);
            tipoConta = 'cuidador';
        }

        if (!user) {
            console.log(`authRoutes.js: Token inválido ou expirado: ${token}`);
            return res.status(400).json({ message: 'Link de redefinição inválido ou expirado.' });
        }

        // Validação básica da nova senha (adicione validação mais robusta aqui)
        if (newPassword.length < 8) {
            return res.status(400).json({ message: 'A nova senha deve ter no mínimo 8 caracteres.' });
        }
        // Exemplo de validação de requisitos de senha do frontend (minimoLetras, minimoNumeros, caracterEspecial)
        const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]|\\:;"'<>,.?/~`]).{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({ message: 'A nova senha deve conter letras, números e caracteres especiais.' });
        }


        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        let successUpdate = false;
        if (tipoConta === 'cliente') {
            successUpdate = await ClienteModel.updatePasswordAndClearToken(user.id_cliente, newPasswordHash);
        } else { // cuidador
            successUpdate = await CuidadorModel.updatePasswordAndClearToken(user.id_cuidador, newPasswordHash);
        }

        if (successUpdate) {
            res.status(200).json({ message: 'Senha redefinida com sucesso!' });
        } else {
            console.error(`authRoutes.js: Erro ao atualizar senha para user ID ${user.id_cliente || user.id_cuidador} com token ${token}.`);
            res.status(500).json({ message: 'Não foi possível redefinir a senha.' });
        }

    } catch (error) {
        console.error('authRoutes.js: ERRO em /reset-password:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao redefinir senha.', errorDetails: error.message });
    }
});

module.exports = router;