// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Import the ERC-20 interface from OpenZeppelin or a custom implementation.
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PredictionContract {
    mapping(address => bool) internal mappingJuizes;
    //lista todos os juizes
    address[] internal listaDeJuizes;
    // Mapea id da votacao para votos e valores dos votos
    mapping(uint256 => mapping(address => int256)) internal mappingVotos;
    // evento da criacao de nova votacao
    event PrevisaoEncerradaEvent(uint256 indexed, string resultado);
    // Evento com o voto e o votante
    event NovoVoto(uint256 idDaVotacao, address votante, int256 voto);
    // Declare a variable for the ERC-20 token interface
    IERC20 public token;

    struct Previsao {
        uint256 id;
        string titulo;
        string texto;
        uint256 votosSim;
        uint256 votosNao;
        address[] votantes;
        bool status;
        int256 totalSim;
        int256 totalNao;
    }

    // primeiro juiz a ser inserido
    constructor(address _primeiroJuiz, address _tokenAddress) {
        mappingJuizes[_primeiroJuiz] = true;
        listaDeJuizes.push(_primeiroJuiz);
        token = IERC20(_tokenAddress);
    }

    // Function to get the stored string
    function getString() public view returns (string memory) {
        return "oi!";
    }
}
