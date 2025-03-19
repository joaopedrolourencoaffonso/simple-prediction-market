// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Prediction.sol";

contract PredictionFactory {
    uint256 internal numeroDePrevisoes;
    address owner;
    mapping(uint256 => Previsao) internal mappingPrevisoes;

    // Event to notify that a new Prediction contract has been deployed
    event PredictionContractDeployed(uint256 numeroDePrevisoes, address contractAddress);

    struct Previsao {
        string titulo;
        string texto;
        address endereco;
    }

    // owner
    constructor(address _owner) {
        owner = _owner;
    }

    // Function to deploy a new PredictionContract instance
    function deployPredictionContract(address _primeiroJuiz, address _tokenAddress,string calldata _titulo, string calldata _texto) public returns (address) {
        require(msg.sender == owner,"Apenas dono do contrato pode de");
        // Deploy a new instance of PredictionContract
        PredictionContract newPredictionContract = new PredictionContract(_primeiroJuiz, _tokenAddress, _titulo, _texto);

        address endereco = address(newPredictionContract);

        numeroDePrevisoes += 1;
        Previsao memory novaPrevisao = Previsao({
            titulo: _titulo,
            texto: _texto,
            endereco: endereco
        });

        mappingPrevisoes[numeroDePrevisoes] = novaPrevisao;

        // Emit the event with the new contract's address
        emit PredictionContractDeployed(numeroDePrevisoes, endereco);
        // Return the address of the newly deployed contract
        return endereco;
    }

    function getContractInfo(uint256 idDaPrevisao) public view returns (string memory titulo, string memory texto, address) {
        return (
            mappingPrevisoes[idDaPrevisao].titulo,
            mappingPrevisoes[idDaPrevisao].texto,
            mappingPrevisoes[idDaPrevisao].endereco
        );
    }

    function getNumeroDePrevisoes() public view returns (uint256) {
        return numeroDePrevisoes;
    }
}
