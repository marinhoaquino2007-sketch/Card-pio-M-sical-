/* =========================================================
   PAINEL DOS ARTISTAS
   LILIAN E MARINHO
   V1
   ========================================================= */

const SUPABASE_URL =
    "https://draghvtqqrwpdbveweki.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_-9VJebAOVl5_1a_ukBEIxA_0iy9pa14";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );

    /* =========================================================
   NOTIFICAÇÃO DE NOVOS PEDIDOS
   ========================================================= */

let canalPedidos = null;
let audioContextNotificacao = null;
let somNotificacaoLiberado = false;


/* =========================================================
   PREPARAR SOM
   ========================================================= */

function prepararSomNotificacao() {

    if (somNotificacaoLiberado) {
        return;
    }

    try {

        const AudioContext =
            window.AudioContext ||
            window.webkitAudioContext;

        if (!AudioContext) {
            console.warn(
                "AudioContext não disponível neste navegador."
            );
            return;
        }

        if (!audioContextNotificacao) {

            audioContextNotificacao =
                new AudioContext();

        }

        if (
            audioContextNotificacao.state ===
            "suspended"
        ) {

            audioContextNotificacao.resume();

        }

        somNotificacaoLiberado = true;

        console.log(
            "🔊 Som de notificação liberado."
        );

    } catch (erro) {

        console.error(
            "Erro ao preparar som:",
            erro
        );

    }

}


/* =========================================================
   TOCAR SOM DE NOVO PEDIDO
   ========================================================= */

function tocarSomNotificacaoPedido() {

    try {

        prepararSomNotificacao();

        if (!audioContextNotificacao) {
            return;
        }

        const agora =
            audioContextNotificacao.currentTime;


        const oscilador =
            audioContextNotificacao.createOscillator();

        const ganho =
            audioContextNotificacao.createGain();


        oscilador.type = "sine";


        oscilador.frequency.setValueAtTime(
            880,
            agora
        );

        oscilador.frequency.setValueAtTime(
            1174,
            agora + 0.12
        );


        ganho.gain.setValueAtTime(
            0.0001,
            agora
        );

        ganho.gain.exponentialRampToValueAtTime(
            0.25,
            agora + 0.02
        );

        ganho.gain.exponentialRampToValueAtTime(
            0.0001,
            agora + 0.45
        );


        oscilador.connect(ganho);

        ganho.connect(
            audioContextNotificacao.destination
        );


        oscilador.start(agora);

        oscilador.stop(
            agora + 0.5
        );


        console.log(
            "🔔 Som de novo pedido."
        );

    } catch (erro) {

        console.error(
            "Erro ao tocar som de notificação:",
            erro
        );

    }

}


/* =========================================================
   ESCUTAR NOVOS PEDIDOS EM TEMPO REAL
   ========================================================= */

function iniciarNotificacaoPedidos() {

    if (canalPedidos) {

        console.log(
            "Canal de pedidos já está ativo."
        );

        return;

    }


    console.log(
        "🔔 Iniciando monitoramento de novos pedidos..."
    );


    canalPedidos =
        supabaseClient
            .channel(
                "notificacao-novos-pedidos"
            )
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "pedidos"
                },
                payload => {

                    console.log(
                        "🔔 NOVO PEDIDO RECEBIDO:",
                        payload.new
                    );


                    /* Toca o som */

                    tocarSomNotificacaoPedido();


                    /* Se estiver na aba Pedidos,
                       atualiza a lista */

                    const conteudo =
                        document.getElementById(
                            "conteudoPainel"
                        );


                    const botaoPedidos =
                        document.querySelector(
                            '.menu-painel button[data-aba="pedidos"]'
                        );


                    const pedidosEstaoAbertos =
                        botaoPedidos &&
                        botaoPedidos.classList.contains(
                            "ativo"
                        );


                    if (pedidosEstaoAbertos) {

                        carregarPedidos();

                    }

                }
            )
            .subscribe(
                status => {

                    console.log(
                        "Status do canal de pedidos:",
                        status
                    );

                }
            );

}

/* =========================================================
   INÍCIO
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    iniciarPainel
);

async function iniciarPainel() {

    console.log("Painel iniciado.");

    configurarBotoes();

    document.addEventListener(
        "pointerdown",
        prepararSomNotificacao,
        {
            once: true
        }
    );

    await verificarSessao();

}

/* =========================================================
   BOTÕES
   ========================================================= */

function configurarBotoes() {

    const btnEntrar =
        document.getElementById("btnEntrar");

    const btnSair =
        document.getElementById("btnSair");


    if (btnEntrar) {

        btnEntrar.addEventListener(
            "click",
            entrar
        );

    }


    if (btnSair) {

        btnSair.addEventListener(
            "click",
            sair
        );

    }


    const botoesMenu =
        document.querySelectorAll(
            ".menu-painel button"
        );


    botoesMenu.forEach(botao => {

        botao.addEventListener(
            "click",
            () => {

                const aba =
                    botao.dataset.aba;

                ativarBotaoMenu(botao);

                abrirAba(aba);

            }
        );

    });

}


/* =========================================================
   MENU ATIVO
   ========================================================= */

function ativarBotaoMenu(botaoAtivo) {

    document
        .querySelectorAll(
            ".menu-painel button"
        )
        .forEach(botao => {

            botao.classList.remove(
                "ativo"
            );

        });


    botaoAtivo.classList.add(
        "ativo"
    );

}


/* =========================================================
   SESSÃO
   ========================================================= */

async function verificarSessao() {

    console.log(
        "🔐 Verificando sessão do painel..."
    );


    const {
        data,
        error
    } =
        await supabaseClient.auth.getSession();


    if (error) {

        console.error(
            "Erro ao verificar sessão:",
            error
        );

        mostrarLogin();

        return;

    }


    console.log(
        "Sessão encontrada:",
        data.session
    );


    if (data.session) {

        console.log(
            "✅ Usuário autenticado:",
            data.session.user.email
        );

        console.log(
            "ID do usuário:",
            data.session.user.id
        );

        console.log(
            "Token existe:",
            !!data.session.access_token
        );


        mostrarPainel();

    } else {

        console.warn(
            "⚠️ Nenhuma sessão autenticada encontrada."
        );

        mostrarLogin();

    }

}


