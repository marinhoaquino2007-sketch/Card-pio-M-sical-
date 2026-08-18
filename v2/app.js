/* =========================================================
   CARDÁPIO MUSICAL — LILIAN E MARINHO
   V2 — APLICAÇÃO DO PEDINTE
   PARTE 1/2
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

console.log("V2 conectado ao Supabase com sucesso!");

/* =========================================================
   ESTADO DA APLICAÇÃO
   ========================================================= */

   let musicaSelecionada = null;

let pedidoJaFinalizado = false;
let canalPedidoTocando = null;

let sugestaoEmAndamento = false;
let sugestaoDados = null;

let audioContextNotificacao = null;
let pedidoTocandoJaNotificado = false;

/* =========================================================
   🔔 SOM DE NOTIFICAÇÃO — MÚSICA TOCANDO
   ========================================================= */

function prepararSomNotificacaoTocando() {

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

    } catch (erro) {

        console.error(
            "Erro ao preparar som de notificação:",
            erro
        );

    }

}


/* =========================================================
   🔔 TOCAR SOM — MÚSICA TOCANDO
   ========================================================= */

function tocarSomMusicaTocando() {

    try {

        prepararSomNotificacaoTocando();


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


        /*
         * Duas notas para criar um som
         * agradável de confirmação.
         */

        oscilador.frequency.setValueAtTime(
            659.25,
            agora
        );

        oscilador.frequency.setValueAtTime(
            880,
            agora + 0.14
        );


        ganho.gain.setValueAtTime(
            0.0001,
            agora
        );

        ganho.gain.exponentialRampToValueAtTime(
            0.25,
            agora + 0.03
        );

        ganho.gain.exponentialRampToValueAtTime(
            0.0001,
            agora + 0.55
        );


        oscilador.connect(ganho);

        ganho.connect(
            audioContextNotificacao.destination
        );


        oscilador.start(agora);

        oscilador.stop(
            agora + 0.6
        );


        console.log(
            "🔔 Som: sua música está tocando."
        );


    } catch (erro) {

        console.error(
            "Erro ao tocar som de notificação:",
            erro
        );

    }

}

let dadosPedinte = {
    cliente: "",
    mesa: "",
    recado: ""
};

/* =========================================================
   ELEMENTO PRINCIPAL
   ========================================================= */

const app = document.getElementById("app");

/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    carregarMusicas();

    monitorarPedidoTocando();


    /*
     * O pedinte já interage com a tela para
     * fazer o pedido. Usamos a primeira
     * interação para liberar o áudio.
     */

    document.addEventListener(
        "pointerdown",
        prepararSomNotificacaoTocando,
        {
            once: true
        }
    );

});

/* =========================================================
   MONITORAR PEDIDO — AVISO "TOCANDO"
   ========================================================= */

function monitorarPedidoTocando() {

    const pedidoId =
        localStorage.getItem("pedidoMusicaId");

    if (!pedidoId) {

        console.log(
            "Nenhum pedido para monitorar."
        );

        return;
    }

    pedidoTocandoJaNotificado = false;

    console.log(
        "Monitorando pedido:",
        pedidoId
    );

/* =========================================================
   AVISO — SUA MÚSICA ESTÁ TOCANDO
   ========================================================= */

function mostrarAvisoMusicaTocando(pedido) {

    /*
     * Evita tocar o som mais de uma vez
     * para o mesmo pedido.
     */

    if (!pedidoTocandoJaNotificado) {

        pedidoTocandoJaNotificado = true;

        tocarSomMusicaTocando();

    }

    app.innerHTML = `

        <section class="tela-pedido">

            <h1>
                🎵 SUA MÚSICA ESTÁ TOCANDO AGORA!
            </h1>

            <p>
                ${escaparHTML(
                    dadosPedinte.cliente || 
                    pedido.cliente || 
                    "Amigo(a)"
                )}, sua música está tocando
                neste momento! ❤️
            </p>

            <div class="resumo-musica">

                <strong>
                    ${escaparHTML(
                        pedido.musica || ""
                    )}
                </strong>

                <span>
                    ${escaparHTML(
                        pedido.artista || ""
                    )}
                </span>

            </div>

            <p>
                🎤 Lilian e Marinho agradecem
                por fazer parte do nosso show!
            </p>

            <button
                type="button"
                id="botao-ok-tocando"
            >
                OK
            </button>

        </section>

    `;


    document
        .getElementById(
            "botao-ok-tocando"
        )
        .addEventListener(
            "click",
            () => {

                carregarMusicas();

            }
        );

}
    /* =====================================================
       EVITAR CANAIS DUPLICADOS
       ===================================================== */

    if (canalPedidoTocando) {

        supabaseClient.removeChannel(
            canalPedidoTocando
        );

    }


    /* =====================================================
       ESCUTAR ALTERAÇÕES DO PEDIDO
       ===================================================== */

    canalPedidoTocando =
        supabaseClient
            .channel(
                `pedido-tocando-${pedidoId}`
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "pedidos",
                    filter: `id=eq.${pedidoId}`
                },
                payload => {

                    console.log(
                        "Atualização recebida:",
                        payload.new
                    );


                    if (
                        payload.new.status ===
                        "tocando"
                    ) {

                        mostrarAvisoMusicaTocando(
                            payload.new
                        );

                    }

                }
            )
            .subscribe(
                status => {

                    console.log(
                        "Status do monitoramento:",
                        status
                    );

                }
            );

}

/* =========================================================
   CARREGAR MÚSICAS
   ========================================================= */

async function carregarMusicas() {

    if (!app) {
        console.error("Elemento #app não encontrado.");
        return;
    }

    app.innerHTML = `
        <h1>🎵 Cardápio Musical</h1>
        <p>Carregando músicas...</p>
    `;

    const { data, error } = await supabaseClient
        .from("musicas")
        .select("id, titulo, artista")
        .eq("ativa", true)
        .order("titulo", { ascending: true });

    if (error) {

        console.error("Erro ao carregar músicas:", error);

        app.innerHTML = `
            <h1>🎵 Cardápio Musical</h1>

            <p>
                Não foi possível carregar as músicas.
            </p>

            <button
                type="button"
                onclick="carregarMusicas()"
            >
                🔄 Tentar novamente
            </button>
        `;

        return;
    }

    if (!data || data.length === 0) {

        app.innerHTML = `
            <h1>🎵 Cardápio Musical</h1>

            <p>
                Nenhuma música disponível no momento.
            </p>
        `;

        return;
    }

    renderizarListaMusicas(data);
}

/* =========================================================
   LISTA DE MÚSICAS
   ========================================================= */

function renderizarListaMusicas(musicas) {

    app.innerHTML = `
        <h1>🎵 Cardápio Musical</h1>

        <p>
            Escolha uma música para pedir no show.
        </p>

        <input
            id="campo-busca"
            type="text"
            placeholder="🔎 Procure uma música..."
            autocomplete="off"
        >

        <div id="lista-musicas"></div>
    `;

    const campoBusca =
        document.getElementById("campo-busca");

    mostrarMusicas(musicas);

    campoBusca.addEventListener("input", () => {

        const termo =
            campoBusca.value
                .toLowerCase()
                .trim();

        const filtradas = musicas.filter((item) => {

            const titulo =
                String(item.titulo || "")
                    .toLowerCase();

            const artista =
                String(item.artista || "")
                    .toLowerCase();

            return (
                titulo.includes(termo) ||
                artista.includes(termo)
            );
        });

        mostrarMusicas(filtradas);
    });
}

