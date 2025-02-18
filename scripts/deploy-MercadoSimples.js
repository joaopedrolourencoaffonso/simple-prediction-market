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
  await mercado.addPrevisao("Previsao 1", "Descrição previsão 1");
  await mercado.addPrevisao("Previsao 2", "Descrição previsão 2");
  await mercado.addPrevisao("Previsao 3", "Descrição previsão 3");

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