/* =========================================================
   LOGIN
   ========================================================= */

async function entrar() {

    const email =
        document
            .getElementById("email")
            .value
            .trim();


    const senha =
        document
            .getElementById("senha")
            .value;


    const mensagem =
        document.getElementById(
            "mensagemLogin"
        );


    if (!email || !senha) {

        mensagem.textContent =
            "Digite seu e-mail e sua senha.";

        return;

    }


    mensagem.textContent =
        "Entrando...";


    const {
        error
    } =
        await supabaseClient.auth
            .signInWithPassword({

                email,
                password: senha

            });


    if (error) {

        console.error(
            "Erro no login:",
            error
        );

        mensagem.textContent =
            "E-mail ou senha inválidos.";

        return;

    }


    mensagem.textContent = "";

    mostrarPainel();

}


/* =========================================================
   SAIR
   ========================================================= */

   async function sair() {

    if (canalPedidos) {

        await supabaseClient.removeChannel(
            canalPedidos
        );

        canalPedidos = null;

        console.log(
            "🔕 Monitoramento de pedidos encerrado."
        );

    }


    await supabaseClient.auth.signOut();

    mostrarLogin();

}

/* =========================================================
   MOSTRAR LOGIN
   ========================================================= */

function mostrarLogin() {

    const login =
        document.getElementById("login");

    const painel =
        document.getElementById("painel");


    if (login) {

        login.classList.remove(
            "oculto"
        );

    }


    if (painel) {

        painel.classList.add(
            "oculto"
        );

    }

}


/* =========================================================
   MOSTRAR PAINEL
   ========================================================= */

   function mostrarPainel() {

    const login =
        document.getElementById("login");

    const painel =
        document.getElementById("painel");


    if (login) {

        login.classList.add(
            "oculto"
        );

    }


    if (painel) {

        painel.classList.remove(
            "oculto"
        );

    }


    mostrarMensagemInicial();


    /* Inicia o monitoramento
       de novos pedidos */

    iniciarNotificacaoPedidos();

}

/* =========================================================
   MENSAGEM INICIAL
   ========================================================= */

function mostrarMensagemInicial() {

    const conteudo =
        document.getElementById(
            "conteudoPainel"
        );

    if (!conteudo) return;


    conteudo.innerHTML = `
        <div class="boas-vindas">

            <h2>🎵 Bem-vindo ao painel</h2>

            <p>
                O Painel dos Artistas Lilian e Marinho
                está conectado.
            </p>

            <p>
                Use o menu acima para administrar
                músicas, pedidos, produtos, sugestões,
                compras e reservas.
            </p>

        </div>
    `;

}


/* =========================================================
   ABRIR ABAS
   ========================================================= */

function abrirAba(aba) {

    if (!aba) {

        mostrarMensagemInicial();

        return;

    }


    switch (aba) {

        case "pedidos":
            carregarPedidos();
            break;


        case "musicas":
            carregarMusicas();
            break;


        case "sugestoes":
            carregarSugestoes();
            break;


        case "produtos":
            carregarProdutos();
            break;


        case "compras":
            carregarCompras();
            break;


        case "reservas":
            carregarReservas();
            break;


        case "ranking":
            carregarRanking();
            break;


        case "configuracoes":
            carregarConfiguracoes();
            break;


        default:
            mostrarMensagemInicial();

    }

}


/* =========================================================
   FUNÇÃO AUXILIAR DE CONTEÚDO
   ========================================================= */

function definirConteudo(html) {

    const conteudo =
        document.getElementById(
            "conteudoPainel"
        );


    if (!conteudo) {

        console.warn(
            "Elemento #conteudoPainel não encontrado."
        );

        return;

    }


    conteudo.innerHTML = html;

}


/* =========================================================
   PEDIDOS
   ========================================================= */

async function carregarPedidos() {

    definirConteudo(`
        <div class="carregando">
            Carregando pedidos...
        </div>
    `);


    const {
        data,
        error
    } =
        await supabaseClient
            .from("pedidos")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Erro ao carregar pedidos:",
            error
        );

        definirConteudo(`
            <div class="erro">
                Não foi possível carregar os pedidos.
            </div>
        `);

        return;

    }


    if (!data || data.length === 0) {

        definirConteudo(`
            <div class="vazio">

                <h2>🎤 Pedidos</h2>

                <p>
                    Nenhum pedido encontrado.
                </p>

            </div>
        `);

        return;

    }


    let html = `
        <div class="secao-painel">

            <h2>🎤 Pedidos</h2>

            <div class="lista-painel">
    `;


    data.forEach(pedido => {

        html += `
            <div class="item-painel">

                <strong>
                    ${escapar(
                        pedido.musica ||
                        "Sem música"
                    )}
                </strong>

                <span>
    Artista:
    ${escapar(
        pedido.artista ||
        "-"
    )}
</span>

<span>
    Tom:
    ${escapar(
        pedido.tom ||
        "-"
    )}
</span>

<span>
    Cliente:
                    ${escapar(
                        pedido.cliente ||
                        "-"
                    )}
                </span>

                <span>
                    Mesa:
                    ${escapar(
                        pedido.mesa ||
                        "-"
                    )}
                </span>

                <span>
                    Status:
                    ${escapar(
                        pedido.status ||
                        "-"
                    )}
                </span>


                <div class="acoes-pedido">

                    <button
                        class="botao-principal"
                        onclick="marcarPedidoTocando(${pedido.id})"
                    >
                        🎵 TOCANDO
                    </button>


                    <button
                        class="botao-perigo"
                        onclick="excluirPedido(${pedido.id})"
                    >
                        🗑️ EXCLUIR
                    </button>

                </div>

            </div>
        `;

    });

html += `
            </div>

            <div class="acoes-pedidos-final">

                <button
                    class="botao-perigo"
                    onclick="excluirTodosPedidos()"
                >
                    🗑️ EXCLUIR TODOS OS PEDIDOS
                </button>

            </div>

        </div>
    `;


definirConteudo(html);
    
}

