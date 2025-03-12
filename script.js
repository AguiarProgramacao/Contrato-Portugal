document.getElementById("adicionar-requerente").addEventListener("click", () => {
  const form = document.getElementById("requerentes-form");

  const novoRequerente = document.createElement("div");
  novoRequerente.classList.add("requerente");
  novoRequerente.innerHTML = `
    <fieldset>
      <legend>Dados do Requerente</legend>
      <label>Nome Completo:</label>
      <input type="text" name="nome" id="nome" placeholder="Nome completo do requerente" required>
      <label>Nacionalidade:</label>
      <input type="text" name="nacionalidade" placeholder="Nacionalidade do requerente" required>
      <label>Estado Civil:</label>
      <input type="text" name="estadoCivil" placeholder="Estado Civil do requerente" required>
      <label>Data de Nascimento:</label>
      <input type="date" name="dataNascimento" required>
      <label>Cidade do Nascimento:</label>
      <input type="text" name="localNascimento" placeholder="Cidade de Nascimento" required>
      <label>Estado do Nascimento:</label>
      <input type="text" name="estadoNascimento" placeholder="Estado de Nascimento" required>
      <label>CPF:</label>
      <input type="text" name="cpf" placeholder="CPF do Requerente (XXXXXXXXXXX)" required>
      <label>CEP:</label>
      <input class="input" type="text" id="cep" placeholder="Digite o CEP" name="cep">
      <div class="endereco-um">
        <div class="div">
          <label>Endereço:</label>
            <input class="input" type="text" id="endereco" name="endereco" placeholder="Automático" required>
          </div>
        <div class="div">
        <label>Bairro:</label>
        <input class="input" type="text" id="bairro" name="bairro" placeholder="Automático" required>
      </div>
      <div class="div">
        <label>Cidade:</label>
        <input class="input" type="text" id="cidade" name="cidade" placeholder="Automático" required>
      </div>
      </div>
      <div class="endereco-dois">
        <div class="div">
          <label>Número:</label>
          <input type="text" id="numero" placeholder="Preencher">
        </div>
        <div class="div">
          <label>Complemento:</label>
          <input class="input" type="text" id="complemento" name="complemento" placeholder="Preencher" />
        </div>
        <div class="div">
          <label>Estado:</label>
          <input class="input" type="text" id="estado" name="estado" placeholder="Automático" >
        </div>
      </div>
    </fieldset>
  `;

  form.appendChild(novoRequerente);
});

document.getElementById('contratoSelect').addEventListener('change', function() {
  if (this.value) {
      window.location.href = this.value;
  }
});

document.getElementById("forma-pagamento").addEventListener("change", (event) => {
  const container = document.getElementById("inputs-pagamentos-diferentes");
  const parcelasInput = document.getElementById("parcelas");

  container.innerHTML = "";

  if (event.target.value === "pagamentosDiferente") {
    parcelasInput.style.display = "none";

    const div = document.createElement("div");

    div.innerHTML = `
        <label>Forma de Pagamento do Requerente:</label>
        <select name="formaPagamento" class="forma-pagamento-requerente">
          <option value="">Selecionar</option>
          <option value="cartao">Cartão de Crédito</option>
          <option value="boleto">Boleto</option>
          <option value="transferencia">Transferência</option>
        </select>
        <label>Quantidade de Parcelas:</label>
        <input type="number" id="qntd-parcelas" class="parcelas-requerentes" value="0" min="0" />
      `;

    container.appendChild(div);

    div.querySelector(".forma-pagamento-requerente").addEventListener("change", (e) => {
      console.log(`Forma de pagamento selecionada: ${e.target.value}`);
    });
  } else {
    parcelasInput.style.display = "column";
  }
});

