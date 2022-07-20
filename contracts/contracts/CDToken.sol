//SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IMyNFT.sol";

contract CDToken is ERC20, Ownable {
    IMyNFT MyNFT;

    uint256 public constant maxTotalSupply = 10000 * 10**18;
    uint256 public constant pricePerToken = 0.001 ether;
    uint256 public constant tokensPerNFT = 10 * 10**18;

    mapping(uint256 => bool) public tokensClaimed;

    constructor(address nftContractAddress) ERC20("Crypto Devs", "CD") {
        MyNFT = IMyNFT(nftContractAddress);
    }

    function publicMint(uint256 amount) public payable {
        uint256 _requiredAmt = amount * pricePerToken;
        require(msg.value >= _requiredAmt, "Didnot send enough eth");
        uint256 amtInDecimals = amount * 10**18;
        require(
            (totalSupply() + amtInDecimals) <= maxTotalSupply,
            "Max limit reached"
        );
        _mint(msg.sender, amount * 10**18);
    }

    function claimToken() public payable {
        uint256 balance = MyNFT.balanceOf(msg.sender);
        require(balance > 0, "You donot have any Crypto Devs NFT");

        uint256 amount = 0;
        for (uint256 index = 0; index < balance; index++) {
            uint256 tokenId = MyNFT.tokenOfOwnerByIndex(msg.sender, index);

            if (!tokensClaimed[tokenId]) {
                amount += 1;
                tokensClaimed[tokenId] = true;
            }

            require(amount > 0, "You have already claimed your tokens");
            _mint(msg.sender, amount * tokensPerNFT);
        }
    }

    function withdraw() public onlyOwner {
        address _owner = owner();
        (bool call, ) = _owner.call{value: address(this).balance}("");
        require(call, "Failed to withdraw");
    }

    receive() external payable {}

    fallback() external payable {}
}