/* =========================================================
   MARCAR PEDIDO COMO TOCANDO
   ========================================================= */

    async function marcarPedidoTocando(id) {

        if (!id) {
            return;
        }


        const confirmar = confirm(
            "Marcar esta música como TOCANDO agora?"
        );


        if (!confirmar) {
            return;
        }


        console.log(
            "Marcando pedido como tocando:",
            id
        );


        const {
            error
        } =
            await supabaseClient
                .from("pedidos")
                .update({
                    status: "tocando"
                })
                .eq("id", id);


        if (error) {

            console.error(
                "Erro ao marcar pedido como tocando:",
                error
            );


            alert(
                "Não foi possível marcar a música como tocando."
            );

            return;
        }


        console.log(
            "Pedido marcado como tocando!"
        );


        alert(
            "🎵 Música marcada como TOCANDO!"
        );


        carregarPedidos();

    }

/* =========================================================
   EXCLUIR PEDIDO
   ========================================================= */

async function excluirPedido(id) {

    if (!id) {
        return;
    }


    const confirmar = confirm(
        "Tem certeza que deseja excluir este pedido?\n\n" +
        "Esta ação não poderá ser desfeita."
    );


    if (!confirmar) {
        return;
    }


    console.log(
        "Excluindo pedido:",
        id
    );


    const {
        error
    } =
        await supabaseClient
            .from("pedidos")
            .delete()
            .eq("id", id);


    if (error) {

        console.error(
            "Erro ao excluir pedido:",
            error
        );


        alert(
            "Não foi possível excluir o pedido."
        );

        return;
    }


    console.log(
        "Pedido excluído com sucesso!"
    );


    alert(
        "🗑️ Pedido excluído com sucesso!"
    );


    carregarPedidos();

}

/* =========================================================
   EXCLUIR TODOS OS PEDIDOS
   ========================================================= */

async function excluirTodosPedidos() {

    const confirmar = confirm(
        "⚠️ ATENÇÃO!\n\n" +
        "Você está prestes a excluir TODOS os pedidos deste show.\n\n" +
        "Essa ação não poderá ser desfeita.\n\n" +
        "Deseja realmente continuar?"
    );


    if (!confirmar) {

        return;

    }


    console.log(
        "Excluindo todos os pedidos..."
    );


    const {
        error
    } =
        await supabaseClient
            .from("pedidos")
            .delete()
            .not(
                "id",
                "is",
                null
            );


    if (error) {

        console.error(
            "Erro ao excluir todos os pedidos:",
            error
        );


        alert(
            "❌ Não foi possível excluir os pedidos."
        );

        return;

    }


    console.log(
        "Todos os pedidos foram excluídos com sucesso!"
    );


    alert(
        "🗑️ Todos os pedidos foram excluídos!"
    );


    carregarPedidos();

}

/* =========================================================
   EXCLUIR TODAS AS RESERVAS
   ========================================================= */

async function excluirTodasReservas() {

    const confirmar = confirm(
        "⚠️ ATENÇÃO!\n\n" +
        "Você está prestes a excluir TODAS as reservas deste show.\n\n" +
        "Essa ação não poderá ser desfeita.\n\n" +
        "Deseja realmente continuar?"
    );


    if (!confirmar) {

        return;

    }


    console.log(
        "Excluindo todas as reservas..."
    );


    const {
        error
    } =
        await supabaseClient
            .from("reservas")
            .delete()
            .not(
                "id",
                "is",
                null
            );


    if (error) {

        console.error(
            "Erro ao excluir todas as reservas:",
            error
        );


        alert(
            "❌ Não foi possível excluir as reservas."
        );

        return;

    }


    console.log(
        "Todas as reservas foram excluídas com sucesso!"
    );


    alert(
        "🗑️ Todas as reservas foram excluídas!"
    );


    carregarReservas();

}

/* =========================================================
   MÚSICAS
   ========================================================= */

async function carregarMusicas() {

    definirConteudo(`
        <div class="carregando">
            Carregando músicas...
        </div>
    `);


    const {
        data,
        error
    } =
        await supabaseClient
            .from("musicas")
            .select("*")
            .order(
                "id",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Erro ao carregar músicas:",
            error
        );

        definirConteudo(`
            <div class="erro">
                Não foi possível carregar as músicas.
            </div>
        `);

        return;

    }


    let html = `
        <div class="secao-painel">

            <h2>🎵 Músicas</h2>

            <button
                class="botao-principal"
                onclick="novaMusica()"
            >
                ➕ Nova música
            </button>

            <div class="lista-painel">
    `;


    if (!data || data.length === 0) {

        html += `
            <div class="vazio">
                Nenhuma música cadastrada.
            </div>
        `;

    } else {

        data.forEach(musica => {

            html += `
                <div class="item-painel">

                    <strong>
    ${escapar(
        musica.titulo ||
        "Sem nome"
    )}
</strong>

                    <span>
                        Artista:
                        ${escapar(
                            musica.artista || "-"
                        )}
                    </span>

                    <div class="acoes-musica">

                        <button
                            class="botao-secundario"
                            onclick="editarMusica(${musica.id})"
                        >
                            ✏️ Editar
                        </button>

                        <button
                            class="botao-perigo"
                            onclick="excluirMusica(${musica.id})"
                        >
                            🗑️ Excluir
                        </button>

                    </div>

                </div>
            `;

        });

    }


    html += `
            </div>
        </div>
    `;


    definirConteudo(html);

}

/* =========================================================
   EDITAR MÚSICA
   ========================================================= */

async function editarMusica(id) {

    const {
        data: musica,
        error: erroBusca
    } = await supabaseClient
        .from("musicas")
        .select("*")
        .eq("id", id)
        .single();


    if (erroBusca || !musica) {

        console.error(
            "Erro ao buscar música:",
            erroBusca
        );

        alert(
            "Não foi possível carregar a música."
        );

        return;
    }


    definirConteudo(`
        <div class="secao-painel">

            <h2>✏️ Editar música</h2>

            <label>
                Nome da música
            </label>

            <input
                id="editarMusicaTitulo"
                type="text"
                value="${escapar(musica.titulo || "")}"
            >

            <label>
                Artista
            </label>

            <input
                id="editarMusicaArtista"
                type="text"
                value="${escapar(musica.artista || "")}"
            >

            <div class="acoes-formulario">

                <button
                    class="botao-principal"
                    onclick="salvarEdicaoMusica(${id})"
                >
                    💾 Salvar alterações
                </button>

                <button
                    class="botao-secundario"
                    onclick="carregarMusicas()"
                >
                    ❌ Cancelar
                </button>

            </div>

        </div>
    `);
}

