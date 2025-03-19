// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Import the ERC-20 interface from OpenZeppelin or a custom implementation.
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

contract PredictionContract {
    // mapping de endereços de juízes
    mapping(address => bool) internal mappingJuizes;
    // mapping dos votantes
    mapping(address => uint256) internal mappingVotos;
    //lista todos os juizes
    address[] internal listaDeJuizes;
    //lista de votantes
    address[] internal listaDeVotantes;
    // Evento com o voto e o votante
    event NovoVoto(address votante, uint256 voto, bool opcao);
    // Evento de mudança no status
    event NovoStatus(address juiz, bool status, string msg);
    // Declare a variable for the ERC-20 token interface
    IERC20 public token;
    string titulo;
    string texto;
    uint256 votosSim;
    uint256 votosNao;
    uint256 totalSim;
    uint256 totalNao;
    address[] votantes;
    bool status;

    // primeiro juiz a ser inserido
    constructor(address _primeiroJuiz, address _tokenAddress, string memory _titulo, string memory _texto) {
        mappingJuizes[_primeiroJuiz] = true;
        listaDeJuizes.push(_primeiroJuiz);
        token = IERC20(_tokenAddress);
        titulo = _titulo;
        texto = _texto;
        status = true;
    }

    // Function to get the stored string
    function getPrevisao() public pure returns (string memory titulo, string memory texto, uint256 votosSim, uint256 votosNao, uint256 totalSim, uint256 totalNao, bool status) {
        return (titulo, texto, votosSim, votosNao, totalSim, totalNao, status);
    }

    function addJuiz(address novoJuiz) external {
        require(mappingJuizes[msg.sender], "Endereco nao cadastrado como juiz");

        mappingJuizes[novoJuiz] = true;
        listaDeJuizes.push(novoJuiz);
    }
    
    function getJuizes() public view returns (address[] memory) {
        return listaDeJuizes;
    }

    function getStatus() public view returns (bool){
        return status;
    }

    function setStatus(bool newStatus, string calldata mensagem) public {
        require(mappingJuizes[msg.sender], "Endereco nao cadastrado como juiz");

        status = newStatus;

        emit NovoStatus(msg.sender,status,mensagem);
    }

    function votar(uint256 valorDoVoto, bool opcao) external {
        // verifica se ja votou
        require(mappingVotos[msg.sender] == 0,"O eleitor ja votou nessa previsao");
        require(valorDoVoto > 0,"Voto nao pode ser zero");
        // Check if the user has approved enough tokens
        uint256 allowanceAmount = token.allowance(msg.sender, address(this));
        require(allowanceAmount >= valorDoVoto, "Precisa aprovar a transferencia antes de chamar a funcao");
        
        // Contabilizando total de votos
        if (opcao) {
            votosSim += 1;
            totalSim += valorDoVoto;
        } else {
            votosNao += 1;
            totalNao += valorDoVoto;
        }

        //lista os votantes
        listaDeVotantes.push(msg.sender);
        
        // salva o valor do voto
        mappingVotos[msg.sender] = valorDoVoto;

        // Transfer the tokens from msg.sender to the contract
        require(token.transferFrom(msg.sender, address(this), valorDoVoto), "Transferencia de tokens falhou");

        // evento do voto
        emit NovoVoto(msg.sender, valorDoVoto, opcao);
    }
}
