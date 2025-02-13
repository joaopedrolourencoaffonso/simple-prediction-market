// scripts/deploy-banner.js
const { ethers } = require("hardhat");

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
}

main().then(() => process.exit(0)).catch(error => {
  console.error(error);
  process.exit(1);
});