async function salvarEdicaoMusica(id) {

    const titulo =
        document
            .getElementById("editarMusicaTitulo")
            ?.value
            .trim();


    const artista =
        document
            .getElementById("editarMusicaArtista")
            ?.value
            .trim();


    if (!titulo) {

        alert(
            "Digite o nome da música."
        );

        return;
    }


    const {
        error
    } = await supabaseClient
        .from("musicas")
        .update({
            titulo,
            artista
        })
        .eq("id", id);


    if (error) {

        console.error(
            "Erro ao editar música:",
            error
        );

        alert(
            "Não foi possível atualizar a música."
        );

        return;
    }


    alert(
        "Música atualizada com sucesso!"
    );


    carregarMusicas();
}

async function excluirMusica(id) {

    const confirmar = confirm(
        "Tem certeza que deseja excluir esta música?\n\n" +
        "Esta ação não poderá ser desfeita."
    );

    if (!confirmar) {
        return;
    }


    const {
        error
    } =
        await supabaseClient
            .from("musicas")
            .delete()
            .eq("id", id);


    if (error) {

        console.error(
            "Erro ao excluir música:",
            error
        );

        alert(
            "Não foi possível excluir a música."
        );

        return;

    }


    alert(
        "Música excluída com sucesso!"
    );


    carregarMusicas();

}

/* =========================================================
   NOVA MÚSICA
   ========================================================= */

function novaMusica() {

    definirConteudo(`
        <div class="secao-painel">

            <h2>➕ Nova música</h2>

            <label>
                Nome da música
            </label>

            <input
                id="novaMusicaNome"
                type="text"
                placeholder="Digite o nome da música"
            >

            <label>
                Artista
            </label>

            <input
                id="novaMusicaArtista"
                type="text"
                placeholder="Digite o artista"
            >

            <label>
    Tom da música
</label>

<input
    id="novaMusicaTom"
    type="text"
    placeholder="Ex.: C, D, E, F, G, A, B, Am, Dm..."
>

            <div class="acoes-formulario">

                <button
                    class="botao-principal"
                    onclick="salvarMusica()"
                >
                    💾 Salvar
                </button>

                <button
                    class="botao-secundario"
                    onclick="carregarMusicas()"
                >
                    Cancelar
                </button>

            </div>

        </div>
    `);

}

/* =========================================================
   SALVAR MÚSICA
   ========================================================= */

async function salvarMusica() {

    const nome =
        document
            .getElementById(
                "novaMusicaNome"
            )
            ?.value
            .trim();


    const artista =
        document
            .getElementById(
                "novaMusicaArtista"
            )
            ?.value
            .trim();

            const tom =
    document
        .getElementById(
            "novaMusicaTom"
        )
        ?.value
        .trim();

    if (!nome) {

        alert(
            "Digite o nome da música."
        );

        return;

    }


    const {
        error
    } =
        await supabaseClient
            .from("musicas")
.insert({

    titulo: nome,
    artista: artista,
    tom: tom || ""

});

    if (error) {

        console.error(
            "Erro ao salvar música:",
            error
        );

        alert(
            "Não foi possível salvar a música."
        );

        return;

    }


    alert(
        "Música cadastrada com sucesso!"
    );


    carregarMusicas();

}

/* =========================================================
   SUGESTÕES
   ========================================================= */

async function carregarSugestoes() {

    definirConteudo(`
        <div class="carregando">
            Carregando sugestões...
        </div>
    `);


    const {
        data,
        error
    } =
        await supabaseClient
            .from("sugestoes")
            .select("*")
            .order(
                "criada_em",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Erro ao carregar sugestões:",
            error
        );

        definirConteudo(`
            <div class="erro">
                Não foi possível carregar as sugestões.
            </div>
        `);

        return;

    }


    let html = `
        <div class="secao-painel">

            <h2>💡 Sugestões</h2>

            <div class="lista-painel">
    `;


    if (!data || data.length === 0) {

        html += `
            <div class="vazio">
                Nenhuma sugestão encontrada.
            </div>
        `;

    } else {

        data.forEach(sugestao => {

            html += `
                <div class="item-painel">

                    <strong>
                        🎵 ${escapar(
                            sugestao.musica ||
                            "Música não informada"
                        )}
                    </strong>

                    <span>
                        Artista:
                        ${escapar(
                            sugestao.artista ||
                            "Não informado"
                        )}
                    </span>

                    <span>
                        Cliente:
                        ${escapar(
                            sugestao.cliente ||
                            "Não informado"
                        )}
                    </span>

                    <span>
                        Status:
                        ${escapar(
                            sugestao.status ||
                            "pendente"
                        )}
                    </span>


                    <div class="acoes-sugestao">

                        <button
                            class="botao-principal"
                            onclick="incluirSugestao('${escapar(
                                String(sugestao.id)
                            )}')"
                        >
                            ✅ INCLUIR
                        </button>


                        <button
                            class="botao-perigo"
                            onclick="excluirSugestao('${escapar(
                                String(sugestao.id)
                            )}')"
                        >
                            🗑️ EXCLUIR
                        </button>

                    </div>

                </div>
            `;

        });

    }


    html += `
            </div>
        </div>
    `;


    definirConteudo(html);

}

/* =========================================================
   INCLUIR SUGESTÃO NAS MÚSICAS
   ========================================================= */

