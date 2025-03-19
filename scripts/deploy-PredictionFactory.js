const { ethers } = require("hardhat");

function getRandomValues() {
  const randomInt = 100*(Math.floor(Math.random() * 10) + 1);  // Random integer between 1 and 10
  const randomBool = Math.random() < 0.5;  // Random boolean (true or false)
  
  return { randomInt, randomBool };
}

async function main() {
  // Deploy the PredictionFactory contract
  const [owner, user1, user2, user3, user4, user5] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", owner.address);

  // deploy do contrato de tokens
  console.log("--- deploy do contrato de tokens ---");
  const Token = await ethers.getContractFactory("MyToken");
  const token = await Token.deploy("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("address MyToken: ", tokenAddress);

  const PredictionFactory = await ethers.getContractFactory("PredictionFactory");
  const factory = await PredictionFactory.deploy(owner.address);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("PredictionFactory deployed to:", factoryAddress);

  console.log("--- Deploy 3 PredictionContracts ---");
  //const tokenAddress = "0xYourTokenAddressHere"; // Replace with an actual token address
  const predictionContracts = [];
  let predictionContractAddress;
  for (let i = 0; i < 3; i++) {
    const titulo = `Prediction ${i + 1}`;
    const texto = `This is the prediction text for Prediction contract ${i + 1}`;
    await factory.deployPredictionContract(
      owner.address,  // _primeiroJuiz
      tokenAddress,   // _tokenAddress
      titulo,         // _titulo
      texto           // _texto
    );
    predictionContractAddress = await factory.getContractInfo(i + 1);
    predictionContracts.push(predictionContractAddress[2]);
    console.log(`PredictionContract ${i + 1} deployed at: ${predictionContractAddress[2]}`);
  }

  console.log("--- mintando os tokens para os usuários ---");
  await token.mint(owner,10000);
  await token.mint(user1,10000);
  await token.mint(user2,10000);
  await token.mint(user3,10000);
  await token.mint(user4,10000);
  await token.mint(user5,10000);

  console.log("--- Registrando votos ---");
  let voteValue;
  let voteOption;
  let valores;
  for (const contractAddress of predictionContracts) {
    console.log(" Registrando votos na predição: ", contractAddress);
    const predictionContract = await ethers.getContractAt("PredictionContract", contractAddress);
    //console.log("--> ", temp.randomInt, temp.randomBool);

    // Pegando contrato do token
    const token = await ethers.getContractAt("IERC20", tokenAddress);
    
    valores = getRandomValues();
    await token.connect(user1).approve(contractAddress, valores.randomInt);  
    // Cast vote from each user
    await predictionContract.connect(user1).votar(valores.randomInt, valores.randomBool);
    console.log(`User ${user1.address} voted ${valores.randomInt}, ${valores.randomBool} in PredictionContract ${contractAddress}`);

    // Add more users to vote
    valores = getRandomValues();
    await token.connect(user2).approve(contractAddress, valores.randomInt);
    await predictionContract.connect(user2).votar(valores.randomInt, valores.randomBool);
    console.log(`User ${user2.address} voted ${valores.randomInt}, ${valores.randomBool} in PredictionContract ${contractAddress}`);

    valores = getRandomValues();
    await token.connect(user3).approve(contractAddress, valores.randomInt);
    await predictionContract.connect(user3).votar(valores.randomInt, valores.randomBool);
    console.log(`User ${user3.address} voted ${valores.randomInt}, ${valores.randomBool} in PredictionContract ${contractAddress}`);

    valores = getRandomValues();
    await token.connect(user4).approve(contractAddress, valores.randomInt);
    await predictionContract.connect(user4).votar(valores.randomInt, valores.randomBool);
    console.log(`User ${user4.address} voted ${valores.randomInt}, ${valores.randomBool} in PredictionContract ${contractAddress}`);

    valores = getRandomValues();
    await token.connect(user5).approve(contractAddress, valores.randomInt);
    await predictionContract.connect(user5).votar(valores.randomInt, valores.randomBool);
    console.log(`User ${user5.address} voted ${valores.randomInt}, ${valores.randomBool} in PredictionContract ${contractAddress}`);
    //const voteValue = ethers.utils.parseUnits("1", 18); // Voting with 1 token
    //const voteOption = i % 2 === 0; // Alternating between true (yes) and false (no)
  }

  console.log("Deployment and voting completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
