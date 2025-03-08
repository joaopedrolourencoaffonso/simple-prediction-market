// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Prediction.sol";

contract PredictionDeployer {

    // Event to notify that a new Prediction contract has been deployed
    event PredictionContractDeployed(address contractAddress);

    // Function to deploy a new PredictionContract instance
    function deployPredictionContract(address _primeiroJuiz, address _tokenAddress) public returns (address) {
        // Deploy a new instance of PredictionContract
        PredictionContract newPredictionContract = new PredictionContract(_primeiroJuiz, _tokenAddress);

        // Emit the event with the new contract's address
        emit PredictionContractDeployed(address(newPredictionContract));

        // Return the address of the newly deployed contract
        return address(newPredictionContract);
    }
}