async function incluirSugestao(id) {

    if (!id) {
        return;
    }


    const confirmar = confirm(
        "Deseja incluir esta sugestão no Cardápio Musical?"
    );


    if (!confirmar) {
        return;
    }


    console.log(
        "Incluindo sugestão:",
        id
    );


    /*
     * Primeiro buscamos a sugestão.
     */

    const {
        data: sugestao,
        error: erroBusca
    } =
        await supabaseClient
            .from("sugestoes")
            .select("*")
            .eq("id", id)
            .single();


    if (erroBusca || !sugestao) {

        console.error(
            "Erro ao buscar sugestão:",
            erroBusca
        );

        alert(
            "Não foi possível localizar esta sugestão."
        );

        return;
    }


    /*
     * Conferir se a música já existe.
     */

    const {
        data: musicaExistente,
        error: erroVerificacao
    } =
        await supabaseClient
            .from("musicas")
            .select("id, titulo, artista")
            .ilike(
                "titulo",
                sugestao.musica || ""
            )
            .ilike(
                "artista",
                sugestao.artista || ""
            )
            .limit(1);


    if (erroVerificacao) {

        console.error(
            "Erro ao verificar música existente:",
            erroVerificacao
        );

        alert(
            "Não foi possível verificar se a música já existe."
        );

        return;
    }


    /*
     * Se já existir, não criamos duplicada.
     */

    if (
        musicaExistente &&
        musicaExistente.length > 0
    ) {

        const {
            error: erroExcluirSugestao
        } =
            await supabaseClient
                .from("sugestoes")
                .delete()
                .eq("id", id);


        if (erroExcluirSugestao) {

            console.error(
                "Erro ao remover sugestão:",
                erroExcluirSugestao
            );

            alert(
                "A música já existe, mas não foi possível remover a sugestão."
            );

            return;
        }


        alert(
            "🎵 Esta música já estava no Cardápio Musical.\n\n" +
            "A sugestão foi removida."
        );


        carregarSugestoes();

        return;
    }


    /*
     * Incluir a nova música.
     */

    const {
        error: erroInclusao
    } =
        await supabaseClient
            .from("musicas")
            .insert({

                titulo:
                    sugestao.musica,

                artista:
                    sugestao.artista || "",

                ativa:
                    true

            });


    if (erroInclusao) {

        console.error(
            "Erro ao incluir música:",
            erroInclusao
        );

        alert(
            "Não foi possível incluir a música no Cardápio."
        );

        return;
    }


    /*
     * Só removemos a sugestão depois
     * que a música foi incluída com sucesso.
     */

    const {
    data: sugestaoExcluida,
    error: erroExclusao
} =
    await supabaseClient
        .from("sugestoes")
        .delete()
        .eq("id", id)
        .select("id");

    if (erroExclusao) {

    console.error(
        "Erro ao excluir sugestão:",
        erroExclusao
    );

    alert(
        "⚠️ A música foi incluída no Cardápio, " +
        "mas a sugestão não pôde ser removida."
    );

    carregarSugestoes();

    return;
}


if (
    !sugestaoExcluida ||
    sugestaoExcluida.length === 0
) {

    console.error(
        "A sugestão não foi excluída. " +
        "Verifique as permissões da tabela sugestoes."
    );

    alert(
        "⚠️ A música foi incluída no Cardápio, " +
        "mas a sugestão não foi removida."
    );

    carregarSugestoes();

    return;
}


console.log(
    "Sugestão excluída com sucesso:",
    sugestaoExcluida
);


alert(
    "🎵 Música incluída e sugestão removida com sucesso!"
);


carregarSugestoes();

}

/* =========================================================
   EXCLUIR SUGESTÃO
   ========================================================= */

async function excluirSugestao(id) {

    if (!id) {
        return;
    }


    const confirmar = confirm(
        "Tem certeza que deseja excluir esta sugestão?\n\n" +
        "Esta ação não poderá ser desfeita."
    );


    if (!confirmar) {
        return;
    }


    console.log(
        "Excluindo sugestão:",
        id
    );


    const {
        error
    } =
        await supabaseClient
            .from("sugestoes")
            .delete()
            .eq("id", id);


    if (error) {

        console.error(
            "Erro ao excluir sugestão:",
            error
        );

        alert(
            "Não foi possível excluir a sugestão."
        );

        return;
    }


    console.log(
        "Sugestão excluída com sucesso!"
    );


    alert(
        "🗑️ Sugestão excluída com sucesso!"
    );


    carregarSugestoes();

}

/* =========================================================
   PRODUTOS
   ========================================================= */

async function carregarProdutos() {

    definirConteudo(`
        <div class="carregando">
            Carregando produtos...
        </div>
    `);

    const {
        data,
        error
    } = await supabaseClient
        .from("produtos")
        .select("*")
        .order("id", {
            ascending: false
        });

    if (error) {

        console.error(
            "Erro ao carregar produtos:",
            error
        );

        definirConteudo(`
            <div class="erro">
                Não foi possível carregar os produtos.
            </div>
        `);

        return;
    }

    let html = `
        <div class="secao-painel">

            <h2>📦 Produtos</h2>

            <button
                class="botao-principal"
                onclick="novoProduto()"
            >
                ➕ Novo produto
            </button>

            <div class="lista-painel">
    `;

    if (!data || data.length === 0) {

        html += `
            <div class="vazio">
                Nenhum produto cadastrado.
            </div>
        `;

    } else {

        data.forEach(produto => {

            const estoque =
                Number(produto.estoque || 0);

            html += `
                <div class="item-painel">

                    <strong>
                        ${escapar(
                            produto.nome ||
                            "Produto"
                        )}
                    </strong>

                    <span>
                        Categoria:
                        ${escapar(
                            produto.categoria || "-"
                        )}
                    </span>

                    <span>
                        Estoque:
                        ${estoque}
                    </span>

                    <span>
                        Preço:
                        R$
                        ${formatarMoeda(
                            produto.preco
                        )}
                    </span>

                    <div class="acoes-produto">

                        <button
                            class="botao-secundario"
                            onclick="editarProduto('${produto.id}')"
                        >
                            ✏️ Editar
                        </button>

                        <button
                            class="botao-perigo"
                            onclick="excluirProduto(${produto.id})"
                        >
                            🗑️ Excluir
                        </button>

                    </div>

                </div>
            `;

        });

    }

    html += `
            </div>
        </div>
    `;

    definirConteudo(html);
}