/* =========================================================
   MOSTRAR MÚSICAS
   ========================================================= */

function mostrarMusicas(lista) {

    const listaMusicas =
        document.getElementById("lista-musicas");

    if (!listaMusicas) {
        return;
    }

    listaMusicas.innerHTML = "";

    if (lista.length === 0) {

    listaMusicas.innerHTML = `

        <div class="sugestao-nao-encontrada">

            <h2>
                🎵 Não encontrou a tua música?
            </h2>

            <p>
                Que tal sugerir para o próximo show?
            </p>

            <button
                type="button"
                id="botao-sim-sugerir"
            >
                💡 SIM, QUERO SUGERIR
            </button>

            <button
                type="button"
                id="botao-agora-nao-sugerir"
            >
                👍 AGORA NÃO
            </button>

        </div>

    `;


    document
        .getElementById("botao-sim-sugerir")
        .addEventListener(
            "click",
            mostrarFormularioSugestao
        );


    document
        .getElementById("botao-agora-nao-sugerir")
        .addEventListener(
            "click",
            () => {

                sugestaoEmAndamento = false;
                sugestaoDados = null;

                mostrarOpcoesApoio();

            }
        );


    return;
}

    lista.forEach((item) => {

        const card =
            document.createElement("div");

        card.className = "musica-card";

        card.innerHTML = `
            <strong>
                ${escaparHTML(item.titulo)}
            </strong>

            <span>
                ${escaparHTML(item.artista || "")}
            </span>

            <button
                type="button"
                class="botao-pedir"
            >
                🎵 PEDIR
            </button>
        `;

        const botao =
            card.querySelector(".botao-pedir");

        botao.addEventListener("click", () => {
            iniciarPedido(item);
        });

        listaMusicas.appendChild(card);
    });
}

/* =========================================================
   SUGESTÃO — FORMULÁRIO
   ========================================================= */

function mostrarFormularioSugestao() {

    app.innerHTML = `

        <section class="tela-pedido">

            <h1>
                💡 Sugerir uma música
            </h1>

            <p>
                Ajude a escolher uma música
                para o próximo show! 🎵
            </p>


            <label for="sugestao-artista">
                Nome do artista:
            </label>

            <input
                id="sugestao-artista"
                type="text"
                placeholder="Digite o nome do artista"
                autocomplete="off"
            >


            <label for="sugestao-musica">
                Nome da música:
            </label>

            <input
                id="sugestao-musica"
                type="text"
                placeholder="Digite o nome da música"
                autocomplete="off"
            >


            <button
                type="button"
                id="botao-continuar-sugestao"
            >
                CONTINUAR
            </button>


            <button
                type="button"
                id="botao-voltar-sugestao"
            >
                ← VOLTAR
            </button>

        </section>

    `;


    document
        .getElementById(
            "botao-continuar-sugestao"
        )
        .addEventListener(
            "click",
            salvarSugestao
        );


    document
        .getElementById(
            "botao-voltar-sugestao"
        )
        .addEventListener(
            "click",
            carregarMusicas
        );

}

/* =========================================================
   SALVAR SUGESTÃO
   ========================================================= */

async function salvarSugestao() {

    const artistaInput =
        document.getElementById(
            "sugestao-artista"
        );

    const musicaInput =
        document.getElementById(
            "sugestao-musica"
        );


    const artista =
        artistaInput
            ?.value
            .trim();


    const musica =
        musicaInput
            ?.value
            .trim();


    if (!artista) {

        alert(
            "Digite o nome do artista."
        );

        artistaInput?.focus();

        return;
    }


    if (!musica) {

        alert(
            "Digite o nome da música."
        );

        musicaInput?.focus();

        return;
    }


    const botao =
        document.getElementById(
            "botao-continuar-sugestao"
        );


    if (botao) {

        botao.disabled = true;

        botao.textContent =
            "ENVIANDO...";

    }


    const sugestao = {

        musica:
            musica,

        artista:
            artista,

        cliente:
            dadosPedinte.cliente ||
            null,

        status:
            "pendente"

    };


    console.log(
        "Enviando sugestão:",
        sugestao
    );


    const {
        data,
        error
    } =
        await supabaseClient
            .from("sugestoes")
            .insert([
                sugestao
            ])
            .select()
            .single();


    if (error) {

        console.error(
            "Erro ao registrar sugestão:",
            error
        );


        if (botao) {

            botao.disabled = false;

            botao.textContent =
                "CONTINUAR";

        }


        alert(
            "Não conseguimos enviar sua sugestão.\n\n" +
            "Tente novamente, por favor."
        );

        return;
    }


    console.log(
        "Sugestão registrada:",
        data
    );


    sugestaoDados = {

        musica:
            musica,

        artista:
            artista

    };


    sugestaoEmAndamento = true;


    /*
     * Agora a sugestão já está registrada.
     *
     * O pedinte segue para as três opções
     * que já existem no sistema.
     */

    mostrarOpcoesApoio();

}

/* =========================================================
   OPÇÕES APÓS SUGESTÃO
   ========================================================= */

function mostrarOpcoesApoio() {

    app.innerHTML = `

        <section class="tela-pedido">

            <h1>
                🎵 Tudo certo!
            </h1>

            <p>
                Antes de finalizar, você gostaria
                de apoiar a dupla?
            </p>


            <div class="opcoes-pedido">

                <button
                    type="button"
                    id="botao-contribuir-apoio"
                >
                    💖 Quero colaborar
                </button>


                <button
                    type="button"
                    id="botao-produtos-apoio"
                >
                    🛍️ Quero comprar produtos
                </button>


                <button
                    type="button"
                    id="botao-agora-nao-apoio"
                >
                    👍 Agora não
                </button>

            </div>

        </section>

    `;


    document
        .getElementById(
            "botao-contribuir-apoio"
        )
        .addEventListener(
            "click",
            mostrarContribuicao
        );


    document
        .getElementById(
            "botao-produtos-apoio"
        )
        .addEventListener(
            "click",
            mostrarProdutos
        );


    document
        .getElementById(
            "botao-agora-nao-apoio"
        )
        .addEventListener(
            "click",
            finalizarAgoraNao
        );

}

/* =========================================================
   INICIAR PEDIDO
   ========================================================= */

function iniciarPedido(musica) {

    musicaSelecionada = musica;

    pedidoJaFinalizado = false;

    dadosPedinte = {
        cliente: "",
        mesa: "",
        recado: ""
    };

    mostrarIdentificacao();
}

/* =========================================================
   TELA 1 — IDENTIFICAÇÃO DO PEDINTE
   ========================================================= */

