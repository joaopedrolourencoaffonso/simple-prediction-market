// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Import the ERC-20 interface from OpenZeppelin or a custom implementation.
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MercadoSimples {
    uint256 internal numeroDePrevisoes;
    mapping(uint256 => Previsao) internal mappingPrevisoes;
    mapping(address => bool) internal mappingJuizes;
    //lista todos os juizes
    address[] internal listaDeJuizes;
    // Mapea id da votacao para votos e valores dos votos
    mapping(uint256 => mapping(address => int256)) internal mappingVotos;
    // evento da criacao de nova votacao
    event NovaPrevisaoEvent(uint256 indexed, string titulo, string conteudo);
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
    constructor(address primeiroJuiz, address tokenAddress) {
        mappingJuizes[primeiroJuiz] = true;
        listaDeJuizes.push(primeiroJuiz);
        numeroDePrevisoes = 0;
        token = IERC20(tokenAddress);
    }

    function getNumeroDePrevisoes() public view returns (uint256) {
        return numeroDePrevisoes;
    }

    function getPrevisao(uint256 idDaPrevisao) external view returns (string memory titulo, string memory texto, uint256 votosSim, uint256 votosNao, bool status, int256 totalSim, int256 totalNao) {
        return (
            mappingPrevisoes[idDaPrevisao].titulo,
            mappingPrevisoes[idDaPrevisao].texto,
            mappingPrevisoes[idDaPrevisao].votosSim,
            mappingPrevisoes[idDaPrevisao].votosNao,
            mappingPrevisoes[idDaPrevisao].status,
            mappingPrevisoes[idDaPrevisao].totalSim,
            mappingPrevisoes[idDaPrevisao].totalNao
        );
    }
    
    function addJuiz(address novoJuiz) external {
        require(mappingJuizes[msg.sender], "Endereco nao cadastrado como juiz");

        mappingJuizes[novoJuiz] = true;
        listaDeJuizes.push(novoJuiz);
    }
    
    function getJuizes() public view returns (address[] memory) {
        return listaDeJuizes;
    }

    function addPrevisao(string calldata _titulo, string calldata _texto) external {
        numeroDePrevisoes += 1;

        Previsao memory novaPrevisao = Previsao({
            id: numeroDePrevisoes,
            titulo: _titulo,
            texto: _texto,
            votosSim: 0,
            votosNao: 0,
            votantes: new address[](0),
            status: true,
            totalSim: 0,
            totalNao: 0
        });

        mappingPrevisoes[numeroDePrevisoes] = novaPrevisao;

        emit NovaPrevisaoEvent(numeroDePrevisoes, _titulo, _texto);
    }

    function abs(int256 x) public pure returns (uint256) {
        if (x < 0) {
            return uint256(-x); // If x is negative, return its positive equivalent
        }
        return uint256(x); // If x is already positive, just return it
    }

    function votar(uint256 idDaPrevisao, int256 valorDoVoto) external {
        uint256 valorAbsolutoDoVoto = abs(valorDoVoto);
        
        // verifica se ja votou
        require(mappingVotos[idDaPrevisao][msg.sender] == 0,"O eleitor ja votou nessa pesquisa");
        // voto nao pode ser zero
        require(valorDoVoto != 0,"Voto nao pode ser zero");
        // Check if the user has approved enough tokens
        uint256 allowanceAmount = token.allowance(msg.sender, address(this));
        require(allowanceAmount >= valorAbsolutoDoVoto, "Precisa aprovar a transferencia antes de chamar a funcao");
        
        // Contabilizando total de votos
        if (valorDoVoto > 0) {
            mappingPrevisoes[idDaPrevisao].votosSim += 1;
            mappingPrevisoes[idDaPrevisao].totalSim += valorDoVoto;
        } else {
            mappingPrevisoes[idDaPrevisao].votosNao += 1;
            mappingPrevisoes[idDaPrevisao].totalNao -= valorDoVoto;
        }

        //lista os votantes
        mappingPrevisoes[idDaPrevisao].votantes.push(msg.sender);
        
        // salva o valor do voto
        mappingVotos[idDaPrevisao][msg.sender] = valorDoVoto;

        // evento do voto
        emit NovoVoto(idDaPrevisao, msg.sender, valorDoVoto);

        // Transfer the tokens from msg.sender to the contract
        require(token.transferFrom(msg.sender, address(this), abs(valorDoVoto)), "Transferencia de tokens falhou");
    }

    function getVotantes(uint256 idDaPrevisao) external view returns (address[] memory) {
        // Verifica se votacao existe
        require(idDaPrevisao <= numeroDePrevisoes,"Previsao nao existe");
        return (
            mappingPrevisoes[idDaPrevisao].votantes
        );
    }

    function getVoto(uint256 idDaPrevisao, address votante) external view returns (int256 voto) {
        // Verifica se votacao existe
        require(idDaPrevisao <= numeroDePrevisoes,"Previsao nao existe");
        // verifica se ja votou
        require(mappingVotos[idDaPrevisao][votante] != 0,"O eleitor nao votou nessa pesquisa");
        return (
            mappingVotos[idDaPrevisao][votante]
        );
    }

    function encerraPrevisao(uint256 idDaPrevisao, string memory resultado) external {
        require(mappingJuizes[msg.sender],"Somente juizes podem encerrar votacoes");
        mappingPrevisoes[idDaPrevisao].status = false;
        emit PrevisaoEncerradaEvent(idDaPrevisao, resultado);
    }

    function pagaVotantes(uint256 idDaPrevisao, uint256 amount, address recipient) external {
        require(idDaPrevisao <= numeroDePrevisoes,"Previsao nao existe");
        require(!mappingPrevisoes[idDaPrevisao].status,"Votacao tem que estar encerrada");
        require(mappingJuizes[msg.sender],"Somente juizes podem realizar pagamentos");
        require(mappingVotos[idDaPrevisao][recipient] != 0,"O recipiente nao votou nessa pesquisa");
        require(amount > 0, "Quantia deve ser maior que zero");

        // Ensure the contract has enough tokens to perform the transfer
        uint256 contractBalance = token.balanceOf(address(this));
        require(contractBalance >= amount, "Saldo do contrato insuficiente para transferencia");

        // Perform the token transfer from the contract to the recipient
        require(token.transfer(recipient, amount), "Transferencia de token falhou");
    }

}