/* =========================================================
   EDITAR PRODUTO
   ========================================================= */

async function editarProduto(id) {

    const {
        data: produto,
        error: erroBusca
    } = await supabaseClient
        .from("produtos")
        .select("*")
        .eq("id", id)
        .single();


    if (erroBusca || !produto) {

        console.error(
            "Erro ao buscar produto:",
            erroBusca
        );

        alert(
            "Não foi possível carregar o produto."
        );

        return;
    }


    definirConteudo(`
        <div class="secao-painel">

            <h2>✏️ Editar produto</h2>

            <div class="formulario-painel">

                <label>
                    Nome do produto
                </label>

                <input
                    id="editar-produto-nome"
                    type="text"
                    value="${escapar(produto.nome || "")}"
                >


                <label>
                    Categoria
                </label>

                <input
                    id="editar-produto-categoria"
                    type="text"
                    value="${escapar(produto.categoria || "")}"
                >


                <label>
                    Quantidade em estoque
                </label>

                <input
                    id="editar-produto-estoque"
                    type="number"
                    min="0"
                    step="1"
                    value="${produto.estoque ?? 0}"
                >


                <label>
                    Preço
                </label>

                <input
                    id="editar-produto-preco"
                    type="number"
                    min="0"
                    step="0.01"
                    value="${produto.preco ?? 0}"
                >


                <div class="acoes-formulario">

                    <button
                        class="botao-principal"
                        onclick="salvarEdicaoProduto(${id})"
                    >
                        💾 Salvar alterações
                    </button>


                    <button
                        class="botao-secundario"
                        onclick="carregarProdutos()"
                    >
                        ❌ Cancelar
                    </button>

                </div>

            </div>

        </div>
    `);

}

async function salvarEdicaoProduto(id) {

    const nome =
        document
            .getElementById("editar-produto-nome")
            .value
            .trim();

    const categoria =
        document
            .getElementById("editar-produto-categoria")
            .value
            .trim();

    const estoqueTexto =
        document
            .getElementById("editar-produto-estoque")
            .value;

    const precoTexto =
        document
            .getElementById("editar-produto-preco")
            .value;


    const estoque =
        Number(
            String(estoqueTexto)
                .replace(",", ".")
        );


    const preco =
        Number(
            String(precoTexto)
                .replace(",", ".")
        );


    if (!nome) {

        alert(
            "Digite o nome do produto."
        );

        return;
    }


    if (
        !Number.isFinite(estoque) ||
        estoque < 0
    ) {

        alert(
            "Quantidade em estoque inválida."
        );

        return;
    }


    if (
        !Number.isFinite(preco) ||
        preco < 0
    ) {

        alert(
            "Preço inválido."
        );

        return;
    }


    const {
        error
    } = await supabaseClient
        .from("produtos")
        .update({

            nome: nome,

            categoria: categoria,

            estoque: estoque,

            preco: preco

        })
        .eq("id", id);


    if (error) {

        console.error(
            "Erro ao atualizar produto:",
            error
        );

        alert(
            "Não foi possível atualizar o produto."
        );

        return;
    }


    alert(
        "Produto atualizado com sucesso!"
    );


    carregarProdutos();

}

/* =========================================================
   EXCLUIR PRODUTO
   ========================================================= */

async function excluirProduto(id) {

    const confirmar =
        confirm(
            "Tem certeza que deseja excluir este produto?\n\n" +
            "Esta ação não poderá ser desfeita."
        );


    if (!confirmar) {
        return;
    }


    const {
        error
    } = await supabaseClient
        .from("produtos")
        .delete()
        .eq("id", id);


    if (error) {

        console.error(
            "Erro ao excluir produto:",
            error
        );

        alert(
            "Não foi possível excluir o produto."
        );

        return;
    }


    alert(
        "Produto excluído com sucesso!"
    );


    carregarProdutos();
}

/* =========================================================
   NOVO PRODUTO
   ========================================================= */

function novoProduto() {

    definirConteudo(`
        <div class="secao-painel">

            <h2>➕ Novo produto</h2>

            <label>
                Nome do produto
            </label>

            <input
                id="novoProdutoNome"
                type="text"
                placeholder="Ex.: Camiseta"
            >

            <label>
                Categoria
            </label>

            <input
                id="novoProdutoCategoria"
                type="text"
                placeholder="Ex.: Vestuário"
            >

            <label>
                Quantidade em estoque
            </label>

            <input
                id="novoProdutoEstoque"
                type="number"
                min="0"
                value="0"
            >

            <label>
                Preço
            </label>

            <input
                id="novoProdutoPreco"
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
            >


            <div class="bloco-fotos-produto">

                <h3>📷 Fotos do produto</h3>

                <p>
                    Você pode adicionar até 4 fotos.
                </p>


                <label>
                    Foto 1
                </label>

                <input
                    id="novoProdutoImagem1"
                    type="file"
                    accept="image/*"
                >


                <label>
                    Foto 2
                </label>

                <input
                    id="novoProdutoImagem2"
                    type="file"
                    accept="image/*"
                >


                <label>
                    Foto 3
                </label>

                <input
                    id="novoProdutoImagem3"
                    type="file"
                    accept="image/*"
                >


                <label>
                    Foto 4
                </label>

                <input
                    id="novoProdutoImagem4"
                    type="file"
                    accept="image/*"
                >

            </div>


            <div class="acoes-formulario">

                <button
                    class="botao-principal"
                    onclick="salvarProduto()"
                >
                    💾 Salvar
                </button>

                <button
                    class="botao-secundario"
                    onclick="carregarProdutos()"
                >
                    Cancelar
                </button>

            </div>

        </div>
    `);

}

/* =========================================================
   SALVAR PRODUTO
   ========================================================= */

