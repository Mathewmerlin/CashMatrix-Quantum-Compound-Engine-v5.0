// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title StrategyProposalDAO
 * @notice Quant governance and proposal voting portal.
 */
contract StrategyProposalDAO is Ownable {
    struct Proposal {
        string description;
        uint256 votesFor;
        uint256 votesAgainst;
        bool executed;
    }

    Proposal[] public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event ProposalCreated(uint256 indexed proposalId, string description);
    event Voted(uint256 indexed proposalId, address indexed voter, bool support);

    constructor() Ownable(msg.sender) {}

    function createProposal(string calldata description) external onlyOwner {
        proposals.push(Proposal({
            description: description,
            votesFor: 0,
            votesAgainst: 0,
            executed: false
        }));
        emit ProposalCreated(proposals.length - 1, description);
    }

    function vote(uint256 proposalId, bool support) external {
        require(!hasVoted[proposalId][msg.sender], "Already voted");
        hasVoted[proposalId][msg.sender] = true;

        if (support) {
            proposals[proposalId].votesFor += 1;
        } else {
            proposals[proposalId].votesAgainst += 1;
        }

        emit Voted(proposalId, msg.sender, support);
    }
}
