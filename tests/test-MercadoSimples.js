const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MercadoSimples", function () {
  let MercadoSimples;
  let mercadoSimples;
  let owner;
  let juiz;
  let token;

  beforeEach(async function () {
    [owner, juiz] = await ethers.getSigners();

    // Deploy a mock ERC20 token for the contract
    const Token = await ethers.getContractFactory("MockERC20");
    token = await Token.deploy("Mock Token", "MTK", 1000000);
    await token.deployed();

    // Deploy the MercadoSimples contract
    MercadoSimples = await ethers.getContractFactory("MercadoSimples");
    mercadoSimples = await MercadoSimples.deploy(juiz.address, token.address);
    await mercadoSimples.deployed();
  });

  it("should return the correct initial number of predictions", async function () {
    const numeroDePrevisoes = await mercadoSimples.getNumeroDePrevisoes();
    expect(numeroDePrevisoes).to.equal(0);
  });

  it("should increment the number of predictions after adding one", async function () {
    // Add a new prediction
    await mercadoSimples.addPrevisao("Prediction Title", "Prediction Content");

    // Check if the number of predictions has been incremented
    const numeroDePrevisoes = await mercadoSimples.getNumeroDePrevisoes();
    expect(numeroDePrevisoes).to.equal(1);
  });
});