function mostrarIdentificacao() {

    app.innerHTML = `
        <section class="tela-pedido">

            <h1>🎵 Seu pedido</h1>

            <p>
                Antes de continuar, informe seus dados.
            </p>

            <div class="resumo-musica">

                <strong>
                    ${escaparHTML(
                        musicaSelecionada?.titulo || ""
                    )}
                </strong>

                <span>
                    ${escaparHTML(
                        musicaSelecionada?.artista || ""
                    )}
                </span>

            </div>

            <label for="cliente">
                Nome:
            </label>

            <input
                id="cliente"
                type="text"
                placeholder="Digite seu nome completo"
                autocomplete="name"
            >

            <label for="mesa">
                Mesa <small>(opcional)</small>:
            </label>

            <input
                id="mesa"
                type="text"
                placeholder="Ex.: Mesa 05"
            >

            <label for="recado">
                Recado <small>(opcional)</small>:
            </label>

            <textarea
                id="recado"
                rows="4"
                placeholder="Deixe um recado para Lilian e Marinho..."
            ></textarea>

            <button
                type="button"
                id="botao-continuar"
            >
                CONTINUAR
            </button>

            <button
                type="button"
                id="botao-voltar"
            >
                ← Voltar
            </button>

        </section>
    `;

    document
        .getElementById("botao-continuar")
        .addEventListener(
            "click",
            validarIdentificacao
        );

    document
        .getElementById("botao-voltar")
        .addEventListener(
            "click",
            carregarMusicas
        );
}

/* =========================================================
   VALIDAR IDENTIFICAÇÃO
   ========================================================= */

function validarIdentificacao() {

    const clienteInput =
        document.getElementById("cliente");

    const mesaInput =
        document.getElementById("mesa");

    const recadoInput =
        document.getElementById("recado");

    const cliente =
        clienteInput.value.trim();

    const mesa =
        mesaInput.value.trim();

    const recado =
        recadoInput.value.trim();

    if (!cliente) {

        alert(
            "Por favor, informe seu nome para continuar."
        );

        clienteInput.focus();

        return;
    }

    dadosPedinte = {
        cliente,
        mesa,
        recado
    };

    mostrarOpcoesPedido();
}

/* =========================================================
   TELA 2 — OPÇÕES APÓS IDENTIFICAÇÃO
   ========================================================= */

function mostrarOpcoesPedido() {

    app.innerHTML = `
        <section class="tela-pedido">

            <h1>🎵 Você escolheu:</h1>

            <div class="resumo-musica">

                <strong>
                    ${escaparHTML(
                        musicaSelecionada?.titulo || ""
                    )}
                </strong>

                <span>
                    ${escaparHTML(
                        musicaSelecionada?.artista || ""
                    )}
                </span>

            </div>

            <div class="opcoes-pedido">

                <button
                    type="button"
                    id="botao-contribuir"
                >
                    💖 Gostaria de ajudar a dupla
                    com alguma contribuição?
                </button>

                <button
                    type="button"
                    id="botao-produtos"
                >
                    🛍️ Quer adquirir um dos
                    nossos produtos?
                </button>

                <button
                    type="button"
                    id="botao-agora-nao"
                >
                    👍 Agora não
                </button>

            </div>

        </section>
    `;

    document
        .getElementById("botao-contribuir")
        .addEventListener(
            "click",
            () => mostrarContribuicao()
        );

    document
        .getElementById("botao-produtos")
        .addEventListener(
            "click",
            () => mostrarProdutos()
        );

    document
        .getElementById("botao-agora-nao")
        .addEventListener(
            "click",
            () => finalizarAgoraNao()
        );
}

/* =========================================================
   FINALIZAÇÃO — AGORA NÃO
   ========================================================= */

/* =========================================================
   FINALIZAÇÃO — AGORA NÃO
   ========================================================= */

   async function finalizarAgoraNao() {

    /*
     * Se estamos no fluxo de sugestão,
     * não devemos criar um pedido de música.
     */

    if (sugestaoEmAndamento) {

        mostrarSucessoSugestao();

        return;
    }


    /*
     * Fluxo normal de pedido de música.
     */

    await finalizarPedido();

}

/* =========================================================
   SUCESSO — SUGESTÃO ENVIADA
   ========================================================= */

function mostrarSucessoSugestao() {

    app.innerHTML = `

        <section class="tela-pedido">

            <h1>
                💡 Sugestão enviada com sucesso!
            </h1>

            <p>
                Muito obrigado por ajudar a escolher
                as músicas do nosso próximo show! ❤️
            </p>


            ${
                sugestaoDados
                ?
                `
                    <div class="resumo-musica">

                        <strong>
                            ${escaparHTML(
                                sugestaoDados.musica
                            )}
                        </strong>

                        <span>
                            ${escaparHTML(
                                sugestaoDados.artista
                            )}
                        </span>

                    </div>
                `
                :
                ""
            }


            <p>
                Lilian e Marinho agradecem
                pelo carinho! 🎤❤️
            </p>


            <button
                type="button"
                id="botao-ok-sugestao"
            >
                OK
            </button>

        </section>

    `;


    document
        .getElementById(
            "botao-ok-sugestao"
        )
        .addEventListener(
            "click",
            () => {

                sugestaoEmAndamento = false;

                sugestaoDados = null;

                carregarMusicas();

            }
        );

}

/* =========================================================
   FINALIZAR PEDIDO NO SUPABASE
   ========================================================= */

async function finalizarPedido() {

    if (!musicaSelecionada) {
        return;
    }

    const botaoOk =
        document.getElementById("botao-ok");

    if (botaoOk) {
        botaoOk.disabled = true;
    }

    const pedido = {
        musica_id: musicaSelecionada.id,
        musica: musicaSelecionada.titulo,
        artista: musicaSelecionada.artista || "",
        cliente: dadosPedinte.cliente,
        mesa: dadosPedinte.mesa || null,
        recado: dadosPedinte.recado || null,
        status: "aguardando"
    };

    console.log(
        "Enviando pedido para o Supabase:",
        pedido
    );

    const {
    data: pedidoCriado,
    error
} =
    await supabaseClient
        .from("pedidos")
        .insert([
            pedido
        ])
        .select()
        .single();

        console.log(
    "RETORNO DO PEDIDO:",
    pedidoCriado,
    "ERRO:",
    error
);

    if (error) {

        console.error(
            "Erro ao registrar pedido:",
            error
        );

        if (botaoOk) {
            botaoOk.disabled = false;
        }

        app.innerHTML = `
            <section class="tela-pedido">

                <h1>⚠️ Ops!</h1>

                <p>
                    Não conseguimos registrar
                    seu pedido.
                </p>

                <p>
                    Tente novamente, por favor.
                </p>

                <button
                    type="button"
                    onclick="mostrarOpcoesPedido()"
                >
                    VOLTAR
                </button>

            </section>
        `;

        return;
    }

    /* =====================================================
   GUARDAR O ID DO PEDIDO PARA O AVISO "TOCANDO"
   ===================================================== */

if (pedidoCriado?.id) {

    localStorage.setItem(
        "pedidoMusicaId",
        String(pedidoCriado.id)
    );

    monitorarPedidoTocando();

    console.log(
        "ID do pedido guardado:",
        pedidoCriado.id
    );

}
    console.log(
        "Pedido registrado com sucesso!"
    );

    mostrarSucessoPedido();
}

/* =========================================================
   SUCESSO DO PEDIDO
   ========================================================= */

function mostrarSucessoPedido() {

    app.innerHTML = `
        <section class="tela-pedido">

            <h1>🎵 Pedido enviado!</h1>

            <p>
                Obrigado, ${escaparHTML(
                    dadosPedinte.cliente
                )}!
            </p>

            <p>
                Recebemos seu pedido de:
            </p>

            <div class="resumo-musica">

                <strong>
                    ${escaparHTML(
                        musicaSelecionada.titulo
                    )}
                </strong>

                <span>
                    ${escaparHTML(
                        musicaSelecionada.artista || ""
                    )}
                </span>

            </div>

            <p>
                💖 Vamos tocar com muito carinho!
            </p>

            <button
                type="button"
                onclick="carregarMusicas()"
            >
                OK
            </button>

        </section>
    `;
}

