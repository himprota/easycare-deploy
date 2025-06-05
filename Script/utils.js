// Scripts/utils.js

window.EasyCareProfileUtils = {
    USER_DATA_KEY: "easyCareUserProfileData_v2",
    MAX_FOTOS_PUBLICAS: 6, // Definido para 6 conforme últimas discussões

    // Adicionado jwtToken e userId aqui para que Utils possa acessá-los globalmente
    jwtToken: null,
    userId: null,
    userType: null, // Pode ser útil para lógica específica de perfil de cuidador/cliente

    dadosPerfil: {
        // Informações da Conta (perfil-geral.js)
        nomeCompleto: "",
        email: "", // Geralmente viria de um processo de login/autenticação
        // senhaAtualMock: "", // Mock de senha, agora vazio - remova se não for mais usado
        ddd: "",
        telefoneNum: "",
        dataNascimento: "", // Input type="date" lida bem com string vazia
        fotoPrincipalUrl: "", // Deixe vazio para usar placeholder via onerror no HTML ou lógica JS

        // Perfil Público (perfil-publico.js)
        fotosPublicas: [], // Será inicializado como Array(MAX_FOTOS_PUBLICAS).fill(null) em carregarDados
        statusTitularidade: "Titular", // "Titular" ou "Dependente" (um valor padrão selecionável)
        cidadeMoradia: "",
        buscaProfissional: "", // Anteriormente bioDetalhada

        preferenciasCuidador: { // Preferências sobre o profissional
            genero: "Indiferente", // Um valor padrão selecionável
            experienciaMinimaAnos: null, // null é um bom default para número opcional
            disponibilidadeHorarios: "", // String vazia para select
            especialidadesDesejadas: []
        },
        cidadesAtendimento: [], // Cidades onde o usuário pode receber cuidados

        publicarTelefone: false,
        telefonePublico: "", // Telefone específico para o perfil público
        publicarEmail: false,
        emailPublico: "", // E-mail específico para o perfil público

        // Campos de estado para alteração de e-mail/senha (controlados por alterar-email.js e alterar-senha.js)
        codigoVerificacaoEmailPendente: null,
        novoEmailPendente: null,
        codigoVerificacaoSenhaPendente: null,
    },

    // Novo método para definir (ou mesclar) os dados do perfil vindos do backend
    setDadosPerfil: function(backendData) {
        // Inicializa fotosPublicas com valores nulos ou existentes do backend
        const initialFotosPublicas = Array(this.MAX_FOTOS_PUBLICAS).fill(null);

        // Se backendData.fotosPublicas existir e for um array válido, mescla com o array inicial
        if (backendData.fotosPublicas && Array.isArray(backendData.fotosPublicas)) {
            backendData.fotosPublicas.forEach((foto, index) => {
                if (index < this.MAX_FOTOS_PUBLICAS) {
                    initialFotosPublicas[index] = foto;
                }
            });
        }

        // Mapeia o telefone completo para DDD e Número
        const ddd = backendData.telefoneCompleto ? backendData.telefoneCompleto.substring(0, 2) : '';
        const telefoneNum = backendData.telefoneCompleto ? backendData.telefoneCompleto.substring(2) : '';

        // Mescla os dados recebidos do backend com a estrutura padrão
        this.dadosPerfil = {
            ...this.dadosPerfil, // Mantém a estrutura padrão e outros valores
            nomeCompleto: backendData.nome || backendData.nomeCompleto || this.dadosPerfil.nomeCompleto,
            email: backendData.email || this.dadosPerfil.email,
            ddd: ddd || this.dadosPerfil.ddd,
            telefoneNum: telefoneNum || this.dadosPerfil.telefoneNum,
            dataNascimento: backendData.dataNascimento || this.dadosPerfil.dataNascimento,
            fotoPrincipalUrl: backendData.fotoPrincipalUrl || this.dadosPerfil.fotoPrincipalUrl,

            // Dados do perfil público (se vierem do backend)
            statusTitularidade: backendData.statusTitularidade || this.dadosPerfil.statusTitularidade,
            cidadeMoradia: backendData.cidadeMoradia || this.dadosPerfil.cidadeMoradia,
            buscaProfissional: backendData.buscaProfissional || this.dadosPerfil.buscaProfissional,
            
            // Preferências do cuidador
            preferenciasCuidador: {
                ...this.dadosPerfil.preferenciasCuidador,
                genero: (backendData.preferenciasCuidador && backendData.preferenciasCuidador.genero) || this.dadosPerfil.preferenciasCuidador.genero,
                experienciaMinimaAnos: (backendData.preferenciasCuidador && backendData.preferenciasCuidador.experienciaMinimaAnos) || this.dadosPerfil.preferenciasCuidador.experienciaMinimaAnos,
                disponibilidadeHorarios: (backendData.preferenciasCuidador && backendData.preferenciasCuidador.disponibilidadeHorarios) || this.dadosPerfil.preferenciasCuidador.disponibilidadeHorarios,
                especialidadesDesejadas: (backendData.preferenciasCuidador && backendData.preferenciasCuidador.especialidadesDesejadas) || this.dadosPerfil.preferenciasCuidador.especialidadesDesejadas
            },
            cidadesAtendimento: backendData.cidadesAtendimento || this.dadosPerfil.cidadesAtendimento,
            
            // Contato público
            publicarTelefone: typeof backendData.publicarTelefone === 'boolean' ? backendData.publicarTelefone : this.dadosPerfil.publicarTelefone,
            telefonePublico: backendData.telefonePublico || this.dadosPerfil.telefonePublico,
            publicarEmail: typeof backendData.publicarEmail === 'boolean' ? backendData.publicarEmail : this.dadosPerfil.publicarEmail,
            emailPublico: backendData.emailPublico || this.dadosPerfil.emailPublico,

            fotosPublicas: initialFotosPublicas, // Usar o array preenchido acima
        };
        this.salvarDadosNoLocalStorage(); // Salva os dados atualizados no localStorage
    },

    carregarDadosDoLocalStorage: function() {
        // Carrega jwtToken, userId e userType do localStorage
        this.jwtToken = localStorage.getItem('jwtToken');
        this.userId = localStorage.getItem('userId');
        this.userType = localStorage.getItem('userType'); // Certifique-se que você está salvando isso no login

        // Inicializa fotosPublicas com nulls antes de tentar carregar do localStorage
        this.dadosPerfil.fotosPublicas = Array(this.MAX_FOTOS_PUBLICAS).fill(null);

        const dadosSalvos = localStorage.getItem(this.USER_DATA_KEY);
        if (dadosSalvos) {
            const dadosParseados = JSON.parse(dadosSalvos);
            const dadosBaseLimpos = JSON.parse(JSON.stringify(this.dadosPerfil)); // Cópia profunda dos defaults limpos

            // Mescla os dados salvos com a estrutura padrão (garantindo que novos campos não quebrem)
            this.dadosPerfil = {
                ...dadosBaseLimpos,
                ...dadosParseados,
                // Tratamento especial para objetos aninhados e arrays
                preferenciasCuidador: {
                    ...(dadosBaseLimpos.preferenciasCuidador),
                    ...(dadosParseados.preferenciasCuidador || {})
                },
                cidadesAtendimento: Array.isArray(dadosParseados.cidadesAtendimento) ? dadosParseados.cidadesAtendimento : [],
                // Garante que fotosPublicas seja um array do tamanho correto, preenchido
                fotosPublicas: (Array.isArray(dadosParseados.fotosPublicas) && dadosParseados.fotosPublicas.length === this.MAX_FOTOS_PUBLICAS)
                                ? dadosParseados.fotosPublicas
                                : Array(this.MAX_FOTOS_PUBLICAS).fill(null)
            };
            
            // Correção adicional para especialidadesDesejadas, caso esteja inconsistente
            if (this.dadosPerfil.preferenciasCuidador && !Array.isArray(this.dadosPerfil.preferenciasCuidador.especialidadesDesejadas)) {
                this.dadosPerfil.preferenciasCuidador.especialidadesDesejadas = [];
            }

        } else {
            // Se não há dados salvos, a estrutura default já está em this.dadosPerfil.
            // Apenas certifique-se de que fotosPublicas está correto.
            this.dadosPerfil.fotosPublicas = Array(this.MAX_FOTOS_PUBLICAS).fill(null);
            this.salvarDadosNoLocalStorage(); // Salva a estrutura inicial
        }
    },

    salvarDadosNoLocalStorage: function() {
        localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(this.dadosPerfil));
    },

    formatarDataInput: function(dataISO) {
        // Certifica-se que dataISO é uma string válida antes de dividir
        return dataISO && typeof dataISO === 'string' ? dataISO.split("T")[0] : "";
    },

    formatarDataView: function(dataISO) {
        if (!dataISO) return "Não informado";
        try {
            // Adicionado 'T00:00:00Z' para garantir que Date.parse interprete como UTC e evite problemas de fuso horário
            const dataObj = new Date(dataISO.split('T')[0] + "T00:00:00Z"); // Pega apenas a parte da data
            if (isNaN(dataObj.getTime())) return "Data inválida";
            return dataObj.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        } catch (e) {
            console.error("Erro ao formatar data para visualização:", dataISO, e);
            return "Data inválida";
        }
    },

    calcularIdade: function(dataNascimentoISO) {
        if (!dataNascimentoISO) return '';
        try {
            const hoje = new Date();
            // Garante que a data de nascimento seja tratada como UTC para evitar problemas de fuso horário
            const nasc = new Date(dataNascimentoISO.split('T')[0] + "T00:00:00Z");
            if (isNaN(nasc.getTime())) return '';

            let idade = hoje.getUTCFullYear() - nasc.getUTCFullYear();
            const mesAtual = hoje.getUTCMonth();
            const diaAtual = hoje.getUTCDate();
            const mesNasc = nasc.getUTCMonth();
            const diaNasc = nasc.getUTCDate();

            if (mesAtual < mesNasc || (mesAtual === mesNasc && diaAtual < diaNasc)) {
                idade--;
            }
            return idade >= 0 ? idade : '';
        } catch (e) {
            console.error("Erro ao calcular idade:", dataNascimentoISO, e);
            return '';
        }
    },

    gerarCodigoVerificacao: function() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    },

    // Exemplo de como formatar telefone para exibição (se necessário em outros lugares)
    formatarTelefoneExibicao: function(ddd, telefoneNum) {
        if (!ddd || !telefoneNum) return "Não informado";
        let numFormatado = telefoneNum.replace(/\D/g, '');
        if (numFormatado.length === 9) {
            numFormatado = numFormatado.replace(/^(\d{5})(\d{4})$/, '$1-$2');
        } else if (numFormatado.length === 8) {
            numFormatado = numFormatado.replace(/^(\d{4})(\d{4})$/, '$1-$2');
        }
        return `(${ddd}) ${numFormatado}`;
    }
};

// Ao carregar o script, carrega os dados do localStorage e autenticação (se existirem)
EasyCareProfileUtils.carregarDadosDoLocalStorage();