async function salvarProduto() {

    const nome =
        document
            .getElementById(
                "novoProdutoNome"
            )
            ?.value
            .trim();


    const categoria =
        document
            .getElementById(
                "novoProdutoCategoria"
            )
            ?.value
            .trim();


    const estoque =
        Number(
            document
                .getElementById(
                    "novoProdutoEstoque"
                )
                ?.value || 0
        );


    const preco =
        Number(
            document
                .getElementById(
                    "novoProdutoPreco"
                )
                ?.value || 0
        );


    const arquivos = [
        document
            .getElementById(
                "novoProdutoImagem1"
            )
            ?.files?.[0],

        document
            .getElementById(
                "novoProdutoImagem2"
            )
            ?.files?.[0],

        document
            .getElementById(
                "novoProdutoImagem3"
            )
            ?.files?.[0],

        document
            .getElementById(
                "novoProdutoImagem4"
            )
            ?.files?.[0]
    ];


    if (!nome) {

        alert(
            "Digite o nome do produto."
        );

        return;

    }


    /* =====================================================
       VALIDAR FOTOS
       ===================================================== */

    const fotosSelecionadas =
        arquivos.filter(
            arquivo => arquivo
        );


    for (
        const arquivo
        of fotosSelecionadas
    ) {

        if (
            !arquivo.type.startsWith(
                "image/"
            )
        ) {

            alert(
                "Todos os arquivos selecionados devem ser imagens."
            );

            return;

        }


        if (
            arquivo.size >
            50 * 1024 * 1024
        ) {

            alert(
                "Cada foto pode ter no máximo 50 MB."
            );

            return;

        }

    }


    console.log(
        "Salvando produto..."
    );


    /* =====================================================
       CRIAR PRODUTO
       ===================================================== */

    const {
        data: produtoCriado,
        error: erroProduto
    } =
        await supabaseClient
            .from("produtos")
            .insert({

                nome,
                categoria,
                estoque,
                preco

            })
            .select()
            .single();


    if (erroProduto) {

        console.error(
            "Erro ao salvar produto:",
            erroProduto
        );

        alert(
            "Não foi possível salvar o produto."
        );

        return;

    }


    const produtoId =
        produtoCriado.id;


    console.log(
        "Produto criado:",
        produtoId
    );


    /* =====================================================
       ENVIAR FOTOS
       ===================================================== */

    const imagens = [
        null,
        null,
        null,
        null
    ];


    for (
        let i = 0;
        i < arquivos.length;
        i++
    ) {

        const arquivo =
            arquivos[i];


        if (!arquivo) {

            continue;

        }


        const extensao =
            arquivo.name
                .split(".")
                .pop()
                ?.toLowerCase() ||
            "jpg";


        const caminho =
            `${produtoId}/foto_${i + 1}_${Date.now()}.${extensao}`;


        console.log(
            `Enviando foto ${i + 1}...`
        );


        const {
            error: erroUpload
        } =
            await supabaseClient
                .storage
                .from("produtos")
                .upload(
                    caminho,
                    arquivo,
                    {
                        cacheControl: "3600",
                        upsert: false
                    }
                );


        if (erroUpload) {

            console.error(
                `Erro ao enviar foto ${i + 1}:`,
                erroUpload
            );


            alert(
                `O produto foi criado, mas houve um erro ao enviar a foto ${i + 1}.`
            );


            carregarProdutos();

            return;

        }


        imagens[i] =
            caminho;


        console.log(
            `Foto ${i + 1} enviada com sucesso.`
        );

    }

    /* =====================================================
       SALVAR CAMINHOS DAS FOTOS NO PRODUTO
       ===================================================== */

    const {
        error: erroImagens
    } =
        await supabaseClient
            .from("produtos")
            .update({

                imagem_1:
                    imagens[0],

                imagem_2:
                    imagens[1],

                imagem_3:
                    imagens[2],

                imagem_4:
                    imagens[3]

            })
            .eq(
                "id",
                produtoId
            );


    if (erroImagens) {

        console.error(
            "Erro ao salvar imagens do produto:",
            erroImagens
        );

        alert(
            "Produto criado, mas não foi possível registrar as fotos."
        );

        carregarProdutos();

        return;

    }


    console.log(
        "Produto e fotos salvos com sucesso!"
    );


    alert(
        "📦 Produto cadastrado com sucesso!"
    );


    carregarProdutos();

}

/* =========================================================
   COMPRAS
   ========================================================= */

async function carregarCompras() {

    definirConteudo(`
        <div class="carregando">
            Carregando compras...
        </div>
    `);


    const {
        data,
        error
    } =
        await supabaseClient
            .from("compras")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Erro ao carregar compras:",
            error
        );

        definirConteudo(`
            <div class="erro">
                Não foi possível carregar as compras.
            </div>
        `);

        return;

    }


    let html = `
        <div class="secao-painel">

            <h2>🛒 Compras</h2>

            <div class="lista-painel">
    `;


    if (!data || data.length === 0) {

        html += `
            <div class="vazio">
                Nenhuma compra registrada.
            </div>
        `;

    } else {

        data.forEach(compra => {

            const quantidade =
                Number(
                    compra.quantidade || 0
                );


            const valorTotal =
                Number(
                    compra.valor_total || 0
                );


            html += `
                <div class="compra-admin">

                    <strong>
                        🛍️ ${escapar(
                            compra.produto ||
                            "Produto"
                        )}
                    </strong>

                    <span>
                        👤 Cliente:
                        <strong>
                            ${escapar(
                                compra.nome || "-"
                            )}
                        </strong>
                    </span>

                    <span>
                        📱 WhatsApp:
                        <strong>
                            ${escapar(
                                compra.whatsapp || "-"
                            )}
                        </strong>
                    </span>

                    <span>
                        🔢 Quantidade:
                        <strong>
                            ${quantidade}
                        </strong>
                    </span>

                    <span>
                        💰 Valor total:
                        <strong>
                            ${formatarMoedaPainel(
                                valorTotal
                            )}
                        </strong>
                    </span>

                    <span>
                        💳 Pagamento:
                        <strong>
                            ${escapar(
                                compra.pagamento || "-"
                            )}
                        </strong>
                    </span>

                    <span>
                        ✅ Status:
                        <strong>
                            ${escapar(
                                compra.status || "-"
                            )}
                        </strong>
                    </span>

                </div>
            `;

        });


        /* =====================================================
           BOTÃO EXCLUIR TUDO
           ===================================================== */

        html += `
            <div
                style="
                    margin-top: 20px;
                    text-align: center;
                "
            >

                <button
                    type="button"
                    id="botao-excluir-todas-compras"
                    style="
                        padding: 13px 20px;
                        border: none;
                        border-radius: 10px;
                        background: #b83232;
                        color: #fff;
                        font-weight: bold;
                        cursor: pointer;
                    "
                >
                    🗑️ EXCLUIR TUDO
                </button>

            </div>
        `;

    }


    html += `
            </div>
        </div>
    `;


    definirConteudo(html);


    /* =====================================================
       ATIVAR BOTÃO
       ===================================================== */

    const botaoExcluir =
        document.getElementById(
            "botao-excluir-todas-compras"
        );


    if (botaoExcluir) {

        botaoExcluir.addEventListener(
            "click",
            excluirTodasCompras
        );

    }

}


