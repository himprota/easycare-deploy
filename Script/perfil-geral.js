// Scripts/perfil-geral.js

document.addEventListener("DOMContentLoaded", () => {
    // Utilizando o objeto global definido em utils.js
    const Utils = window.EasyCareProfileUtils;
    if (!Utils) {
        console.error("Fatal: EasyCareProfileUtils não encontrado. Verifique a ordem de inclusão dos scripts.");
        return;
    }

    // --- SELETORES DO DOM (Informações da Conta - Lateral) ---
    const nomeContextoPerfilHeader = document.getElementById("nomeContextoPerfilHeader");

    const formInfoGeral = document.getElementById("formInfoGeralPerfil");
    const fotoUsuarioPreviewLateral = document.getElementById("fotoUsuarioPreviewLateral");
    const inputFotoUsuarioPrincipal = document.getElementById("inputFotoUsuarioPrincipal");
    const nomeArquivoFotoPrincipal = document.getElementById("nomeArquivoFotoPrincipal");

    const viewNomeCompleto = document.getElementById("viewNomeCompletoTitular");
    const editNomeCompleto = document.getElementById("editNomeCompletoTitular");

    // E-mail nesta seção é apenas para visualização ou como campo readonly no formulário
    const viewEmailInfoGeral = document.getElementById("viewEmailTitular");
    const editEmailInfoGeral = document.getElementById("editEmailTitular"); // Input field for email

    const viewTelefone = document.getElementById("viewTelefoneTitular");
    const editDdd = document.getElementById("editDddTitular");
    const editTelefoneNum = document.getElementById("editTelefoneNumTitular");
    const divTelefoneInputs = formInfoGeral ? formInfoGeral.querySelector(".telefone-inputs-painel") : null;

    const viewDataNascimento = document.getElementById("viewDataNascimentoTitular");
    const editDataNascimento = document.getElementById("editDataNascimentoTitular");

    const btnEditarInfoGeral = document.getElementById("btnEditarInfoGeral");
    const btnSalvarInfoGeral = document.getElementById("btnSalvarInfoGeral");
    const btnCancelarInfoGeral = document.getElementById("btnCancelarInfoGeral");

    // Adicionado para a seção de segurança, para garantir que o email de login seja atualizado
    const viewEmailTitularAtual = document.getElementById("viewEmailTitularAtual");


    // --- FUNÇÕES ---

    /**
     * Carrega os dados do usuário do backend e os armazena em Utils.dadosPerfil.
     */
    async function carregarDadosUsuario() {
        const jwtToken = localStorage.getItem('jwtToken');
        const userId = localStorage.getItem('userId'); // Certifique-se que o userId é armazenado no login

        if (!jwtToken || !userId) {
            console.warn('Token JWT ou User ID ausente. Redirecionando para a página inicial.');
            // Redireciona para a página inicial ou de login se não estiver autenticado
            window.location.href = 'index.html';
            return;
        }

        try {
            // Ajuste a URL do endpoint conforme a sua API
            const response = await fetch(`http://localhost:3000/api/user/profile`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwtToken}` // Envia o token JWT
                }
            });

            if (response.ok) {
                const userData = await response.json();
                console.log('Dados do usuário carregados:', userData);

                // Mapeia os dados do backend para o formato esperado por Utils.dadosPerfil
                // Assumindo que 'telefoneCompleto' vem como uma string "DDNUMERO"
                const ddd = userData.telefoneCompleto ? userData.telefoneCompleto.substring(0, 2) : '';
                const telefoneNum = userData.telefoneCompleto ? userData.telefoneCompleto.substring(2) : '';

                // Preenche Utils.dadosPerfil
                Utils.dadosPerfil = {
                    nomeCompleto: userData.nome || userData.nomeCompleto || 'Usuário EasyCare',
                    email: userData.email,
                    ddd: ddd,
                    telefoneNum: telefoneNum,
                    dataNascimento: userData.dataNascimento, // Assumindo formato YYYY-MM-DD
                    fotoPrincipalUrl: userData.fotoPrincipalUrl || null, // Se tiver URL de foto
                    // ...outros dados que você precisar para o perfil público
                    // Ex: statusTitularidade, cidadeMoradia, buscaProfissional, etc.
                };

                // Salva os dados no localStorage via Utils (se Utils tiver essa função)
                Utils.salvarDadosNoLocalStorage();

                // Após carregar os dados, popular as views
                popularInfoGeralView();
                // A seção de segurança (alterar email/senha) também usa o email
                if (viewEmailTitularAtual) {
                    viewEmailTitularAtual.textContent = Utils.dadosPerfil.email || 'Não informado';
                }

            } else if (response.status === 401 || response.status === 403) {
                console.error('Autenticação falhou ou token inválido. Redirecionando para login.');
                localStorage.removeItem('jwtToken');
                localStorage.removeItem('userId');
                localStorage.removeItem('userType'); // Se estiver usando
                window.location.href = 'index.html'; // Redireciona para a página inicial/login
            } else {
                console.error('Erro ao carregar dados do usuário:', response.status);
                alert('Erro ao carregar dados do perfil. Tente novamente mais tarde.');
            }
        } catch (error) {
            console.error('Erro de rede ao buscar dados do usuário:', error);
            alert('Erro de conexão ao carregar perfil. Verifique sua rede ou tente novamente mais tarde.');
        }
    }


    function popularInfoGeralView() {
        if (!Utils.dadosPerfil) return;

        if (nomeContextoPerfilHeader) {
            nomeContextoPerfilHeader.textContent = Utils.dadosPerfil.nomeCompleto?.split(" ")[0] || "Você";
        }
        if (previewNomeIdadeMatch) {
            const idade = Utils.calcularIdade(Utils.dadosPerfil.dataNascimento);
            previewNomeIdadeMatch.textContent = `${Utils.dadosPerfil.nomeCompleto || 'Nome não informado'}${idade ? ` (${idade})` : ''}`;
        }
    }

    function popularInfoGeralEdit() {
        if (!Utils.dadosPerfil) return;

        editNomeCompleto.value = Utils.dadosPerfil.nomeCompleto;
        editDdd.value = Utils.dadosPerfil.ddd;
        editTelefoneNum.value = Utils.dadosPerfil.telefoneNum;
        editDataNascimento.value = Utils.formatarDataInput(Utils.dadosPerfil.dataNascimento);
        nomeArquivoFotoPrincipal.textContent = ""; // Limpa nome do arquivo ao entrar em modo de edição
    }

    function alternarModoEdicaoInfoGeral(emEdicao) {
        // Elementos de visualização
        viewNomeCompleto.classList.toggle('hidden-input', emEdicao);
        viewTelefone.classList.toggle('hidden-input', emEdicao);
        viewDataNascimento.classList.toggle('hidden-input', emEdicao);
        // O e-mail de visualização (viewEmailInfoGeral) e o input (editEmailInfoGeral) são tratados de forma especial
        // viewEmailInfoGeral sempre visível OU some se o input for visível.
        // editEmailInfoGeral (readonly) só aparece no modo de edição, mas continua readonly.
        viewEmailInfoGeral.classList.toggle('hidden-input', emEdicao);
        editEmailInfoGeral.classList.toggle('hidden-input', !emEdicao);

        // Campos de edição
        editNomeCompleto.classList.toggle('hidden-input', !emEdicao);
        if (divTelefoneInputs) divTelefoneInputs.classList.toggle('hidden-input', !emEdicao);
        editDataNascimento.classList.toggle('hidden-input', !emEdicao);

        // Botões de ação
        btnEditarInfoGeral.classList.toggle('hidden-input', emEdicao);
        btnSalvarInfoGeral.classList.toggle('hidden-input', !emEdicao);
        btnCancelarInfoGeral.classList.toggle('hidden-input', !emEdicao);
    }

    // Função a ser chamada após salvar e atualizar os dados no backend
    // ATENÇÃO: Esta função AGORA SIMULARÁ a chamada ao backend.
    async function finalizarSalvarInfoGeral() {
        if (!Utils.dadosPerfil) return;

        const jwtToken = localStorage.getItem('jwtToken');
        const userId = localStorage.getItem('userId');

        if (!jwtToken || !userId) {
            alert('Sessão expirada ou usuário não logado. Por favor, faça login novamente.');
            window.location.href = 'index.html';
            return;
        }

        // Coleta os dados para enviar ao backend
        const dadosParaAtualizar = {
            nomeCompleto: editNomeCompleto.value.trim(),
            // Email não é alterado aqui, pois tem uma seção separada para isso
            telefoneCompleto: `${editDdd.value.trim()}${editTelefoneNum.value.trim()}`,
            dataNascimento: editDataNascimento.value,
            // Se houver uma nova foto selecionada, você precisará enviá-la
            // Pode ser como base64 se seu backend aceitar, ou como FormData
            fotoPrincipalUrl: Utils.dadosPerfil.fotoPrincipalUrl // Mantém a URL atual ou a nova base64
        };

        // Simulação de upload de foto se um novo arquivo foi selecionado
        const arquivoFoto = inputFotoUsuarioPrincipal.files[0];
        if (arquivoFoto) {
            const reader = new FileReader();
            reader.onload = async (event) => {
                dadosParaAtualizar.fotoPrincipalUrl = event.target.result; // Base64 da nova foto

                try {
                    const response = await fetch(`http://localhost:3000/api/users/${userId}`, {
                        method: 'PUT', // Ou PATCH, dependendo da sua API
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${jwtToken}`
                        },
                        body: JSON.stringify(dadosParaAtualizar)
                    });

                    if (response.ok) {
                        const resultado = await response.json();
                        console.log("Informações gerais atualizadas com sucesso:", resultado);
                        // Atualiza Utils.dadosPerfil com a resposta mais recente do servidor
                        // para garantir que os dados exibidos estejam em sync
                        Utils.dadosPerfil = {
                            ...Utils.dadosPerfil, // Mantém propriedades não atualizadas
                            nomeCompleto: resultado.nomeCompleto || resultado.nome,
                            telefoneCompleto: resultado.telefoneCompleto,
                            dataNascimento: resultado.dataNascimento,
                            fotoPrincipalUrl: resultado.fotoPrincipalUrl
                        };
                        Utils.salvarDadosNoLocalStorage(); // Atualiza no localStorage
                        alert("Informações da conta salvas com sucesso!");
                        popularInfoGeralView(); // Atualiza a view com os novos dados
                        alternarModoEdicaoInfoGeral(false);
                        // Tenta chamar outras funções de atualização (se existirem e estiverem no Utils)
                        if (typeof Utils.refreshPublicProfileView === 'function') {
                            Utils.refreshPublicProfileView();
                        }
                        if (typeof Utils.updateSecuritySectionViews === 'function') {
                            Utils.updateSecuritySectionViews();
                        }
                    } else {
                        const errorData = await response.json();
                        console.error("Erro ao salvar informações gerais:", response.status, errorData);
                        alert(`Erro ao salvar: ${errorData.message || 'Verifique os dados e tente novamente.'}`);
                    }
                } catch (error) {
                    console.error("Erro de rede ao salvar informações gerais:", error);
                    alert('Erro de conexão ao salvar. Verifique sua rede.');
                }
            }
            reader.readAsDataURL(arquivoFoto);
        } else {
            // Se não tem nova foto, envia os outros dados diretamente
            try {
                const response = await fetch(`http://localhost:3000/api/users/${userId}`, {
                    method: 'PUT', // Ou PATCH
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${jwtToken}`
                    },
                    body: JSON.stringify(dadosParaAtualizar)
                });

                if (response.ok) {
                    const resultado = await response.json();
                    console.log("Informações gerais atualizadas com sucesso:", resultado);
                    // Atualiza Utils.dadosPerfil com a resposta mais recente do servidor
                    Utils.dadosPerfil = {
                        ...Utils.dadosPerfil,
                        nomeCompleto: resultado.nomeCompleto || resultado.nome,
                        telefoneCompleto: resultado.telefoneCompleto,
                        dataNascimento: resultado.dataNascimento,
                        fotoPrincipalUrl: resultado.fotoPrincipalUrl
                    };
                    Utils.salvarDadosNoLocalStorage();
                    alert("Informações da conta salvas com sucesso!");
                    popularInfoGeralView();
                    alternarModoEdicaoInfoGeral(false);
                    if (typeof Utils.refreshPublicProfileView === 'function') {
                        Utils.refreshPublicProfileView();
                    }
                    if (typeof Utils.updateSecuritySectionViews === 'function') {
                        Utils.updateSecuritySectionViews();
                    }
                } else {
                    const errorData = await response.json();
                    console.error("Erro ao salvar informações gerais:", response.status, errorData);
                    alert(`Erro ao salvar: ${errorData.message || 'Verifique os dados e tente novamente.'}`);
                }
            } catch (error) {
                console.error("Erro de rede ao salvar informações gerais:", error);
                alert('Erro de conexão ao salvar. Verifique sua rede.');
            }
        }
    }


    // --- EVENT LISTENERS ---
    if (btnEditarInfoGeral) {
        btnEditarInfoGeral.addEventListener("click", () => {
            popularInfoGeralEdit();
            alternarModoEdicaoInfoGeral(true);
        });
    }

    if (btnCancelarInfoGeral) {
        btnCancelarInfoGeral.addEventListener("click", () => {
            alternarModoEdicaoInfoGeral(false);
            // Restaura a foto de preview para a salva, caso o usuário tenha selecionado um novo arquivo mas cancelou
            fotoUsuarioPreviewLateral.src = Utils.dadosPerfil.fotoPrincipalUrl || 'https://placehold.co/150x150/007ac2/fdfcf0?text=Sua+Foto';
            nomeArquivoFotoPrincipal.textContent = "";
            if (inputFotoUsuarioPrincipal) inputFotoUsuarioPrincipal.value = ""; // Limpa seleção de arquivo
        });
    }

    if (formInfoGeral) {
        formInfoGeral.addEventListener("submit", (e) => {
            e.preventDefault();
            // As validações dos campos devem ser adicionadas aqui
            // Ex: validar nomeCompleto, ddd, telefoneNum, dataNascimento
            // Se as validações passarem, chama finalizarSalvarInfoGeral();
            finalizarSalvarInfoGeral(); // Agora esta função lida com o fetch
        });
    }

    if (inputFotoUsuarioPrincipal) {
        inputFotoUsuarioPrincipal.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                nomeArquivoFotoPrincipal.textContent = `Arquivo: ${file.name}`;
                const reader = new FileReader();
                reader.onload = (event) => {
                    fotoUsuarioPreviewLateral.src = event.target.result; // Preview imediato
                }
                reader.readAsDataURL(file);
            } else {
                nomeArquivoFotoPrincipal.textContent = "";
                // Se nenhum arquivo for selecionado (ou a seleção for cancelada), reverte para a foto salva.
                fotoUsuarioPreviewLateral.src = Utils.dadosPerfil.fotoPrincipalUrl || 'https://placehold.co/150x150/007ac2/fdfcf0?text=Sua+Foto';
            }
        });
    }

    // --- INICIALIZAÇÃO ---
    // Chama a função para carregar dados do usuário ao carregar a página
    // e só depois popular as views
    if (document.getElementById("painelClienteLogado")) { // Verifica se a estrutura do painel existe
        carregarDadosUsuario(); // Chama a função para carregar dados do usuário ao carregar a página
    } else {
        console.warn("Elemento principal do painel (painelClienteLogado) não encontrado. Funcionalidades de perfil-geral.js podem não operar.");
    }
});