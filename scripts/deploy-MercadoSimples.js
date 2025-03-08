// scripts/deploy-banner.js
const { ethers } = require("hardhat");

async function getRandomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  //criando listas de usuários
  const lista_de_eleitores = await ethers.getSigners();
  const nove_eleitores = lista_de_eleitores.slice(0,8);
  const dez_eleitores = lista_de_eleitores.slice(9,18);
  // deploy do contrato de tokens
  const Token = await ethers.getContractFactory("MyToken");
  const token = await Token.deploy("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("address MyToken: ", tokenAddress);
  
  // deploy do contrato de Mercado Simples
  const MercadoSimples = await ethers.getContractFactory("MercadoSimples");
  const mercado = await MercadoSimples.deploy("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",tokenAddress);
  await mercado.waitForDeployment();
  const mercadoAddress = await mercado.getAddress();
  console.log("Mercado simples: ", mercadoAddress);

  //mintando tokens para os endereços
  for (let i = 0; i <= 19; i++) {
    await token.mint(lista_de_eleitores[i],10000);
  }

  // Cadastrando previsões
  await mercado.addPrevisao("O Nepal vai vencer o Oscar essa ano?", "A sequência de '7 anos no Tibet': '8 anos em Katmandu' se mostrou um dos favoritos das platéias esse ano. Acham que ele será o ganhador do Oscar?");
  await mercado.addPrevisao("O Ponte Preta vai vencer a séria A?", "Eles derrotaram o Vasco por 11x0, eles têm uma chance realista de vencer?");
  await mercado.addPrevisao("Kanye West será o próximo presidente dos EUA?", "Pesquisas mostram que a popularidade dele saiu de -2% para -1%, ele têm chance em 2028?");

  // lançando votos
  let temp;
  for (let id = 1; id <= 3; id++){
    for (let i = 1; i <= 10; i++) {
      temp = await getRandomBetween(1,10);
      temp = 100*temp;
      await token.connect(lista_de_eleitores[i]).approve(mercadoAddress,temp);
      await mercado.connect(lista_de_eleitores[i]).votar(id,temp);
      console.log("Eleitor ", i, " votou ", temp, " na predição", id);
    }
    for (let i = 11; i <= 18; i++) {
      temp = await getRandomBetween(1,10);
      temp = 100*temp;
      await token.connect(lista_de_eleitores[i]).approve(mercadoAddress,temp);
      temp = -temp;
      await mercado.connect(lista_de_eleitores[i]).votar(id,temp);
      console.log("Eleitor ", i, " votou ", temp, " na predição", id);
    }
  }
}

main().then(() => process.exit(0)).catch(error => {
  console.error(error);
  process.exit(1);
});