/* =========================================================
   EXCLUIR TODAS AS COMPRAS
   ========================================================= */

async function excluirTodasCompras() {

    const confirmar =
        confirm(
            "⚠️ ATENÇÃO!\n\n" +
            "Isso irá excluir TODAS as compras " +
            "registradas.\n\n" +
            "Deseja realmente limpar as compras " +
            "para o próximo show?"
        );


    if (!confirmar) {

        return;

    }


    console.log(
        "Excluindo todas as compras..."
    );


    const {
        error
    } =
        await supabaseClient
            .from("compras")
            .delete()
            .not(
                "id",
                "is",
                null
            );


    if (error) {

        console.error(
            "Erro ao excluir todas as compras:",
            error
        );

        alert(
            "Não foi possível excluir as compras."
        );

        return;

    }


    console.log(
        "Todas as compras foram excluídas com sucesso!"
    );


    alert(
        "✅ Todas as compras foram excluídas com sucesso!"
    );


    carregarCompras();

}


/* =========================================================
   FORMATAÇÃO DE MOEDA
   ========================================================= */

function formatarMoedaPainel(valor) {

    return Number(
        valor || 0
    ).toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );

}

/* =========================================================
   FORMATAÇÃO DE VALOR DAS COMPRAS
   ========================================================= */

function formatarMoedaPainel(valor) {

    return Number(
        valor || 0
    ).toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );

}

/* =========================================================
   RESERVAS
   ========================================================= */

async function carregarReservas() {

    definirConteudo(`
        <div class="carregando">
            Carregando reservas...
        </div>
    `);


    const {
        data,
        error
    } =
        await supabaseClient
            .from("reservas")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Erro ao carregar reservas:",
            error
        );

        definirConteudo(`
            <div class="erro">
                Não foi possível carregar as reservas.
            </div>
        `);

        return;

    }


    if (!data || data.length === 0) {

        definirConteudo(`
            <div class="vazio">

                <h2>📦 Reservas</h2>

                <p>
                    Nenhuma reserva registrada.
                </p>

            </div>
        `);

        return;

    }


    let html = `
        <div class="secao-painel">

            <h2>📦 Reservas</h2>

            <div class="lista-painel">
    `;


    data.forEach(reserva => {

        html += `
            <div class="item-painel">

                <strong>
                    ${escapar(
                        reserva.produto ||
                        "Produto"
                    )}
                </strong>


                <span>
                    Nome:
                    ${escapar(
                        reserva.nome ||
                        "-"
                    )}
                </span>


                <span>
                    WhatsApp:
                    ${escapar(
                        reserva.whatsapp ||
                        "-"
                    )}
                </span>


                <span>
                    Quantidade:
                    ${escapar(
                        reserva.quantidade ||
                        1
                    )}
                </span>


                <span>
                    Status:
                    ${escapar(
                        reserva.status ||
                        "-"
                    )}
                </span>

            </div>
        `;

    });


    html += `
            </div>


            <div class="acoes-pedidos-final">

                <button
                    class="botao-perigo"
                    onclick="excluirTodasReservas()"
                >
                    🗑️ EXCLUIR TODAS AS RESERVAS
                </button>

            </div>

        </div>
    `;


    definirConteudo(html);

}

/* =========================================================
   RANKING
   ========================================================= */

async function carregarRanking() {

    definirConteudo(`
        <div class="secao-painel">

            <h2>🏆 Ranking</h2>

            <p>
                O ranking das músicas será
                exibido aqui.
            </p>

        </div>
    `);

}


/* =========================================================
   CONFIGURAÇÕES
   ========================================================= */

function carregarConfiguracoes() {

    definirConteudo(`
        <div class="secao-painel">

            <h2>⚙️ Configurações</h2>

            <p>
                As configurações do Cardápio Musical
                serão administradas nesta área.
            </p>

            <div class="configuracao-info">

                <strong>
                    Lilian e Marinho
                </strong>

                <span>
                    Cardápio Musical
                </span>

            </div>

        </div>
    `);

}


/* =========================================================
   FORMATAR MOEDA
   ========================================================= */

function formatarMoeda(valor) {

    const numero =
        Number(valor || 0);


    return numero.toLocaleString(
        "pt-BR",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );

}


/* =========================================================
   SEGURANÇA HTML
   ========================================================= */

function escapar(valor) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        valor ?? "";


    return div.innerHTML;

}


/* =========================================================
   EXPOR FUNÇÕES
   ========================================================= */

window.entrar =
    entrar;

window.sair =
    sair;

window.abrirAba =
    abrirAba;

window.novaMusica =
    novaMusica;

window.salvarMusica =
    salvarMusica;

window.novoProduto =
    novoProduto;

window.salvarProduto =
    salvarProduto;

window.carregarPedidos =
    carregarPedidos;

    window.excluirTodosPedidos =
    excluirTodosPedidos;

window.carregarMusicas =
    carregarMusicas;

window.carregarSugestoes =
    carregarSugestoes;

    window.incluirSugestao =
    incluirSugestao;

window.excluirSugestao =
    excluirSugestao;

window.carregarProdutos =
    carregarProdutos;

window.carregarCompras =
    carregarCompras;

window.carregarReservas =
    carregarReservas;

window.carregarRanking =
    carregarRanking;

window.carregarConfiguracoes =
    carregarConfiguracoes;