/* =========================================================
   PARTE 2A/2
   CONTRIBUIÇÃO + INÍCIO DOS PRODUTOS
   ========================================================= */


/* =========================================================
   CONFIGURAÇÃO TEMPORÁRIA DO PIX
   ========================================================= */

const PIX_CONFIG = {

    chave: "00020126580014BR.GOV.BCB.PIX013618a8d7e7-3313-4884-9689-364d6d57ec065204000053039865802BR5925MARIO URBANO AQUINO FILHO6010PONTA PORA62070503***6304317B",

    qrCode: "../icons/pix.png"

};

/* =========================================================
   💖 CONTRIBUIÇÃO
   ========================================================= */

function mostrarContribuicao() {

    app.innerHTML = `

        <section class="tela-pedido">

            <h1>
                💖 Uma contribuição de coração
            </h1>

            <p>
                O que você contribuir de coração
                será muito bem-vindo para a dupla
                Lilian e Marinho.
            </p>

            <p>
                Muito obrigado pelo carinho
                e por apoiar a nossa música! ❤️
            </p>


            <div class="pix-box">

                <h2>
                    📱 Pix
                </h2>

                ${
                    PIX_CONFIG.qrCode
                    ?
                    `
                        <img
                            src="${escaparHTML(
                                PIX_CONFIG.qrCode
                            )}"
                            alt="QR Code Pix"
                            class="pix-qrcode"
                        >
                    `
                    :
                    `
                        <div class="pix-sem-qrcode">
                            QR Code Pix
                        </div>
                    `
                }


                <button
                    type="button"
                    id="botao-copiar-pix"
                >
                    📋 PIX COPIE E COLE
                </button>

            </div>


            <button
                type="button"
                onclick="mostrarOpcoesPedido()"
            >
                ← VOLTAR
            </button>

        </section>

    `;


    document
        .getElementById(
            "botao-copiar-pix"
        )
        .addEventListener(
            "click",
            copiarPixContribuicao
        );

}

/* =========================================================
   COPIAR PIX — CONTRIBUIÇÃO
   ========================================================= */

async function copiarPixContribuicao() {

    if (!PIX_CONFIG.chave) {

        alert(
            "A chave Pix ainda não foi configurada."
        );

        return;
    }


    try {

        await navigator.clipboard.writeText(
            PIX_CONFIG.chave
        );


        /*
         * Se estamos no fluxo de sugestão,
         * NÃO devemos criar um pedido de música.
         */

        if (sugestaoEmAndamento) {

            mostrarSucessoSugestao();

            return;

        }


        /*
         * Pedido normal:
         *
         * 1. Registra o pedido no Supabase
         * 2. Guarda o ID do pedido
         * 3. Ativa o monitoramento "TOCANDO"
         * 4. O V1 receberá a notificação sonora
         * 5. Depois mostra a confirmação ao pedinte
         */

        await finalizarPedido();


    } catch (erro) {

        console.error(
            "Erro ao copiar chave Pix:",
            erro
        );

        alert(
            "Não foi possível copiar a chave Pix."
        );

    }

}

/* =========================================================
   AGRADECIMENTO — CONTRIBUIÇÃO
   ========================================================= */

function mostrarAgradecimentoContribuicao() {

    if (sugestaoEmAndamento) {

    mostrarSucessoSugestao();

    return;

}
    app.innerHTML = `

        <section class="tela-pedido">

            <h1>
                💖 Muito obrigado!
            </h1>

            <p>
                A chave Pix foi copiada.
            </p>

            <p>
                Lilian e Marinho agradecem
                de coração pelo seu carinho
                e pela sua contribuição! ❤️
            </p>

            <button
                type="button"
                id="botao-ok-contribuicao"
            >
                OK
            </button>

        </section>

    `;


    document
    .getElementById(
        "botao-ok-contribuicao"
    )
    .addEventListener(
        "click",
        carregarMusicas
    );

}


/* =========================================================
   🛍️ PRODUTOS
   ========================================================= */

async function mostrarProdutos() {

    app.innerHTML = `

        <section class="tela-pedido">

            <h1>
                🛍️ Nossos produtos
            </h1>

            <p>
                Carregando produtos...
            </p>

        </section>

    `;


    const {
        data,
        error
    } =
        await supabaseClient
            .from("produtos")
            .select(
                  "id, nome, categoria, estoque, preco, imagem_1, imagem_2, imagem_3, imagem_4"
)
            .order(
                "nome",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Erro ao carregar produtos:",
            error
        );


        app.innerHTML = `

            <section class="tela-pedido">

                <h1>
                    ⚠️ Ops!
                </h1>

                <p>
                    Não conseguimos carregar
                    os produtos neste momento.
                </p>

                <button
                    type="button"
                    onclick="mostrarProdutos()"
                >
                    🔄 TENTAR NOVAMENTE
                </button>

                <button
                    type="button"
                    onclick="mostrarOpcoesPedido()"
                >
                    ← VOLTAR
                </button>

            </section>

        `;

        return;
    }


    if (!data || data.length === 0) {

        app.innerHTML = `

            <section class="tela-pedido">

                <h1>
                    🛍️ Produtos
                </h1>

                <p>
                    Nenhum produto disponível
                    no momento.
                </p>

                <button
                    type="button"
                    onclick="mostrarOpcoesPedido()"
                >
                    ← VOLTAR
                </button>

            </section>

        `;

        return;
    }


    mostrarCatalogoProdutos(data);

}

/* =========================================================
   📷 URL PÚBLICA DAS FOTOS DOS PRODUTOS
   ========================================================= */

function obterUrlFotoProduto(
    caminho
) {

    if (!caminho) {

        return "";

    }


    const {
        data
    } =
        supabaseClient
            .storage
            .from("produtos")
            .getPublicUrl(
                caminho
            );


    return data?.publicUrl || "";

}

/* =========================================================
   📸 CATÁLOGO DE PRODUTOS
   ========================================================= */

