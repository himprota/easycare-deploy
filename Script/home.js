// Script/home.js
document.addEventListener("DOMContentLoaded", () => {
    const conteudoPrincipal = document.getElementById("conteudoPrincipal");
    const headerTopo = document.querySelector(".topo");
    const modalCadastro = document.getElementById("modalCadastro");
    const formCadastro = document.getElementById("formCadastro");
    const modalLogin = document.getElementById("modalLogin");
    const formLogin = document.getElementById("formLogin");
    const modalRecuperarSenha = document.getElementById("modalRecuperarSenha");
    const formRecuperarSenha = document.getElementById("formRecuperarSenha"); // Mantenha a declaração
    const modalContato = document.getElementById("modalContato");
    const formModalContato = document.getElementById("formModalContato");
    const modalAvisoLoginCadastro = document.getElementById(
        "modalAvisoLoginCadastro"
    );
    const modalConfirmarIrParaBusca = document.getElementById(
        "modalConfirmarIrParaBusca"
    );
    const congratsOverlay = document.getElementById("congratsOverlay");
    const abrirModalCadastroBtns = document.querySelectorAll(
        "#headerCadastreSeBtn, #heroCadastreSeBtn, #abrirCadastroDoLogin, #avisoIrParaCadastroBtn"
    );
    const fecharModalCadastroBtn = document.getElementById("fecharModalCadastro");
    const abrirModalLoginBtn = document.getElementById("headerEntrarBtn");
    const avisoIrParaLoginBtn = document.getElementById("avisoIrParaLoginBtn");
    const fecharModalLoginBtn = document.getElementById("fecharModalLogin");
    const abrirRecuperarSenhaLink = document.getElementById(
        "abrirRecuperarSenhaLink"
    );
    const fecharModalRecuperarSenhaBtn = document.getElementById(
        "fecharModalRecuperarSenha"
    );
    const recuperarEmailInput = document.getElementById("recuperarEmail"); // Mantenha a declaração
    const voltarParaLoginLink = document.getElementById("voltarParaLoginLink");
    const btnAbrirModalContato = document.getElementById("btnAbrirModalContato");
    const fecharModalContatoBtn = document.getElementById("fecharModalContato");
    const fecharModalAvisoLoginCadastroBtn = document.getElementById(
        "fecharModalAvisoLoginCadastro"
    );

    const fecharModalConfirmarBuscaBtn = document.getElementById(
        "fecharModalConfirmarBusca"
    );

    const confirmarMatchIrBtn = document.getElementById("confirmarMatchIrBtn");
    const confirmarBuscaFecharBtn = document.getElementById(
        "confirmarBuscaFecharBtn"
    );
    const confirmarBuscaTitle = document.getElementById("confirmarBuscaTitle");
    const confirmarBuscaText = document.getElementById("confirmarBuscaText");
    const congratsCloseBtn = document.getElementById("congratsCloseBtn");
    const congratsTitle = document.getElementById("congratsTitle");
    const congratsText = document.getElementById("congratsText");

    const senhaInput = document.getElementById("senha");
    const confirmarSenhaInput = document.getElementById("confirmarSenha");
    const barraSegurancaContainer = document.getElementById(
        "barraSegurancaContainer"
    );
    const nivelSegurancaDiv = document.getElementById("nivelSeguranca");
    const requisitosSenhaDiv = document.getElementById("requisitosSenha");
    const reqMinimoLetras = document.getElementById("minimoLetras");
    const reqMinimoNumeros = document.getElementById("minimoNumeros");
    const reqCaracterEspecial = document.getElementById("caracterEspecial");
    const reqMinimoComprimento = document.getElementById("minimoComprimento");

    const tipoUsuarioInput = document.getElementById("tipoUsuario");
    const cadastroNomeCompleto = document.getElementById("cadastroNomeCompleto");
    const cadastroEmail = document.getElementById("cadastroEmail");
    const cadastroDddInput = document.getElementById("cadastroDdd");
    const cadastroTelefoneNumInput = document.getElementById(
        "cadastroTelefoneNum"
    );
    const cadastroDataNascimentoInput = document.getElementById(
        "cadastroDataNascimento"
    );
    const cadastroCpf = document.getElementById("cadastroCpf");

    const accordionItems = document.querySelectorAll(".accordion-item");
    const navCadastreSeBtn = document.getElementById("navCadastreSeBtn");
    const navEntrarBtn = document.getElementById("navEntrarBtn");
    const menuHamburguerBtn = document.querySelector(".menu-hamburguer");
    const mainNavigation = document.getElementById("main-navigation");
    const allCustomVideos = document.querySelectorAll(
        "video.custom-video-player"
    );

    let isUserLoggedIn = false;
    let pendingActionAfterLogin = null;

    // =========================================================================================
    // FUNÇÕES GENÉRICAS
    // =========================================================================================

    function abrirModalGenerico(modalElement) {
        if (modalElement && conteudoPrincipal) {
            [
                modalCadastro,
                modalLogin,
                modalRecuperarSenha,
                modalContato,
                modalAvisoLoginCadastro,
                modalConfirmarIrParaBusca,
                congratsOverlay,
            ].forEach((m) => {
                if (m && m !== modalElement && !m.classList.contains("hidden")) {
                    fecharModalGenerico(m, m.querySelector("form"));
                }
            });
            modalElement.classList.remove("hidden");
            modalElement.style.display = 'flex';
            conteudoPrincipal.classList.add("fosco");
            document.body.style.overflow = "hidden";

            if (modalElement === modalCadastro) {
                if (typeof resetarFeedbackSenha === "function") resetarFeedbackSenha();
            }
        }
    }

    function fecharModalGenerico(modalElement, formElement) {
        if (modalElement && conteudoPrincipal) {
            modalElement.classList.add("hidden");
            modalElement.style.display = 'none';
            const algumModalAberto = [
                modalCadastro,
                modalLogin,
                modalRecuperarSenha,
                modalContato,
                modalAvisoLoginCadastro,
                modalConfirmarIrParaBusca,
                congratsOverlay,
            ].some((m) => m && !m.classList.contains("hidden"));
            if (
                !algumModalAberto &&
                mainNavigation &&
                !mainNavigation.classList.contains("menu-aberto")
            ) {
                conteudoPrincipal.classList.remove("fosco");
                document.body.style.overflow = "";
            }
            if (formElement) {
                formElement.reset();
                const elements = formElement.elements;
                for (let i = 0; i < elements.length; i++) {
                    if (typeof elements[i].setCustomValidity === "function") {
                        elements[i].setCustomValidity("");
                    }
                }
            }
            if (modalElement === modalCadastro) {
                if (typeof resetarFeedbackSenha === "function") resetarFeedbackSenha();
            }
        }
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            let fecharBodyOverflow = true;
            if (modalCadastro && !modalCadastro.classList.contains("hidden")) {
                fecharModalGenerico(modalCadastro, formCadastro);
                fecharBodyOverflow = false;
            }
            if (modalLogin && !modalLogin.classList.contains("hidden")) {
                fecharModalGenerico(modalLogin, formLogin);
                fecharBodyOverflow = false;
            }
            if (
                modalRecuperarSenha &&
                !modalRecuperarSenha.classList.contains("hidden")
            ) {
                fecharModalGenerico(modalRecuperarSenha, formRecuperarSenha);
                fecharBodyOverflow = false;
            }
            if (modalContato && !modalContato.classList.contains("hidden")) {
                fecharModalGenerico(modalContato, formModalContato);
                fecharBodyOverflow = false;
            }
            if (
                modalAvisoLoginCadastro &&
                !modalAvisoLoginCadastro.classList.contains("hidden")
            ) {
                fecharModalGenerico(modalAvisoLoginCadastro);
                fecharBodyOverflow = false;
            }
            if (
                modalConfirmarIrParaBusca &&
                !modalConfirmarIrParaBusca.classList.contains("hidden")
            ) {
                fecharModalGenerico(modalConfirmarIrParaBusca);
                pendingActionAfterLogin = null;
                fecharBodyOverflow = false;
            }
            if (congratsOverlay && !congratsOverlay.classList.contains("hidden")) {
                if (typeof fecharCongratsOverlay === "function")
                    fecharCongratsOverlay();
                fecharBodyOverflow = false;
            }
            if (mainNavigation && mainNavigation.classList.contains("menu-aberto")) {
                mainNavigation.classList.remove("menu-aberto");
                menuHamburguerBtn.classList.remove("aberto");
                menuHamburguerBtn.setAttribute("aria-expanded", "false");
                if (fecharBodyOverflow) document.body.style.overflow = "";
            }
        }
    });

    [
        modalCadastro,
        modalLogin,
        modalRecuperarSenha,
        modalContato,
        modalAvisoLoginCadastro,
        modalConfirmarIrParaBusca,
    ].forEach((modal) => {
        if (modal) {
            modal.addEventListener("click", (e) => {
                if (e.target === modal) {
                    const form = modal.querySelector("form");
                    fecharModalGenerico(modal, form);
                    if (
                        modal === modalConfirmarIrParaBusca ||
                        modal === modalAvisoLoginCadastro
                    ) {
                        pendingActionAfterLogin = null;
                    }
                }
            });
        }
    });

    // =========================================================================================
    // LÓGICA ESPECÍFICA DO CADASTRO
    // =========================================================================================

    function formatarTelefone(dddInput, numInput) {
        let ddd = dddInput.value.replace(/\D/g, '');
        if (ddd.length > 2) ddd = ddd.slice(0, 2);
        dddInput.value = ddd;

        let num = numInput.value.replace(/\D/g, '');
        if (num.length > 9) num = num.slice(0, 9);

        if (num.length === 9) {
            num = num.replace(/^(\d{5})(\d{4})$/, '$1-$2');
        } else if (num.length === 8) {
            num = num.replace(/^(\d{4})(\d{4})$/, '$1-$2');
        }
        numInput.value = num;
    }

    if (cadastroDddInput && cadastroTelefoneNumInput) {
        cadastroDddInput.addEventListener('input', () => {
            formatarTelefone(cadastroDddInput, cadastroTelefoneNumInput);
        });
        cadastroTelefoneNumInput.addEventListener('input', () => {
            formatarTelefone(cadastroDddInput, cadastroTelefoneNumInput);
        });
    }

    formCadastro.addEventListener("submit", async (e) => {
        e.preventDefault();

        const nome = cadastroNomeCompleto.value.trim();
        const email = cadastroEmail.value.trim();
        const tipoUsuario = tipoUsuarioInput.value;
        const ddd = cadastroDddInput.value.trim();
        const telefoneBruto = cadastroTelefoneNumInput.value.trim();
        const telefoneLimpo = telefoneBruto.replace(/\D/g, '');
        const dataNascimento = cadastroDataNascimentoInput.value;
        const cpf = cadastroCpf.value.trim();
        const senha = senhaInput.value;
        const confirmarSenha = confirmarSenhaInput.value;

        if (!tipoUsuario) {
            alert("Por favor, selecione se você é um Cliente ou Cuidador(a).");
            tipoUsuarioInput.focus();
            tipoUsuarioInput.setCustomValidity("Selecione uma opção.");
            tipoUsuarioInput.reportValidity();
            return;
        } else {
            tipoUsuarioInput.setCustomValidity("");
        }

        if (senha !== confirmarSenha) {
            alert("As senhas não coincidem!");
            confirmarSenhaInput.setCustomValidity("As senhas não coincidem.");
            confirmarSenhaInput.reportValidity();
            return;
        } else {
            confirmarSenhaInput.setCustomValidity("");
        }

        if (telefoneLimpo.length < 8 || telefoneLimpo.length > 9) {
            alert("Por favor, insira um número de telefone com 8 ou 9 dígitos.");
            cadastroTelefoneNumInput.focus();
            cadastroTelefoneNumInput.setCustomValidity("Número inválido.");
            cadastroTelefoneNumInput.reportValidity();
            return;
        } else {
            cadastroTelefoneNumInput.setCustomValidity("");
        }

        if (typeof verificarSegurancaSenha === "function" && !verificarSegurancaSenha(senha)) {
            alert("A senha não atende aos requisitos mínimos de segurança.");
            senhaInput.focus();
            return;
        }

        const dadosParaEnvio = {
            nome: nome,
            email: email,
            tipoUsuario: tipoUsuario,
            telefoneCompleto: `${ddd}${telefoneLimpo}`,
            dataNascimento: dataNascimento,
            cpf: cpf,
            senha: senha,
        };

        console.log("Dados de Cadastro para envio:", dadosParaEnvio);

        try {
            const response = await fetch('http://localhost:3000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dadosParaEnvio),
            });

            if (response.ok) {
                const resultado = await response.json();
                console.log("Cadastro bem-sucedido:", resultado);

                fecharModalGenerico(modalCadastro, formCadastro);

                if (congratsOverlay && congratsTitle && congratsText) {
                    congratsTitle.textContent = "Cadastro Concluído!";
                    congratsText.textContent = `Parabéns, ${nome}, por se juntar à EasyCare!`;
                    abrirModalGenerico(congratsOverlay);
                }
            } else {
                const erroData = await response.json();
                console.error("Erro no cadastro:", response.status, erroData);
                alert(`Erro ao cadastrar: ${erroData.message || 'Verifique os dados e tente novamente.'}`);
            }
        } catch (error) {
            console.error("Erro na requisição de cadastro:", error);
            alert("Não foi possível conectar ao servidor. Verifique sua conexão ou tente novamente mais tarde.");
        }
    });

    // =========================================================================================
    // MÁSCARAS DE INPUT
    // =========================================================================================

    if (cadastroCpf) {
        cadastroCpf.addEventListener("input", (e) => {
            let value = e.target.value.replace(/\D/g, "");
            if (value.length > 3) value = value.substring(0, 3) + "." + value.substring(3);
            if (value.length > 7) value = value.substring(0, 7) + "." + value.substring(7);
            if (value.length > 11) value = value.substring(0, 11) + "-" + value.substring(11);
            e.target.value = value.slice(0, 14);
        });
    }

    // =========================================================================================
    // LÓGICA EXISTENTE DO BOTÃO "IR PARA MATCH"
    // =========================================================================================

    if (confirmarMatchIrBtn) {
        confirmarMatchIrBtn.addEventListener("click", () => {
            if (modalConfirmarIrParaBusca) {
                fecharModalGenerico(modalConfirmarIrParaBusca);
            }
            window.location.href = "match.html";
        });
    }

    // =========================================================================================
    // LÓGICA DA BARRA DE SEGURANÇA DE SENHA
    // =========================================================================================

    function verificarSegurancaSenha(senha) {
        const minLength = 8;
        const hasLetters = /[a-zA-Z]/.test(senha);
        const hasNumbers = /[0-9]/.test(senha);
        const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(senha);

        reqMinimoComprimento.classList.toggle("valido", senha.length >= minLength);
        reqMinimoLetras.classList.toggle("valido", hasLetters);
        reqMinimoNumeros.classList.toggle("valido", hasNumbers);
        reqCaracterEspecial.classList.toggle("valido", hasSpecial);

        let forca = 0;
        if (senha.length >= minLength) forca += 1;
        if (hasLetters) forca += 1;
        if (hasNumbers) forca += 1;
        if (hasSpecial) forca += 1;

        switch (forca) {
            case 0:
            case 1:
                nivelSegurancaDiv.style.width = "25%";
                nivelSegurancaDiv.style.backgroundColor = "#e74c3c";
                break;
            case 2:
                nivelSegurancaDiv.style.width = "50%";
                nivelSegurancaDiv.style.backgroundColor = "#f39c12";
                break;
            case 3:
                nivelSegurancaDiv.style.width = "75%";
                nivelSegurancaDiv.style.backgroundColor = "#f1c40f";
                break;
            case 4:
                nivelSegurancaDiv.style.width = "100%";
                nivelSegurancaDiv.style.backgroundColor = "#27ae60";
                break;
        }
        return forca === 4;
    }

    function resetarFeedbackSenha() {
        if (barraSegurancaContainer)
            barraSegurancaContainer.classList.add("hidden");
        if (nivelSegurancaDiv) {
            nivelSegurancaDiv.style.width = "0%";
            nivelSegurancaDiv.style.backgroundColor = "#ccc";
        }
        if (requisitosSenhaDiv) {
            const requisitos = requisitosSenhaDiv.querySelectorAll("p");
            requisitos.forEach((req) => req.classList.remove("valido"));
        }
    }

    if (senhaInput) {
        senhaInput.addEventListener("input", () => {
            if (barraSegurancaContainer)
                barraSegurancaContainer.classList.remove("hidden");
            verificarSegurancaSenha(senhaInput.value);
        });

        senhaInput.addEventListener("focus", () => {
            if (barraSegurancaContainer)
                barraSegurancaContainer.classList.remove("hidden");
            if (requisitosSenhaDiv) requisitosSenhaDiv.classList.remove("hidden");
            verificarSegurancaSenha(senhaInput.value);
        });

        senhaInput.addEventListener("blur", () => {
            // Não esconder ao perder o foco se a senha for inválida ou para permitir que o usuário veja os requisitos
        });
    }

    if (confirmarSenhaInput) {
        confirmarSenhaInput.addEventListener("input", () => {
            if (senhaInput.value !== confirmarSenhaInput.value) {
                confirmarSenhaInput.setCustomValidity("As senhas não coincidem.");
            } else {
                confirmarSenhaInput.setCustomValidity("");
            }
        });
    }

    // =========================================================================================
    // LÓGICA DE ABERTURA E FECHAMENTO DE MODAIS (E AQUI REMOVIDO A LOGICA DE SUBMISSÃO DA RECUPERAÇÃO DE SENHA)
    // =========================================================================================

    abrirModalCadastroBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            abrirModalGenerico(modalCadastro);
        });
    });

    if (fecharModalCadastroBtn) {
        fecharModalCadastroBtn.addEventListener("click", () => {
            fecharModalGenerico(modalCadastro, formCadastro);
        });
    }

    if (abrirModalLoginBtn) {
        abrirModalLoginBtn.addEventListener("click", () => {
            abrirModalGenerico(modalLogin);
        });
    }

    if (avisoIrParaLoginBtn) {
        avisoIrParaLoginBtn.addEventListener("click", () => {
            fecharModalGenerico(modalAvisoLoginCadastro);
            abrirModalGenerico(modalLogin);
        });
    }

    if (fecharModalLoginBtn) {
        fecharModalLoginBtn.addEventListener("click", () => {
            fecharModalGenerico(modalLogin, formLogin);
        });
    }

    if (abrirRecuperarSenhaLink) {
        abrirRecuperarSenhaLink.addEventListener("click", (e) => {
            e.preventDefault();
            fecharModalGenerico(modalLogin, formLogin);
            abrirModalGenerico(modalRecuperarSenha);
        });
    }

    if (fecharModalRecuperarSenhaBtn) {
        fecharModalRecuperarSenhaBtn.addEventListener("click", () => {
            fecharModalGenerico(modalRecuperarSenha, formRecuperarSenha);
        });
    }

    if (voltarParaLoginLink) {
        voltarParaLoginLink.addEventListener("click", (e) => {
            e.preventDefault();
            fecharModalGenerico(modalRecuperarSenha, formRecuperarSenha);
            abrirModalGenerico(modalLogin);
        });
    }

    if (formLogin) {
        formLogin.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("loginEmail").value;
            const senha = document.getElementById("loginSenha").value;

            console.log("Tentando login com:", { email, senha });

            try {
                const response = await fetch('http://localhost:3000/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, senha }),
                });

                if (response.ok) {
                    const resultado = await response.json();
                    console.log("Login bem-sucedido:", resultado);

                    isUserLoggedIn = true;

                    localStorage.setItem('jwtToken', resultado.token);
                    localStorage.setItem('userId', resultado.userId);
                    localStorage.setItem('userType', resultado.tipoConta || 'default');

                    fecharModalGenerico(modalLogin, formLogin);

                    if (pendingActionAfterLogin === "goToMatch" && resultado.token) {
                        window.location.href = 'match.html';
                        pendingActionAfterLogin = null;
                    } else if (resultado.token) {
                        window.location.href = 'perfil.html';
                    }

                } else {
                    const erroData = await response.json();
                    console.error("Erro no login:", response.status, erroData);
                    fecharModalGenerico(modalLogin, formLogin);
                    if (modalAvisoLoginCadastro) {
                        const avisoTitleEl = modalAvisoLoginCadastro.querySelector('h2');
                        const avisoTextEl = modalAvisoLoginCadastro.querySelector('.modal-description');

                        if (avisoTitleEl) avisoTitleEl.textContent = "Erro no Login";
                        if (avisoTextEl) avisoTextEl.textContent = `Erro ao fazer login: ${erroData.message || 'Email ou senha incorretos.'}`;
                        abrirModalGenerico(modalAvisoLoginCadastro);
                    } else {
                        alert(`Erro ao fazer login: ${erroData.message || 'Email ou senha incorretos.'}`);
                    }
                }
            } catch (error) {
                console.error("Erro na requisição de login:", error);
                fecharModalGenerico(modalLogin, formLogin);
                if (modalAvisoLoginCadastro) {
                    const avisoTitleEl = modalAvisoLoginCadastro.querySelector('h2');
                    const avisoTextEl = modalAvisoLoginCadastro.querySelector('.modal-description');
                    if (avisoTitleEl) avisoTitleEl.textContent = "Erro de Conexão";
                    if (avisoTextEl) avisoTextEl.textContent = "Não foi possível conectar ao servidor. Verifique sua conexão ou tente novamente mais tarde.";
                    abrirModalGenerico(modalAvisoLoginCadastro);
                } else {
                    alert("Não foi possível conectar ao servidor. Verifique sua conexão ou tente novamente mais tarde.");
                }
            }
        });
    }

    if (fecharModalConfirmarBuscaBtn) {
        fecharModalConfirmarBuscaBtn.addEventListener("click", () => {
            fecharModalGenerico(modalConfirmarIrParaBusca);
            pendingActionAfterLogin = null;
        });
    }

    if (confirmarBuscaFecharBtn) {
        confirmarBuscaFecharBtn.addEventListener("click", () => {
            fecharModalGenerico(modalConfirmarIrParaBusca);
            pendingActionAfterLogin = null;
        });
    }

    if (btnAbrirModalContato) {
        btnAbrirModalContato.addEventListener("click", () => {
            abrirModalGenerico(modalContato);
        });
    }

    if (fecharModalContatoBtn) {
        fecharModalContatoBtn.addEventListener("click", () => {
            fecharModalGenerico(modalContato, formModalContato);
        });
    }

    if (formModalContato) {
        formModalContato.addEventListener("submit", (e) => {
            e.preventDefault();
            alert("Sua mensagem foi enviada com sucesso! Entraremos em contato.");
            fecharModalGenerico(modalContato, formModalContato);
        });
    }

    if (fecharModalAvisoLoginCadastroBtn) {
        fecharModalAvisoLoginCadastroBtn.addEventListener("click", () => {
            fecharModalGenerico(modalAvisoLoginCadastro);
            pendingActionAfterLogin = null;
        });
    }

    if (congratsCloseBtn) {
        congratsCloseBtn.addEventListener("click", () => {
            if (congratsOverlay) fecharCongratsOverlay();
        });
    }

    function fecharCongratsOverlay() {
        if (congratsOverlay) {
            congratsOverlay.classList.add("hidden");
            congratsOverlay.style.display = 'none';

            const algumModalAberto = [
                modalCadastro,
                modalLogin,
                modalRecuperarSenha,
                modalContato,
                modalAvisoLoginCadastro,
                modalConfirmarIrParaBusca,
                congratsOverlay,
            ].some((m) => m && !m.classList.contains("hidden"));

            if (
                !algumModalAberto &&
                mainNavigation &&
                !mainNavigation.classList.contains("menu-aberto") &&
                conteudoPrincipal
            ) {
                conteudoPrincipal.classList.remove("fosco");
                document.body.style.overflow = "";
            }
        }
    }

    // =========================================================================================
    // LÓGICA DE NAVEGAÇÃO / OUTROS COMPONENTES
    // =========================================================================================

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", function (e) {
            const targetId = this.getAttribute("href");
            if (
                [
                    "#modalCadastro",
                    "#modalLogin",
                    "#modalRecuperarSenha",
                    "#modalContato",
                    "#modalAvisoLoginCadastro",
                    "#modalConfirmarIrParaBusca",
                ].includes(targetId) || targetId === "#"
            ) {
                if (targetId !== "#") e.preventDefault();
                return;
            }

            e.preventDefault();
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: "smooth",
                });
                if (mainNavigation && mainNavigation.classList.contains("menu-aberto")) {
                    mainNavigation.classList.remove("menu-aberto");
                    menuHamburguerBtn.classList.remove("aberto");
                    menuHamburguerBtn.setAttribute("aria-expanded", "false");
                    const algumModalAberto = [modalCadastro, modalLogin, modalRecuperarSenha, modalContato, modalAvisoLoginCadastro, modalConfirmarIrParaBusca, congratsOverlay].some(m => m && !m.classList.contains("hidden"));
                    if (!algumModalAberto) {
                        document.body.style.overflow = "";
                        if (conteudoPrincipal) conteudoPrincipal.classList.remove("fosco");
                    }
                }
            }
        });
    });

    if (menuHamburguerBtn && mainNavigation) {
        menuHamburguerBtn.addEventListener("click", () => {
            mainNavigation.classList.toggle("menu-aberto");
            menuHamburguerBtn.classList.toggle("aberto");
            const expanded = menuHamburguerBtn.classList.contains("aberto");
            menuHamburguerBtn.setAttribute("aria-expanded", expanded);
            if (expanded) {
                document.body.style.overflow = "hidden";
                if (conteudoPrincipal) conteudoPrincipal.classList.add("fosco");
            } else {
                const algumModalAberto = [
                    modalCadastro,
                    modalLogin,
                    modalRecuperarSenha,
                    modalContato,
                    modalAvisoLoginCadastro,
                    modalConfirmarIrParaBusca,
                    congratsOverlay,
                ].some((m) => m && !m.classList.contains("hidden"));
                if (!algumModalAberto) {
                    document.body.style.overflow = "";
                    if (conteudoPrincipal) conteudoPrincipal.classList.remove("fosco");
                }
            }
        });
    }

    accordionItems.forEach((item) => {
        const header = item.querySelector(".accordion-header");
        header.addEventListener("click", () => {
            const currentlyActive = document.querySelector(
                ".accordion-item.active"
            );
            if (currentlyActive && currentlyActive !== item) {
                currentlyActive.classList.remove("active");
            }
            item.classList.toggle("active");
        });
    });

    allCustomVideos.forEach((video) => {
        const playButton = video.nextElementSibling;
        if (playButton && playButton.classList.contains("play-button")) {
            playButton.addEventListener("click", () => {
                if (video.paused) {
                    video.play();
                    playButton.style.display = "none";
                }
            });
            video.addEventListener("pause", () => {
                playButton.style.display = "flex";
            });
            video.addEventListener("ended", () => {
                playButton.style.display = "flex";
            });
        }
    });

    const btnIniciarCorrespondente = document.getElementById('btnIniciarCorrespondente');
    if (btnIniciarCorrespondente) {
        btnIniciarCorrespondente.addEventListener('click', () => {
            const token = localStorage.getItem('jwtToken');
            if (token) {
                window.location.href = 'match.html';
            } else {
                pendingActionAfterLogin = "goToMatch";

                if (modalAvisoLoginCadastro) {
                    const avisoTitleEl = modalAvisoLoginCadastro.querySelector('h2');
                    const avisoTextEl = modalAvisoLoginCadastro.querySelector('.modal-description');
                    if (avisoTitleEl) avisoTitleEl.textContent = "Acesso Restrito";
                    if (avisoTextEl) avisoTextEl.textContent = "Para encontrar seu correspondente ideal, você precisa se cadastrar ou fazer login na plataforma.";
                    abrirModalGenerico(modalAvisoLoginCadastro);
                } else {
                    alert("Para encontrar seu correspondente ideal, você precisa se cadastrar ou fazer login.");
                }
            }
        });
    }

    if (navCadastreSeBtn) {
        navCadastreSeBtn.addEventListener('click', () => {
            abrirModalGenerico(modalCadastro);
            if (mainNavigation && mainNavigation.classList.contains("menu-aberto")) {
                mainNavigation.classList.remove("menu-aberto");
                menuHamburguerBtn.classList.remove("aberto");
                menuHamburguerBtn.setAttribute("aria-expanded", "false");
            }
        });
    }
    if (navEntrarBtn) {
        navEntrarBtn.addEventListener('click', () => {
            abrirModalGenerico(modalLogin);
            if (mainNavigation && mainNavigation.classList.contains("menu-aberto")) {
                mainNavigation.classList.remove("menu-aberto");
                menuHamburguerBtn.classList.remove("aberto");
                menuHamburguerBtn.setAttribute("aria-expanded", "false");
            }
        });
    }
});