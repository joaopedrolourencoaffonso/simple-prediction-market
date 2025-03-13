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
  console.log("deploy do contrato de tokens");
  const Token = await ethers.getContractFactory("MyToken");
  const token = await Token.deploy("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("address MyToken: ", tokenAddress);
  
  // deploy do contrato de Mercado Simples
  console.log("--- deploy do contrato de Mercado Simples ---");
  const PredictionFactory = await ethers.getContractFactory("PredictionFactory");
  const fabricaDePredicoes = await PredictionFactory.deploy("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
  await fabricaDePredicoes.waitForDeployment();
  const fabricaAddress = await fabricaDePredicoes.getAddress();
  console.log("Fábrica de predições: ", fabricaAddress);

  //mintando tokens para os endereços
  for (let i = 0; i <= 19; i++) {
    await token.mint(lista_de_eleitores[i],10000);
  }

  // Cadastrando previsões
  console.log("--- cadastrando previsões ---");
  await fabricaDePredicoes.deployPredictionContract("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", fabricaAddress,"O Nepal vai vencer o Oscar essa ano?", "A sequência de '7 anos no Tibet': '8 anos em Katmandu' se mostrou um dos favoritos das platéias esse ano. Acham que ele será o ganhador do Oscar?");
  await fabricaDePredicoes.deployPredictionContract("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", fabricaAddress,"O Ponte Preta vai vencer a séria A?", "Eles derrotaram o Vasco por 11x0, eles têm uma chance realista de vencer?");
  await fabricaDePredicoes.deployPredictionContract("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", fabricaAddress,"Kanye West será o próximo presidente dos EUA?", "Pesquisas mostram que a popularidade dele saiu de -2% para -1%, ele têm chance em 2028?");
  
  let previsoes = [];
  let previsao;

  previsao = await fabricaDePredicoes.getEndereco(1);
  previsoes.push(previsao);
  previsao = await fabricaDePredicoes.getEndereco(2);
  previsoes.push(previsao);
  previsao = await fabricaDePredicoes.getEndereco(3);
  previsoes.push(previsao);
  console.log("Endereços das previsões: ", previsoes);

  // cadastrando votos
  console.log("--- cadastrando votos ---");
  let contratoDePrevisao;
  let approveTx;
  for (let id = 1; id <= 3; id++){
    console.log("Cadastrando votos para previsao ", id, previsoes[id-1][2]);

    // You can get the ABI from the compiled contract artifacts
    const contractArtifact = await hre.artifacts.readArtifact("PredictionContract"); // or import it directly
    const contractABI = contractArtifact.abi; // ABI of the contract

    // Connect to the contract using ethers.getContractAt
    const contratoDePrevisao = await ethers.getContractAt(contractABI, previsoes[id-1][2]);

    // Now you can call functions on the contract
    const status = await contratoDePrevisao.getStatus();
    console.log("Contract status:", status);

    temp = await getRandomBetween(1,10);
    temp = 100*temp;
    approveTx = await token.connect(lista_de_eleitores[1]).approve(previsoes[0][2],temp);
    await approveTx.wait();

    let allowanceAmount = await token.allowance(lista_de_eleitores[1].address, previsoes[0][2]);
    console.log(allowanceAmount);
    await contratoDePrevisao.connect(lista_de_eleitores[1]).votar(temp,true);
    //console.log("Eleitor ", 1, " votou ", temp, " na predição", 1);
  }
}

main().then(() => process.exit(0)).catch(error => {
  console.error(error);
  process.exit(1);
});