function mostrarCatalogoProdutos(
    produtos
) {

    app.innerHTML = `

        <section class="tela-pedido">

            <h1>
                🛍️ Nossos produtos
            </h1>

            <p>
                Escolha um produto.
            </p>

            <div
                id="catalogo-produtos"
            ></div>

            <button
                type="button"
                onclick="mostrarOpcoesPedido()"
            >
                ← VOLTAR
            </button>

        </section>

    `;


    const catalogo =
        document.getElementById(
            "catalogo-produtos"
        );


    produtos.forEach(
        (produto) => {

            const estoque =
                Number(
                    produto.estoque || 0
                );


            const preco =
                Number(
                    produto.preco || 0
                );


            /* =================================================
               📸 MONTAR LISTA DE FOTOS
               ================================================= */

            const fotos = [
                produto.imagem_1,
                produto.imagem_2,
                produto.imagem_3,
                produto.imagem_4
            ]
                .map(
                    (imagem) =>
                        obterUrlFotoProduto(
                            imagem
                        )
                )
                .filter(
                    Boolean
                );


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "produto-card";


            /* =================================================
               📸 GALERIA DE FOTOS
               ================================================= */

            let galeriaHtml = "";


            if (fotos.length > 0) {

                galeriaHtml = `

                    <div
                        class="galeria-produto"
                        style="
                            width:100%;
                            max-width:360px;
                            margin:0 auto 20px auto;
                            text-align:center;
                        "
                    >

                        <img
                            src="${escaparHTML(fotos[0])}"
                            alt="${escaparHTML(
                                produto.nome ||
                                "Produto"
                            )}"
                            class="foto-produto-principal"
                            style="
                                display:block;
                                width:100%;
                                max-width:360px;
                                height:260px;
                                object-fit:contain;
                                margin:0 auto;
                                border-radius:12px;
                            "
                        >

                        ${
                            fotos.length > 1
                                ? `
                                    <div
                                        class="miniaturas-produto"
                                        style="
                                            display:flex;
                                            justify-content:center;
                                            align-items:center;
                                            gap:8px;
                                            flex-wrap:wrap;
                                            margin-top:10px;
                                        "
                                    >

                                        ${fotos.map(
                                            (foto, indice) => `
                                                <button
                                                    type="button"
                                                    class="miniatura-produto"
                                                    data-foto="${escaparHTML(foto)}"
                                                    style="
                                                        padding:2px;
                                                        border:2px solid transparent;
                                                        border-radius:8px;
                                                        background:transparent;
                                                        cursor:pointer;
                                                    "
                                                >
                                                    <img
                                                        src="${escaparHTML(foto)}"
                                                        alt="Foto ${
                                                            indice + 1
                                                        }"
                                                        style="
                                                            display:block;
                                                            width:55px;
                                                            height:55px;
                                                            object-fit:cover;
                                                            border-radius:6px;
                                                        "
                                                    >
                                                </button>
                                            `
                                        ).join("")}

                                    </div>
                                `
                                : ""
                        }

                    </div>

                `;

            }


            /* =================================================
               🔴 PRODUTO ESGOTADO
               ================================================= */

            if (estoque <= 0) {

                card.innerHTML = `

                    ${galeriaHtml}

                    <h2>
                        ${escaparHTML(
                            produto.nome
                        )}
                    </h2>

                    <p>
                        🔴 Produto esgotado
                    </p>

                    <button
                        type="button"
                        class="botao-reservar"
                    >
                        📦 RESERVAR
                    </button>

                `;


                card
                    .querySelector(
                        ".botao-reservar"
                    )
                    .addEventListener(
                        "click",
                        () => {

                            mostrarReservaProduto(
                                produto
                            );

                        }
                    );


            } else {


                /* =================================================
                   🛒 PRODUTO DISPONÍVEL
                   ================================================= */

                card.innerHTML = `

                    ${galeriaHtml}

                    <h2>
                        ${escaparHTML(
                            produto.nome
                        )}
                    </h2>

                    <p>
                        Valor unitário:
                        <strong>
                            ${formatarMoeda(
                                preco
                            )}
                        </strong>
                    </p>

                    <p>
                        Disponível:
                        <strong>
                            ${estoque}
                        </strong>
                    </p>

                    <label>
                        Quantidade:
                    </label>

                    <input
                        type="number"
                        class="quantidade-produto"
                        min="1"
                        max="${estoque}"
                        value="1"
                    >

                    <p>
                        Total:
                        <strong
                            class="total-produto"
                        >
                            ${formatarMoeda(
                                preco
                            )}
                        </strong>
                    </p>

                    <button
                        type="button"
                        class="botao-comprar"
                    >
                        COMPRAR
                    </button>

                `;


                /* =================================================
                   📸 TROCAR FOTO PRINCIPAL
                   ================================================= */

                const fotoPrincipal =
                    card.querySelector(
                        ".foto-produto-principal"
                    );


                const miniaturas =
                    card.querySelectorAll(
                        ".miniatura-produto"
                    );


                miniaturas.forEach(
                    (miniatura) => {

                        miniatura.addEventListener(
                            "click",
                            () => {

                                const novaFoto =
                                    miniatura.dataset.foto;


                                if (
                                    fotoPrincipal &&
                                    novaFoto
                                ) {

                                    fotoPrincipal.src =
                                        novaFoto;

                                }


                                miniaturas.forEach(
                                    (item) => {

                                        item.style.borderColor =
                                            "transparent";

                                    }
                                );


                                miniatura.style.borderColor =
                                    "#d4af37";

                            }
                        );

                    }
                );


                /* =================================================
                   🔢 QUANTIDADE
                   ================================================= */

                const quantidadeInput =
                    card.querySelector(
                        ".quantidade-produto"
                    );


                const totalElemento =
                    card.querySelector(
                        ".total-produto"
                    );


                quantidadeInput.addEventListener(
                    "input",
                    () => {

                        let quantidade =
                            Number(
                                quantidadeInput.value
                            );


                        if (
                            !Number.isInteger(
                                quantidade
                            ) ||
                            quantidade < 1
                        ) {

                            quantidade = 1;

                        }


                        if (
                            quantidade > estoque
                        ) {

                            quantidade =
                                estoque;

                        }


                        quantidadeInput.value =
                            quantidade;


                        totalElemento.textContent =
                            formatarMoeda(
                                preco *
                                quantidade
                            );

                    }
                );


                /* =================================================
                   🛒 COMPRAR
                   ================================================= */

                card
                    .querySelector(
                        ".botao-comprar"
                    )
                    .addEventListener(
                        "click",
                        () => {

                            const quantidade =
                                Number(
                                    quantidadeInput.value
                                );


                            iniciarCompraProduto(
                                produto,
                                quantidade
                            );

                        }
                    );

            }


            catalogo.appendChild(
                card
            );

        }
    );

}

/* =========================================================
   INICIAR COMPRA
   ========================================================= */

function iniciarCompraProduto(
    produto,
    quantidade
) {

    const estoque =
        Number(
            produto.estoque || 0
        );


    if (
        !Number.isInteger(
            quantidade
        ) ||
        quantidade < 1
    ) {

        alert(
            "Informe uma quantidade válida."
        );

        return;
    }


    if (
        quantidade > estoque
    ) {

        alert(
            "Quantidade maior que o estoque disponível."
        );

        return;
    }


    const preco =
        Number(
            produto.preco || 0
        );


    mostrarFormaPagamento(
        produto,
        quantidade,
        preco
    );

}

/* =========================================================
   FORMATAÇÃO DE MOEDA
   ========================================================= */