document.getElementById("requerentes-form").addEventListener("blur", async function (event) {
  if (event.target.name === "cep") {
    const cep = event.target.value.replace(/\D/g, "");

    if (cep.length !== 8) {
      alert("CEP inválido! Certifique-se de inserir 8 dígitos.");
      return;
    }

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (data.erro) {
        alert("CEP não encontrado!");
        return;
      }

      const fieldset = event.target.closest("fieldset");
      fieldset.querySelector('[name="endereco"]').value = data.logradouro || "Não informado";
      fieldset.querySelector('[name="bairro"]').value = data.bairro || "Não informado";
      fieldset.querySelector('[name="cidade"]').value = data.localidade || "Não informado";
      fieldset.querySelector('[name="estado"]').value = data.uf || "Não informado";
      fieldset.querySelector('[name="complemento"]').value = "";
      fieldset.querySelector('[name="numero"]').value = "";
    } catch (error) {
      console.error("Erro na busca do CEP:", error);
    }
  }
}, true);

const { pdfMake } = window;

document.getElementById("gerar-pdf").addEventListener("click", async () => {
  const loadImageAsBase64 = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => reject(`Erro ao carregar a imagem: ${url}`);
    });
  };

  const dataEmissao = new Date().toLocaleDateString();

  const obterCotacaoEuro = async () => {
    try {
      const response = await fetch("https://economia.awesomeapi.com.br/json/last/EUR-BRL");
      if (!response.ok) throw new Error("Erro ao obter a cotação do Euro");
      const data = await response.json();
      return parseFloat(data.EURBRL.bid);
    } catch (error) {
      console.error("Erro:", error);
      return null;
    }
  };

  const calcularDatasPagamento = (dataInicial, intervaloMeses, numParcelas) => {
    const datas = [];
    const data = new Date(dataInicial);
    const diaOriginal = data.getUTCDate();

    for (let i = 0; i < numParcelas; i++) {
      const novoMes = data.getUTCMonth() + intervaloMeses * i;
      const novoAno = data.getUTCFullYear() + Math.floor(novoMes / 12);
      const mesAjustado = novoMes % 12;

      let novaData = new Date(Date.UTC(novoAno, mesAjustado, diaOriginal));

      while (novaData.getUTCMonth() !== mesAjustado) {
        novaData.setUTCDate(novaData.getUTCDate() - 1);
      }

      datas.push(novaData);
    }

    return datas.map((d) =>
      d.toLocaleDateString("pt-BR", {
        timeZone: "UTC",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    );
  };

  try {
    const bgImage = await loadImageAsBase64("/assets/bg.png");
    const cotacaoEuro = await obterCotacaoEuro();
    if (!cotacaoEuro) {
      alert("Não foi possível obter a cotação do Euro. Tente novamente mais tarde.");
      return;
    }

    const requerentes = document.querySelectorAll(".requerente");

    const content = [
      {
        text: "INSTRUMENTO PARTICULAR DE CONTRATAÇÃO DE SERVIÇOS ADVOCATÍCIOS ",
        style: "header",
        margin: [0, 20, 0, 10],
      },
      {
        text: "I. DAS PARTES",
        style: "subheader",
        bold: true,
        margin: [0, 10, 0, 10]
      },
      {
        text: "Pelo presente instrumento particular, de um lado:",
        style: "paragraph",
        margin: [0, 10, 0, 10],
      },
    ];

    const nomesRequerentes = [];
    const pagamentosRequerentes = [];
    let textoRequerentes = [];
    let totalAdultos = 0;

    requerentes.forEach((requerente, index) => {
      const campos = requerente.querySelectorAll("input, select");
      const dados = Array.from(campos).map((campo) => campo.value);

      const [
        nome,
        nacionalidade,
        estadoCivil,
        dataNascimento,
        localNascimento,
        estadoNascimento,
        cpf,
        cep,
        endereco,
        bairro,
        cidade,
        numero,
        complemento,
        estado,
      ] = dados;

      function formatarCPF(cpf) {
        return cpf.replace(/\D/g, "")
          .replace(/(\d{3})(\d)/, "$1.$2")
          .replace(/(\d{3})(\d)/, "$1.$2")
          .replace(/(\d{3})(\d{2})$/, "$1-$2");
      };

      const cpfFormatado = formatarCPF(cpf);
      const dataNascimentoFormatada = new Date(dataNascimento);
      const dataFormatadaItaliana = new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "Europe/Rome",
      }).format(dataNascimentoFormatada);

      nomesRequerentes.push(nome);
      totalAdultos += 1;

      const formaPagamentoSelect = requerente.querySelector(".forma-pagamento-requerente");
      const parcelasInput = requerente.querySelector(".parcelas-requerentes");

      pagamentosRequerentes.push({
        nome,
        formaPagamento: formaPagamentoSelect?.value || "",
        quantidadeParcelas: parseInt(parcelasInput?.value || 0, 10),
      });

      // Monta o texto do requerente, deixando o nome em negrito
      textoRequerentes.push(
        { text: `${nome}`, bold: true },
        { text: `, ${nacionalidade}, ${estadoCivil}, nascido(a) aos ${dataFormatadaItaliana} na cidade de ${localNascimento}, estado de ${estadoNascimento}, Brasil. CPF n. ${cpfFormatado}. Residente em ${endereco}, nº${numero}, ${complemento}, bairro ${bairro}, cidade ${cidade} - ${estado} - CEP: ${cep}` }
      );

      if (index < requerentes.length - 1) {
        textoRequerentes.push({ text: "; " }); // Adiciona separação entre requerentes
      } else {
        textoRequerentes.push({ text: "; doravante denominado(s) CONTRATANTE(S)." });
      }
    });

    // Adiciona o bloco dos requerentes ao conteúdo do PDF
    content.push({ text: textoRequerentes, style: "paragraph", margin: [0, 0, 0, 10], alignment: "justify" });

    // Adiciona o bloco da CONTRATADA **apenas uma vez**
    const dadosImigrei = [
      { text: "Imigrei Assessoria de Imigração LTDA", bold: true },
      { text: " CNPJ nº 48.429.887/0001-64, com escritório profissional no Brasil no endereço Lagoa da Conceição, Florianópolis-SC e na Itália no endereço Corso Vittorio Emanuele 75, Soave (VR), CAP 37038, neste ato representada pela advogada" },
      { text: " Ana Caroline Azevedo Michelon", bold: true },
      { text: ", brasileira, italiana, solteira, carteira de identidade nº 45.661.346-8, CPF nº 442.462.388-21, residente e domiciliada na Via Pigna, 22, Soave (VR), CAP 37038, doravante denominada" },
      { text: " CONTRATADA.", bold: true }
    ];

    content.push({ text: dadosImigrei, style: "paragraph", margin: [0, 10, 0, 10], alignment: "justify" });

    // Adiciona a cláusula de contrato
    content.push({ text: "Entre os contraentes é livremente, de pleno recíproco acordo e de boa fé, firmado e reduzido a escrito o presente Contrato de Prestação de Serviços, para de boa fé ser interpretado, aplicado e/ou executado, no cumprimento das respectivas obrigações, assim como no exercício dos correspondentes direitos, que se rege pelas cláusulas seguintes: ", style: "paragraph", margin: [0, 10, 0, 10] });

    content.push({ text: "________________________________________________________________________________", alignment: "center", margin: [0, 10, 0, 15] });

    content.push(
      { text: "II. DO OBJETO", style: "subHeader", margin: [0, 10, 0, 5] },
      {
        text: "1. O presente contrato tem por objeto a prestação de serviços de assessoria jurídica pelo CONTRATADO ao/à CONTRATANTE, designadamente de aconselhamento e assessoria jurídica relativa ao reconhecimento de cidadania portuguesa, serviços estes que compreendem: assessoria documental, a instrução e representação no processo, o encaminhamento da documentação, o registro do assento, supervisão, se caso for contratado das transcrições de casamento, e emissão dos comprovativos de registro. Incluirá também a assistência informativa para o primeiro assento de cada requerente, além de toda a assistência e informação necessária até a conclusão das etapas acima. ",
        style: "paragraph",
        margin: [0, 10, 0, 10]
      },
      {
        text: "2. Para os efeitos do estabelecido no parágrafo antecedente, o/a CONTRATANTE habilitará o CONTRATADO ou advogado indicado por ele, com procuração bastante, incluindo a faculdade de substabelecimento.",
        style: "paragraph",
        margin: [0, 10, 0, 10]
      }
    );

    content.push({ text: "________________________________________________________________________________", alignment: "center", margin: [0, 10, 0, 15] });

    const formaPagamento = document.getElementById("forma-pagamento").value;
    const valorDaProposta = parseFloat(document.getElementById("valor-proposta").value);
    const qntdParcelas = parseInt(document.getElementById("qntd-parcelas").value, 10);
    const dataInicialPagamento = document.getElementById("data-inicial-pagamento").value;
    const datasPagamento = calcularDatasPagamento(dataInicialPagamento, 6, 3);
    const valorHonorario = parseFloat(valorDaProposta) - 650;

    let textoFormaPagamento = "";

    if (formaPagamento === "cartao") {
      textoFormaPagamento = [
        "O valor total do contrato é de ",
        { text: `${valorDaProposta} euros`, bold: true },
        ", sendo discriminados da seguinte forma:\n\n",
        "- ",
        { text: `${valorHonorario} euros`, bold: true },
        " referentes aos honorários;\n",
        "- O valor referente à taxa inicial de 650 euros deverá ser pago no momento do protocolo do processo.\n\n",
        `O valor será pago em ${qntdParcelas} parcelas através de cartão de crédito.\n\n`,
        "As partes estão cientes que é possível, até o momento do envio da documentação para a Espanha, acrescentar novos membros no processo, ",
        "cujo valor a acrescentar será de 600,00 euros por pessoa adulta (maior de 18 anos) e/ou menor desacompanhado.\n\n",
        "As partes acordam que será facultado ao contratado o direito de realizar a cobrança do valor contratado por todos os meios admitidos em direito."
      ];
    } else if (formaPagamento === "boleto") {
      const valorRealEuro = (valorDaProposta * cotacaoEuro).toFixed(2);
      const valorParcela = (valorRealEuro / qntdParcelas).toFixed(2);

      textoFormaPagamento = [
        "O valor total do contrato é de ",
        { text: `${valorDaProposta} euros`, bold: true },
        ", sendo discriminados da seguinte forma:\n\n",
        "- ",
        { text: `${valorHonorario} euros`, bold: true },
        " referentes aos honorários\n",
        "- O valor referente à taxa inicial de 650 euros deverá ser pago no momento do protocolo do processo.\n\n",
        "Ficou acordado entre as partes que o contratante fará o pagamento através de transferência bancária da seguinte maneira:\n",
        `Em ${qntdParcelas} parcela(s), no valor de R$ ${valorParcela} reais cada, totalizando no final R$${valorRealEuro} reais, `,
        "através de boleto pelo ASAAS que será gerado com o primeiro vencimento para o dia ",
        { text: `${datasPagamento[0]}`, bold: true },
        " e parcelas subsequentes até a plena quitação contratual."
      ];
    } else if (formaPagamento === "transferencia") {
      textoFormaPagamento = [
        "O valor total do contrato é de ",
        { text: `${valorDaProposta} euros`, bold: true },
        ", sendo discriminados da seguinte forma:\n\n",
        "- ",
        { text: `${valorHonorario} euros`, bold: true },
        " referentes aos honorários\n",
        "- O valor referente à taxa inicial de 650 euros deverá ser pago no momento do protocolo do processo.\n\n",
        "Ficou acordado entre as partes que os contratantes farão o pagamento através de transferência bancária da seguinte maneira:\n",
        "- 50% dos honorários na assinatura do contrato até ",
        { text: `${datasPagamento[0]}`, bold: true },
        ";\n- 25% dos honorários em ",
        { text: `${datasPagamento[1]}`, bold: true },
        ";\n- 25% dos honorários em ",
        { text: `${datasPagamento[2]}`, bold: true },
        "."
      ];
    }

    content.push(
      { text: "III. DO VALOR E DAS FORMAS DE PAGAMENTO", style: "subHeader", margin: [0, 10, 0, 10] },
      { text: textoFormaPagamento, style: "paragraph", margin: [0, 0, 0, 5], alignment: "justify" }
    );

    content.push(
      {
        text: "A CONTRATADA poderá ajustar os valores das parcelas vincendas em caso de variação cambial superior a 10% (dez por cento) em relação à cotação aplicada na data da assinatura do contrato, mediante comunicação prévia ao CONTRATANTE com pelo menos 30 (trinta) dias de antecedência.",
        style: "paragraph",
        margin: [0, 10, 0, 10]
      }
    );

    const textosFinais = [
      { textPDF: "As partes acordam que o atraso superior a 30 (trinta) dias de qualquer parcela em fase administrativa resultará na aplicação de juros de mora de 1% (um por cento) ao mês, acrescido de multa de 2% sobre o valor da parcela em atraso. Além disso, tal atraso culminará na suspensão dos serviços contratados, os quais somente serão retomados após a regularização integral do débito, incluindo eventuais encargos incidentes." },
      { textPDF: "No caso de pagamento por meio de cartão de crédito, o CONTRATANTE está ciente de que haverá a incidência de encargos financeiros aplicados pela administradora do cartão, os quais são de sua exclusiva responsabilidade." },
      { textPDF: "As partes estão cientes que os atos processuais como, distribuição do processo, e transcrição de sentença, só serão realizados com o pagamento em dia. Caso haja pendências contratuais no momento de tais atos, o mesmo restará suspenso, até a quitação do saldo devedor." },
      { textPDF: "As partes estão cientes de que, até o momento do envio da documentação para a Itália, é possível incluir novos membros no processo. O valor adicional para cada requerente maior de 12 anos será de 500 euros. Caso haja inclusão de um novo requerente, o valor das parcelas subsequentes será ajustado proporcionalmente, considerando o acréscimo inserido e o número de parcelas ainda pendentes." },
      { textPDF: "Requerentes menores de idade 12 anos poderão ser incluídos gratuitamente, desde que acompanhados por pelo menos um dos genitores que também figure como requerente no processo. Caso o menor seja incluído sem a participação do genitor, ele será considerado como requerente individual, e o valor adicional de honorários será aplicado." }
    ];

    content.push({
      ol: textosFinais.map(item => item.textPDF),
      margin: [0, 10, 0, 10]
    });

    content.push({ text: "________________________________________________________________________________", alignment: "center", margin: [0, 10, 0, 15] });

    content.push({
      text: "IV. PRAZO E ABRANGÊNCIA",
      style: "header",
      margin: [0, 10, 0, 10]
    })

    content.push({
      text: "1. O presente contrato vigora até o término da ação desde que não seja anteriormente rescindido por qualquer das PARTES.",
      style: "paragraph",
      margin: [0, 10, 0, 10]
    });
    content.push({
      text: "2. O presente contrato restringe-se ao objeto descrito nos termos da cláusula primeira. No caso de pedidos acessórios, um novo contrato deverá ser firmado tendo como objeto a prestação destes serviços.",
      style: "paragraph",
      margin: [0, 10, 0, 10]
    });
    content.push({
      text: "3. A nacionalidade portuguesa perdurará o tempo que levar a conservatória, não dependendo do trabalho do advogado contratado.",
      style: "paragraph",
      margin: [0, 10, 0, 10]
    });

    content.push({ text: "________________________________________________________________________________", alignment: "center", margin: [0, 10, 0, 15] });

    content.push({ text: "V. DA RESCISÃO CONTRATUAL", style: "header", margin: [0, 10, 0, 10] });

    content.push({
      text: "1. No caso de inadimplência, o CONTRATADO poderá se retirar deste Contrato, prévio aviso circunstanciado. Nesta eventualidade, a Advogada terá direito ao reembolso das despesas até o momento incorridas, além de eventual indenização pelo trabalho realizado. O direito de rescisão do contrato deverá ser exercido pelo Advogado por notificação formal ao Cliente, enviado por e-mail certificado ou por carta registrada com AR sem isenção de qualquer responsabilidade, exceto pelos custos de comunicação previstos em lei, e até a nomeação de outro defensor.",
      style: "list"
    });
    content.push({
      text: "2. Em caso de desistência pelo Cliente, permanece a obrigação de pagar ao Advogado, além dos custos eventualmente incorridos, a indenização devida pelo trabalho realizado até aquele momento, considerando os seguintes percentuais: 40% até o recebimento da documentação, 90% após protocolo do processo e 100% após a realização do registro.",
      style: "list"
    });
    content.push({
      text: "3. Ocorrendo alguma circunstância alheia a vontade das partes o presente contrato será rescindido, o valor pago será reembolsado referente aos serviços que não forem prestados.",
      style: "list"
    });
    content.push({
      text: "4. Para qualquer outra eventualidade não regulamentada neste Contrato, aplicam-se as disposições do artigo 432 do código civil português. ",
      style: "list"
    });

    content.push({ text: "________________________________________________________________________________", alignment: "center", margin: [0, 10, 0, 15] });

    content.push({
      text: "VI. PROTEÇÃO DE DADOS",
      style: "header",
      margin: [0, 10, 0, 10]
    });

    content.push({
      text: "Em conformidade com o Regulamento (UE) 2016/679 do Parlamento Europeu e do Conselho de 27 de abril de 2016, relativo a proteção das pessoas físicas, no que diz respeito ao tratamento dos dados pessoais e na livre circulação desses dados e na legislação nacional de desenvolvimento do mesmo, informamos que tratamos a informação que nos faculta e tem como finalidade de prestar o serviço solicitado e realizar a faturação do mesmo. Os dados proporcionados serão conservados enquanto se mantenha a relação comercial, ou durante os anos que sejam necessários para cumprir com as obrigações legais. Os dados não serão disponibilizados a terceiros, salvo nos casos em que exista alguma obrigação legal. ", style: "paragraph", margin: [0, 10, 0, 20]
    });

    content.push({
      text: "O/A CONTRATANTE tem o direito a obter a confirmação de como estamos tratando seus dados pessoais, assim sendo, tem o direito a acessar seus dados pessoais, retificar os dados que não estejam corretos ou solicitar o cancelamento, quando os dados já não sejam necessários, ficando desde já autorizada a utilização dos mesmos na forma especificada. ", style: "paragraph"
    });

    content.push({ text: "________________________________________________________________________________", alignment: "center", margin: [0, 10, 0, 15] });

    content.push({
      text: "VII. DO FORO",
      style: "header",
      margin: [0, 10, 0, 10]
    });

    content.push({
      text: "Para resolução de todos os litígios decorrentes do presente contrato, referentes à sua interpretação e execução, fica estipulada a competência do Tribunal Administrativo de Braga-Portugal, com expressa renúncia a qualquer outro. O conteúdo deste Contrato deve ser entendido como 'confidencial' entre as partes, e a comunicação e divulgação de seu conteúdo para terceiros, integralmente ou em parte, é proibida, excetuado quando por razões de justiça ou de requisitos fiscais e/ou tributários.",
      style: "paragraph",
      margin: [0, 10, 0, 10]
    });

    content.push({
      text: "Por estarem justos e contratados, assinam o presente instrumento em duas vias de igual teor e forma.",
      style: "paragraph",
      margin: [0, 10, 0, 10]
    });

    content.push(
      { text: `Verona, ${dataEmissao}`, style: "paragraph", margin: [0, 20, 0, 15], bold: true }
    );

    const contratanteSignature = [
      { text: "CONTRATANTE:", bold: true },
      { text: "________________________________________" }
    ];

    content.push({ text: contratanteSignature, style: "paragraph", margin: [0, 10, 0, 10] });

    const contratadaSignature = [
      { text: "CONTRATADA:", bold: true },
      { text: "________________________________________" }
    ];

    content.push(
      { text: contratadaSignature, style: "paragraph", margin: [0, 10, 0, 10] },
    );

    const docDefinition = {
      pageSize: "A4",
      pageMargins: [80, 60, 80, 40],
      content: content,
      styles: {
        header: { bold: true, fontSize: 11 },
        subHeader: { bold: true, fontSize: 11 },
        list: { fontSize: 11, margin: [10, 10, 0, 10] },
        paragraph: { fontSize: 11, alignment: "justify" },
        assinaturaNome: { fontSize: 11, bold: false },
      },
      background: {
        image: bgImage,
        width: 595.28,
        height: 841.89,
      },
    };

    pdfMake.createPdf(docDefinition).getBlob((blob) => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);

      const nomePrimeiroRequerente = nomesRequerentes[0] || "Contrato";
      link.download = `Contrato Cidadania Portuguesa - ${nomePrimeiroRequerente}.pdf`;

      link.click();
      URL.revokeObjectURL(link.href);
    });
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    alert("Ocorreu um erro ao gerar o PDF.");
  }
});
