const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

async function deploy() {
  //criando listas de usuários
  const lista_de_eleitores = await ethers.getSigners();
  const nove_eleitores = lista_de_eleitores.slice(0,8);
  const dez_eleitores = lista_de_eleitores.slice(9,18);
  // deploy do contrato de tokens
  const Token = await ethers.getContractFactory("MyToken");
  const token = await Token.deploy("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  // deploy do contrato de Mercado Simples
  const MercadoSimples = await ethers.getContractFactory("MercadoSimples");
  const mercado = await MercadoSimples.deploy("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",tokenAddress);
  await mercado.waitForDeployment();
  const mercadoAddress = await mercado.getAddress();

  //mintando tokens para os endereços
  for (let i = 0; i <= 19; i++) {
    await token.mint(lista_de_eleitores[i],10000);
  }

  return { token, mercado, lista_de_eleitores, nove_eleitores, dez_eleitores };
}

describe("MercadoSimples", function () {
  it("getNumeroDePrevisoes", async function () {
    const { token, mercado, lista_de_eleitores, nove_eleitores, dez_eleitores } = await loadFixture(deploy);
    //const tokenAddress = await token.getAddress(); // Updated to get the correct address
    //console.log("Test Token Address:", await token.getAddress());
    //console.log("Mercado Address:", await mercado.getAddress());
    
    let numeroDePrevisoes = await mercado.getNumeroDePrevisoes();
    expect(numeroDePrevisoes).to.equal(0);
    await mercado.addPrevisao("Título", "Conteúdo");
    
    numeroDePrevisoes = await mercado.getNumeroDePrevisoes();
    expect(numeroDePrevisoes).to.equal(1);
  });
  it("addJuiz e getJuizes", async function () {
    const { token, mercado, lista_de_eleitores, nove_eleitores, dez_eleitores } = await loadFixture(deploy);
    
    let listaDeJuizes = await mercado.getJuizes();
    expect(listaDeJuizes[0]).to.equal(lista_de_eleitores[0].address);

    // Vai adicionar outro juiz usando a conta f39
    await mercado.addJuiz(lista_de_eleitores[1].address);

    listaDeJuizes = await mercado.getJuizes();
    expect(listaDeJuizes[1]).to.equal(lista_de_eleitores[1].address);

    // vamos usar a conta adicionada acima para adicionar outro juiz
    await mercado.connect(lista_de_eleitores[1]).addJuiz(lista_de_eleitores[2].address);

    listaDeJuizes = await mercado.getJuizes();
    expect(listaDeJuizes[2]).to.equal(lista_de_eleitores[2].address);

    // deveria falhar por que o eleitor 10 não é um juiz
    await expect(mercado.connect(lista_de_eleitores[10]).addJuiz(lista_de_eleitores[11])).to.be.revertedWith("Endereco nao cadastrado como juiz");
  });
  it("addPrevisao e getPrevisao", async function () {
    const { token, mercado, lista_de_eleitores, nove_eleitores, dez_eleitores } = await loadFixture(deploy);
    let previsao;

    for (let i = 1; i <= 10; i++) {
      await mercado.addPrevisao("Título " + i, "Conteúdo " + i);
    }
    for (let i = 1; i <= 10; i++) {
      previsao = await mercado.getPrevisao(i);
      expect(previsao.titulo).to.equal("Título " + i);
      expect(previsao.texto).to.equal("Conteúdo " + i);
      expect(previsao.votosSim).to.equal(0);
      expect(previsao.votosNao).to.equal(0);
      expect(previsao.status).to.equal(true);
      expect(previsao.totalSim).to.equal(0);
      expect(previsao.totalNao).to.equal(0);
    }
  });
  it("fechaVotacao", async function () {
    const { token, mercado, lista_de_eleitores, nove_eleitores, dez_eleitores } = await loadFixture(deploy);

    await mercado.addPrevisao("Título 1", "Conteúdo 1");
    await mercado.addPrevisao("Título 2", "Conteúdo 2");

    // Testando para ver se a previsão foi criada corretamente
    let previsao1 = await mercado.getPrevisao(1);
    let previsao2 = await mercado.getPrevisao(2);
    expect(previsao1.status).to.equal(true);
    expect(previsao2.status).to.equal(true);

    // encerra a primeira previsao
    await mercado.encerraPrevisao(1,"sim");
    previsao1 = await mercado.getPrevisao(1);
    expect(previsao1.status).to.equal(false);
    expect(previsao2.status).to.equal(true);

    // Deveria falhar pois o usuário 10 não é um juiz
    await expect(mercado.connect(lista_de_eleitores[10]).encerraPrevisao(2,"sim")).to.be.revertedWith("Somente juizes podem encerrar votacoes");
  });
  it("votar", async function () {
    const { token, mercado, lista_de_eleitores, nove_eleitores, dez_eleitores } = await loadFixture(deploy);

    const mercadoAddress = await mercado.getAddress();

    await mercado.addPrevisao("Shrek is love, but is shrek life?", "Shrek is love, but is shrek life?");
    let previsao = await mercado.getPrevisao(1);
    expect(previsao.status).to.equal(true);

    // primeiro voto
    await token.approve(mercadoAddress, 100);
    await mercado.votar(1,100);

    // checando estado da previsao
    previsao = await mercado.getPrevisao(1);
    expect(previsao.votosSim).to.equal(1);
    expect(previsao.votosNao).to.equal(0);
    expect(previsao.totalSim).to.equal(100);
    expect(previsao.totalNao).to.equal(0);

    let tempNumber;
    for (let i = 1; i <= 5; i++) {
      tempNumber = 100*i;
      await token.connect(lista_de_eleitores[i]).approve(mercadoAddress, tempNumber);
      await mercado.connect(lista_de_eleitores[i]).votar(1,tempNumber);
    }

    // checando estado da previsao
    previsao = await mercado.getPrevisao(1);
    expect(previsao.votosSim).to.equal(6);
    expect(previsao.votosNao).to.equal(0);
    expect(previsao.totalSim).to.equal(1600);
    expect(previsao.totalNao).to.equal(0);

    for (let i = 6; i <= 10; i++) {
      tempNumber = 100*i;
      await token.connect(lista_de_eleitores[i]).approve(mercadoAddress, tempNumber);
      tempNumber = -tempNumber;
      await mercado.connect(lista_de_eleitores[i]).votar(1,tempNumber);
    }

    // checando estado da previsao
    previsao = await mercado.getPrevisao(1);
    expect(previsao.votosSim).to.equal(6);
    expect(previsao.votosNao).to.equal(5);
    expect(previsao.totalSim).to.equal(1600);
    expect(previsao.totalNao).to.equal(4000);

    // saldo do contrato deveria ser a soma do totalSim e totalNao
    let saldoContrato = await token.balanceOf(mercadoAddress);
    expect(saldoContrato).to.equal(previsao.totalNao + previsao.totalSim);

    // testando agora os erros

    // deveria lançar um erro porque o eleitor já votou
    await expect(mercado.connect(lista_de_eleitores[1]).votar(1,500)).to.be.revertedWith("O eleitor ja votou nessa pesquisa");

    // deveria lançar um erro porque o voto não pode ser zero
    await expect(mercado.connect(lista_de_eleitores[15]).votar(1,0)).to.be.revertedWith("Voto nao pode ser zero");

    // deveria lançar um erro porque o endereço não autorizou a transferência
    await expect(mercado.connect(lista_de_eleitores[15]).votar(1,100)).to.be.revertedWith("Precisa aprovar a transferencia antes de chamar a funcao");

    // deveria lançar um erro porque a transação vai falhar por falta de tokens
    await token.connect(lista_de_eleitores[15]).approve(mercadoAddress, 100000);
    await expect(mercado.connect(lista_de_eleitores[15]).votar(1,100000)).to.be.reverted;
  });
  it("getVotantes e getVoto", async function () {
    const { token, mercado, lista_de_eleitores, nove_eleitores, dez_eleitores } = await loadFixture(deploy);  

    const mercadoAddress = await mercado.getAddress();

    await mercado.addPrevisao("Shrek is love, but is shrek life?", "Shrek is love, but is shrek life?");
    let previsao = await mercado.getPrevisao(1);
    expect(previsao.status).to.equal(true);

    // criando votos
    await token.connect(lista_de_eleitores[1]).approve(mercadoAddress, 100);
    await token.connect(lista_de_eleitores[2]).approve(mercadoAddress, 100);
    await mercado.connect(lista_de_eleitores[1]).votar(1,100);
    await mercado.connect(lista_de_eleitores[2]).votar(1,-100);

    // deveria lançar um erro porque previsao nao existe
    await expect(mercado.getVotantes(10)).to.be.revertedWith("Previsao nao existe"); 

    // vendo se lista dos eleitores retorna corretamente
    let listaVotantes = await mercado.getVotantes(1);
    expect(listaVotantes[0]).to.equal(lista_de_eleitores[1]);
    expect(listaVotantes[1]).to.equal(lista_de_eleitores[2]);

    // Deveria falhar porque previsao nao existe
    await expect(mercado.getVoto(10,lista_de_eleitores[1])).to.be.revertedWith("Previsao nao existe");

    // Deveria falhar porque eleitor nao votou
    await expect(mercado.getVoto(1,lista_de_eleitores[10])).to.be.revertedWith("O eleitor nao votou nessa pesquisa");

    // Pega os valores dos votos
    let voto1 = await mercado.getVoto(1,lista_de_eleitores[1]);
    let voto2 = await mercado.getVoto(1,lista_de_eleitores[2]);

    expect(voto1).to.be.equal(100);
    expect(voto2).to.be.equal(-100);
  });
  it("pagaVotantes", async function () {
    const { token, mercado, lista_de_eleitores, nove_eleitores, dez_eleitores } = await loadFixture(deploy);  

    const mercadoAddress = await mercado.getAddress();

    await mercado.addPrevisao("Shrek is love, but is shrek life?", "Shrek is love, but is shrek life?");
    let previsao = await mercado.getPrevisao(1);
    expect(previsao.status).to.equal(true);

    // gerando votos sim
    await token.connect(lista_de_eleitores[0]).approve(mercadoAddress, 100);
    await mercado.connect(lista_de_eleitores[0]).votar(1,100);
    await token.connect(lista_de_eleitores[1]).approve(mercadoAddress, 200);
    await mercado.connect(lista_de_eleitores[1]).votar(1,200);
    await token.connect(lista_de_eleitores[2]).approve(mercadoAddress, 300);
    await mercado.connect(lista_de_eleitores[2]).votar(1,300);
    // gerando votos nao
    await token.connect(lista_de_eleitores[3]).approve(mercadoAddress, 400);
    await mercado.connect(lista_de_eleitores[3]).votar(1,-400);
    await token.connect(lista_de_eleitores[4]).approve(mercadoAddress, 500);
    await mercado.connect(lista_de_eleitores[4]).votar(1,-500);
    await token.connect(lista_de_eleitores[5]).approve(mercadoAddress, 600);
    await mercado.connect(lista_de_eleitores[5]).votar(1,-600);

    // deveria lançar um erro pois a previsao não existe
    await expect(mercado.pagaVotantes(10,100,lista_de_eleitores[1])).to.be.revertedWith("Previsao nao existe");
    
    // deveria lançar um erro pois a previsao ainda não foi encerrada
    await expect(mercado.pagaVotantes(1,100,lista_de_eleitores[1])).to.be.revertedWith("Votacao tem que estar encerrada");

    // ENCERRANDO PREVISAO
    await mercado.encerraPrevisao(1,"sim");
    
    // NOTA: O VALOR DAS TRANSFERÊNCIAS SERÁ CALCULADO OFFCHAIN PARA ECONOMIZAR GAS
    await mercado.pagaVotantes(1,100,lista_de_eleitores[1]);
    
    // pegando valores
    const saldoContrato = await token.balanceOf(mercadoAddress);
    const saldoConta = await token.balanceOf(lista_de_eleitores[1]);

    // verificando valores
    expect(saldoContrato).to.be.equal(2000);
    expect(saldoConta).to.be.equal(9900);


    // ABAIXO, TESTES DE REQUIRE
    // deveria lançar um erro pois o eleitor nao votou nessa pesquisa
    await expect(mercado.pagaVotantes(1,100,lista_de_eleitores[10])).to.be.revertedWith("O recipiente nao votou nessa pesquisa");
    
    // deveria lançar um erro pois a quantia deve ser maior que zero
    await expect(mercado.connect(lista_de_eleitores[10]).pagaVotantes(1,100,lista_de_eleitores[1])).to.be.revertedWith("Somente juizes podem realizar pagamentos");
    
    // deveria lançar um erro pois a quantia deve ser maior que zero
    await expect(mercado.pagaVotantes(1,0,lista_de_eleitores[1])).to.be.revertedWith("Quantia deve ser maior que zero");

    // deveria lançar um erro pois a quantia é maior que o saldo do contrato
    await expect(mercado.pagaVotantes(1,10000000,lista_de_eleitores[1])).to.be.revertedWith("Saldo do contrato insuficiente para transferencia");
  });
});