function formatarMoeda(
    valor
) {

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
   PARTE 2B/2
   PAGAMENTO + COMPRAS + RESERVAS + FINALIZAÇÃO
   ========================================================= */


/* =========================================================
   💳 FORMAS DE PAGAMENTO
   ========================================================= */

function mostrarFormaPagamento(
    produto,
    quantidade,
    preco
) {

    const total =
        preco * quantidade;

    app.innerHTML = `

        <section class="tela-pedido">

            <h1>
                💳 Forma de pagamento
            </h1>

            <div class="resumo-produto">

                <strong>
                    ${escaparHTML(
                        produto.nome
                    )}
                </strong>

                <p>
                    Quantidade:
                    ${quantidade}
                </p>

                <p>
                    Valor unitário:
                    ${formatarMoeda(preco)}
                </p>

                <p>
                    <strong>
                        Total:
                        ${formatarMoeda(total)}
                    </strong>
                </p>

            </div>

            <p>
                Qual a forma de pagamento?
            </p>

            <button
                type="button"
                id="botao-pix-produto"
            >
                💚 PIX
            </button>

            <button
                type="button"
                id="botao-dinheiro-produto"
            >
                💵 DINHEIRO
            </button>

            <button
                type="button"
                onclick="mostrarProdutos()"
            >
                ← VOLTAR
            </button>

        </section>

    `;


    document
        .getElementById(
            "botao-pix-produto"
        )
        .addEventListener(
            "click",
            () => {

                mostrarDadosCompraPix(
                    produto,
                    quantidade,
                    preco
                );

            }
        );


    document
        .getElementById(
            "botao-dinheiro-produto"
        )
        .addEventListener(
            "click",
            () => {

                finalizarCompraDinheiro(
                    produto,
                    quantidade
                );

            }
        );

}

/* =========================================================
   💚 DADOS PARA COMPRA PIX
   ========================================================= */

function mostrarDadosCompraPix(
    produto,
    quantidade,
    preco
) {

    app.innerHTML = `

        <section class="tela-pedido">

            <h1>
                💚 Pagamento via Pix
            </h1>

            <p>
                Informe seus dados:
            </p>

            <label>
                Nome completo:
            </label>

            <input
                id="compra-nome"
                type="text"
                placeholder="Digite seu nome completo"
            >

            <label>
                WhatsApp:
            </label>

            <input
                id="compra-whatsapp"
                type="tel"
                placeholder="Digite seu WhatsApp"
            >

            <button
                type="button"
                id="botao-continuar-compra"
            >
                CONTINUAR
            </button>

            <button
                type="button"
                onclick="mostrarFormaPagamento(
                    ${JSON.stringify(produto)},
                    ${quantidade},
                    ${preco}
                )"
            >
                ← VOLTAR
            </button>

        </section>

    `;


    document
        .getElementById(
            "botao-continuar-compra"
        )
        .addEventListener(
            "click",
            () => {

                const nome =
                    document
                        .getElementById(
                            "compra-nome"
                        )
                        .value
                        .trim();


                const whatsapp =
                    document
                        .getElementById(
                            "compra-whatsapp"
                        )
                        .value
                        .trim();


                if (!nome) {

                    alert(
                        "Informe seu nome completo."
                    );

                    return;
                }


                if (!whatsapp) {

                    alert(
                        "Informe seu WhatsApp."
                    );

                    return;
                }


                mostrarPagamentoPixProduto(
                    produto,
                    quantidade,
                    preco,
                    nome,
                    whatsapp
                );

            }
        );

}


/* =========================================================
   💚 TELA DO PIX DO PRODUTO
   ========================================================= */

function mostrarPagamentoPixProduto(
    produto,
    quantidade,
    preco,
    nome,
    whatsapp
) {

    const total =
        preco * quantidade;


    app.innerHTML = `

        <section class="tela-pedido">

            <h1>
                💚 Pagamento Pix
            </h1>

            <div class="resumo-produto">

                <strong>
                    ${escaparHTML(
                        produto.nome
                    )}
                </strong>

                <p>
                    Quantidade:
                    ${quantidade}
                </p>

                <p>
                    Total:
                    <strong>
                        ${formatarMoeda(total)}
                    </strong>
                </p>

            </div>


            ${
                PIX_CONFIG.qrCode
                ?
                `
                    <img
                        src="${escaparHTML(
                            PIX_CONFIG.qrCode
                        )}"
                        alt="QR Code Pix"
                        class="pix-qrcode"
                    >
                `
                :
                `
                    <div class="pix-sem-qrcode">
                        QR Code Pix
                    </div>
                `
            }


            <button
                type="button"
                id="botao-copiar-pix-produto"
            >
                📋 PIX COPIE E COLE
            </button>

<button
    type="button"
    id="botao-voltar-pix-produto"
>
    ← VOLTAR
</button>
            
        </section>

    `;


    document
        .getElementById(
            "botao-copiar-pix-produto"
        )
        .addEventListener(
            "click",
            () => {

                confirmarCompraPix(
                    produto,
                    quantidade,
                    preco,
                    nome,
                    whatsapp
                );

            }
        );

        document
    .getElementById(
        "botao-voltar-pix-produto"
    )
    .addEventListener(
        "click",
        () => {

            mostrarDadosCompraPix(
                produto,
                quantidade,
                preco,
                nome,
                whatsapp
            );

        }
    );

}


/* =========================================================
   CONFIRMAR COMPRA PIX
   ========================================================= */

async function confirmarCompraPix(
    produto,
    quantidade,
    preco,
    nome,
    whatsapp
) {

    if (!PIX_CONFIG.chave) {

        alert(
            "A chave Pix ainda não foi configurada."
        );

        return;
    }


    try {

        await navigator.clipboard.writeText(
            PIX_CONFIG.chave
        );

    } catch (erro) {

        console.error(
            "Erro ao copiar Pix:",
            erro
        );

        alert(
            "Não foi possível copiar a chave Pix."
        );

        return;
    }


    /*
     * Conferimos o estoque novamente
     * antes de registrar a compra.
     */

    const {
        data: produtoAtual,
        error: erroEstoque
    } =
        await supabaseClient
            .from("produtos")
            .select(
                "id, nome, estoque, preco"
            )
            .eq(
                "id",
                produto.id
            )
            .single();


    if (
        erroEstoque ||
        !produtoAtual
    ) {

        console.error(
            "Erro ao conferir estoque:",
            erroEstoque
        );

        alert(
            "Não foi possível confirmar o estoque."
        );

        return;
    }


    const estoqueAtual =
        Number(
            produtoAtual.estoque || 0
        );


    if (
        estoqueAtual <= 0 ||
        quantidade > estoqueAtual
    ) {

        mostrarEstoqueEsgotado(
            produtoAtual
        );

        return;
    }


    const valorUnitario =
        Number(
            produtoAtual.preco || preco
        );


    const total =
        valorUnitario *
        quantidade;


    /*
     * Registrar compra
     */

    const compra = {

        produto_id:
            produto.id,

        produto:
            produto.nome,

        nome:
            nome,

        whatsapp:
            whatsapp,

        quantidade:
            quantidade,

        valor_unitario:
            valorUnitario,

        valor_total:
            total,

        pagamento:
            "pix",

        status:
            "confirmado"

    };


    const {
        error: erroCompra
    } =
        await supabaseClient
            .from("compras")
            .insert([
                compra
            ]);


    if (erroCompra) {

        console.error(
            "Erro ao registrar compra:",
            erroCompra
        );

        alert(
            "Não foi possível registrar a compra."
        );

        return;
    }

/*
     * Registrar também o pedido de música
     */

    if (musicaSelecionada) {

        const pedido = {

            musica_id:
                musicaSelecionada.id,

            musica:
                musicaSelecionada.titulo,

            artista:
                musicaSelecionada.artista || "",

            cliente:
                dadosPedinte.cliente,

            mesa:
                dadosPedinte.mesa || null,

            recado:
                dadosPedinte.recado || null,

            status:
                "aguardando"

        };


        console.log(
            "Registrando pedido de música junto com a compra:",
            pedido
        );


        const {
            data: pedidoCriado,
            error: erroPedido
        } =
            await supabaseClient
                .from("pedidos")
                .insert([
                    pedido
                ])
                .select()
                .single();


        if (erroPedido) {

            console.error(
                "Erro ao registrar pedido de música junto com a compra:",
                erroPedido
            );

            alert(
                "A compra foi registrada, mas não foi possível registrar o pedido de música."
            );

            return;
        }


        console.log(
            "Pedido de música registrado com sucesso:",
            pedidoCriado
        );

        /*
         * Guardar o novo ID para o aviso "TOCANDO"
         */

        if (pedidoCriado?.id) {

            localStorage.setItem(
                "pedidoMusicaId",
                String(pedidoCriado.id)
            );

            monitorarPedidoTocando();

            console.log(
                "Novo pedido salvo para monitoramento:",
                pedidoCriado.id
            );

            }

        }

    /*
     * Baixar estoque
     */

    const novoEstoque =
        estoqueAtual -
        quantidade;


    const {
        error: erroAtualizacao
    } =
        await supabaseClient
            .from("produtos")
            .update({
                estoque:
                    novoEstoque
            })
            .eq(
                "id",
                produto.id
            );


    if (erroAtualizacao) {

        console.error(
            "Erro ao atualizar estoque:",
            erroAtualizacao
        );

        alert(
            "A compra foi registrada, mas houve um problema ao atualizar o estoque. Avise a dupla."
        );

        return;
    }


    mostrarAgradecimentoCompra(
        produto,
        quantidade,
        total
    );

}


/* =========================================================
   AGRADECIMENTO — COMPRA PIX
   ========================================================= */

function mostrarAgradecimentoCompra(
    produto,
    quantidade,
    total
) {

    if (sugestaoEmAndamento) {

    mostrarSucessoSugestao();

    return;

}
    app.innerHTML = `

        <section class="tela-pedido">

            <h1>
                💖 Muito obrigado!
            </h1>

            <p>
                Obrigado por adquirir
                um dos nossos produtos.
            </p>

            <p>
                Lilian e Marinho agradecem
                de coração pelo carinho! ❤️
            </p>

            <div class="resumo-produto">

                <strong>
                    ${escaparHTML(
                        produto.nome
                    )}
                </strong>

                <p>
                    Quantidade:
                    ${quantidade}
                </p>

                <p>
                    Total:
                    ${formatarMoeda(total)}
                </p>

            </div>


            <button
                type="button"
                id="botao-ok-compra"
            >
                OK
            </button>

        </section>

    `;


    document
    .getElementById(
        "botao-ok-compra"
    )
    .addEventListener(
        "click",
        carregarMusicas
    );

}

/* =========================================================
   💵 PAGAMENTO EM DINHEIRO
   ========================================================= */

async function finalizarCompraDinheiro(
    produto,
    quantidade
) {

    if (sugestaoEmAndamento) {

        mostrarSucessoSugestao();

        return;

    }


    /*
     * Registrar o pedido de música
     *
     * A compra em dinheiro não entra
     * como venda confirmada em "compras".
     *
     * Porém, a música escolhida pelo pedinte
     * deve chegar normalmente ao painel V1.
     */

    if (musicaSelecionada) {

        const pedido = {

            musica_id:
                musicaSelecionada.id,

            musica:
                musicaSelecionada.titulo,

            artista:
                musicaSelecionada.artista || "",

            cliente:
                dadosPedinte.cliente,

            mesa:
                dadosPedinte.mesa || null,

            recado:
                dadosPedinte.recado || null,

            status:
                "aguardando"

        };


        console.log(
            "Registrando pedido de música junto com compra em dinheiro:",
            pedido
        );


        const {
            data: pedidoCriado,
            error: erroPedido
        } =
            await supabaseClient
                .from("pedidos")
                .insert([
                    pedido
                ])
                .select()
                .single();


        if (erroPedido) {

            console.error(
                "Erro ao registrar pedido de música junto com compra em dinheiro:",
                erroPedido
            );

            alert(
                "A compra foi selecionada, mas não foi possível registrar o pedido de música."
            );

            return;

        }


        console.log(
            "Pedido de música registrado com sucesso:",
            pedidoCriado
        );


        /*
         * Guardar o ID para o aviso
         * "SUA MÚSICA ESTÁ TOCANDO"
         */

        if (pedidoCriado?.id) {

            localStorage.setItem(
                "pedidoMusicaId",
                String(pedidoCriado.id)
            );


            monitorarPedidoTocando();


            console.log(
                "Novo pedido salvo para monitoramento:",
                pedidoCriado.id
            );

        }

    }


    app.innerHTML = `

        <section class="tela-pedido">

            <h1>
                💵 Pagamento em dinheiro
            </h1>

            <p>
                Procure a dupla Lilian e Marinho
                depois do show para garantir
                o seu produto.
            </p>

            <p>
                💖 Muito obrigado pelo carinho
                e pela preferência!
            </p>

            <button
                type="button"
                id="botao-ok-dinheiro"
            >
                OK
            </button>

        </section>

    `;


    document
        .getElementById(
            "botao-ok-dinheiro"
        )
        .addEventListener(
            "click",
            carregarMusicas
        );

}

/* =========================================================
   📦 RESERVA — PERGUNTA
   ========================================================= */

function mostrarEstoqueEsgotado(
    produto
) {

    app.innerHTML = `

        <section class="tela-pedido">

            <h1>
                📦 Produto esgotado
            </h1>

            <p>
                Esse produto está esgotado.
            </p>

            <p>
                Quer reservar para o próximo show?
            </p>


            <button
                type="button"
                id="botao-reserva-sim"
            >
                ✅ SIM
            </button>


            <button
                type="button"
                id="botao-reserva-nao"
            >
                ❌ NÃO
            </button>

        </section>

    `;


    document
        .getElementById(
            "botao-reserva-sim"
        )
        .addEventListener(
            "click",
            () => {

                mostrarReservaProduto(
                    produto
                );

            }
        );


    document
        .getElementById(
            "botao-reserva-nao"
        )
        .addEventListener(
            "click",
            finalizarPedido
        );

}


/* =========================================================
   📦 RESERVA — DADOS
   ========================================================= */

function mostrarReservaProduto(
    produto
) {

    app.innerHTML = `

        <section class="tela-pedido">

            <h1>
                📦 Reservar produto
            </h1>

            <p>
                Produto:
                <strong>
                    ${escaparHTML(
                        produto.nome
                    )}
                </strong>
            </p>


            <label>
                Nome completo:
            </label>

            <input
                id="reserva-nome"
                type="text"
                placeholder="Digite seu nome completo"
            >


            <label>
                WhatsApp:
            </label>

            <input
                id="reserva-whatsapp"
                type="tel"
                placeholder="Digite seu WhatsApp"
            >


            <button
                type="button"
                id="botao-continuar-reserva"
            >
                CONTINUAR
            </button>


            <button
                type="button"
                onclick="mostrarProdutos()"
            >
                ← VOLTAR
            </button>

        </section>

    `;


    document
        .getElementById(
            "botao-continuar-reserva"
        )
        .addEventListener(
            "click",
            () => {

                const nome =
                    document
                        .getElementById(
                            "reserva-nome"
                        )
                        .value
                        .trim();


                const whatsapp =
                    document
                        .getElementById(
                            "reserva-whatsapp"
                        )
                        .value
                        .trim();


                if (!nome) {

                    alert(
                        "Informe seu nome completo."
                    );

                    return;
                }


                if (!whatsapp) {

                    alert(
                        "Informe seu WhatsApp."
                    );

                    return;
                }


                mostrarPagamentoReserva(
                    produto,
                    nome,
                    whatsapp
                );

            }
        );

}


/* =========================================================
   📦 RESERVA — PIX
   ========================================================= */

function mostrarPagamentoReserva(
    produto,
    nome,
    whatsapp
) {

    const preco =
        Number(
            produto.preco || 0
        );


    app.innerHTML = `

        <section class="tela-pedido">

            <h1>
                💚 Reserva para o próximo show
            </h1>

            <p>
                Obrigado por ajudar a dupla
                Lilian e Marinho reservando
                um dos nossos produtos! ❤️
            </p>


            <div class="resumo-produto">

                <strong>
                    ${escaparHTML(
                        produto.nome
                    )}
                </strong>

                <p>
                    Valor:
                    ${formatarMoeda(preco)}
                </p>

            </div>


            ${
                PIX_CONFIG.qrCode
                ?
                `
                    <img
                        src="${escaparHTML(
                            PIX_CONFIG.qrCode
                        )}"
                        alt="QR Code Pix"
                        class="pix-qrcode"
                    >
                `
                :
                `
                    <div class="pix-sem-qrcode">
                        QR Code Pix
                    </div>
                `
            }


            <button
                type="button"
                id="botao-copiar-pix-reserva"
            >
                📋 CHAVE PIX COPIE E COLE
            </button>


            <button
                type="button"
                onclick="mostrarReservaProduto(
                    ${JSON.stringify(produto)}
                )"
            >
                ← VOLTAR
            </button>

        </section>

    `;


    document
        .getElementById(
            "botao-copiar-pix-reserva"
        )
        .addEventListener(
            "click",
            () => {

                confirmarReserva(
                    produto,
                    nome,
                    whatsapp
                );

            }
        );

}

/* =========================================================
   CONFIRMAR RESERVA
   ========================================================= */

async function confirmarReserva(
    produto,
    nome,
    whatsapp
) {

    if (!PIX_CONFIG.chave) {

        alert(
            "A chave Pix ainda não foi configurada."
        );

        return;
    }


    try {

        await navigator.clipboard.writeText(
            PIX_CONFIG.chave
        );

    } catch (erro) {

        console.error(
            "Erro ao copiar Pix:",
            erro
        );

        alert(
            "Não foi possível copiar a chave Pix."
        );

        return;
    }


    const preco =
        Number(
            produto.preco || 0
        );


    /*
     * Registrar reserva
     */

    const reserva = {

        produto_id:
            produto.id,

        produto:
            produto.nome,

        nome:
            nome,

        whatsapp:
            whatsapp,

        quantidade:
            1,

        valor_unitario:
            preco,

        valor_total:
            preco,

        pagamento:
            "pix",

        status:
            "confirmado"

    };


    const {
        error: erroReserva
    } =
        await supabaseClient
            .from("reservas")
            .insert([
                reserva
            ]);


    if (erroReserva) {

        console.error(
            "Erro ao registrar reserva:",
            erroReserva
        );

        alert(
            "Não foi possível registrar sua reserva."
        );

        return;
    }


    /*
     * Registrar também o pedido de música
     */

    if (musicaSelecionada) {

        const pedido = {

            musica_id:
                musicaSelecionada.id,

            musica:
                musicaSelecionada.titulo,

            artista:
                musicaSelecionada.artista || "",

            cliente:
                dadosPedinte.cliente,

            mesa:
                dadosPedinte.mesa || null,

            recado:
                dadosPedinte.recado || null,

            status:
                "aguardando"

        };


        console.log(
            "Registrando pedido de música junto com a reserva:",
            pedido
        );


        const {
            data: pedidoCriado,
            error: erroPedido
        } =
            await supabaseClient
                .from("pedidos")
                .insert([
                    pedido
                ])
                .select()
                .single();


        if (erroPedido) {

            console.error(
                "Erro ao registrar pedido de música junto com a reserva:",
                erroPedido
            );

            alert(
                "A reserva foi registrada, mas não foi possível registrar o pedido de música."
            );

            return;
        }


        console.log(
            "Pedido de música registrado com sucesso:",
            pedidoCriado
        );


        /*
         * Guardar o ID para o aviso
         * "SUA MÚSICA ESTÁ TOCANDO"
         */

        if (pedidoCriado?.id) {

            localStorage.setItem(
                "pedidoMusicaId",
                String(pedidoCriado.id)
            );


            monitorarPedidoTocando();


            console.log(
                "Novo pedido salvo para monitoramento:",
                pedidoCriado.id
            );

        }

    }


    mostrarAgradecimentoReserva();

}

/* =========================================================
   AGRADECIMENTO — RESERVA
   ========================================================= */

function mostrarAgradecimentoReserva() {

    if (sugestaoEmAndamento) {

    mostrarSucessoSugestao();

    return;

}

    app.innerHTML = `

        <section class="tela-pedido">

            <h1>
                💖 Muito obrigado!
            </h1>

            <p>
                Obrigado por ajudar a dupla
                Lilian e Marinho reservando
                um dos nossos produtos.
            </p>

            <p>
                Sua reserva foi registrada
                com sucesso. ❤️
            </p>


            <button
                type="button"
                id="botao-ok-reserva"
            >
                OK
            </button>

        </section>

    `;


    document
    .getElementById(
        "botao-ok-reserva"
    )
    .addEventListener(
        "click",
        carregarMusicas
    );

}


/* =========================================================
   FINALIZAR PEDIDO DA MÚSICA
   ========================================================= */

async function finalizarPedido() {

    if (
        !musicaSelecionada ||
        pedidoJaFinalizado
    ) {
        return;
    }


    pedidoJaFinalizado = true;


    const pedido = {

        musica_id:
            musicaSelecionada.id,

        musica:
            musicaSelecionada.titulo,

        artista:
            musicaSelecionada.artista || "",

        cliente:
            dadosPedinte.cliente,

        mesa:
            dadosPedinte.mesa || null,

        recado:
            dadosPedinte.recado || null,

        status:
            "aguardando"

    };


    console.log(
        "Registrando pedido:",
        pedido
    );

const {
    data: pedidoCriado,
    error
} =
    await supabaseClient
        .from("pedidos")
        .insert([
            pedido
        ])
        .select()
        .single();
    
    if (error) {

        console.error(
            "Erro ao registrar pedido:",
            error
        );

        pedidoJaFinalizado = false;

        app.innerHTML = `

            <section class="tela-pedido">

                <h1>
                    ⚠️ Ops!
                </h1>

                <p>
                    Não conseguimos registrar
                    seu pedido.
                </p>

                <p>
                    Tente novamente, por favor.
                </p>


                <button
                    type="button"
                    onclick="mostrarOpcoesPedido()"
                >
                    VOLTAR
                </button>

            </section>

        `;

        return;
    }

if (pedidoCriado?.id) {

    localStorage.setItem(
        "pedidoMusicaId",
        String(pedidoCriado.id)
    );

    console.log(
        "ID do pedido guardado:",
        pedidoCriado.id
    );

    monitorarPedidoTocando();

}

    console.log(
        "Pedido registrado com sucesso!"
    );


    mostrarSucessoPedido();

}
/* =========================================================
   MENSAGEM TEMPORÁRIA
   ========================================================= */

function mostrarMensagemTemporaria(
    titulo,
    mensagem
) {

    app.innerHTML = `
        <section class="tela-pedido">

            <h1>${titulo}</h1>

            <p>
                ${mensagem}
            </p>

            <button
                type="button"
                onclick="mostrarOpcoesPedido()"
            >
                ← VOLTAR
            </button>

        </section>
    `;
}

/* =========================================================
   SEGURANÇA — ESCAPAR HTML
   ========================================================= */

function escaparHTML(valor) {

    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}