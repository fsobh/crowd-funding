// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20, Ownable {

    bool public paused = false;


    constructor(uint256 initialSupply) ERC20("Crowd Funding Token", "CROWD") {
        _mint(msg.sender, initialSupply);
    }


  function _beforeTokenTransfer(address from, address to, uint256 amount) override(ERC20) internal {
    require(!paused, "Token Transfers are paused");
    super._beforeTokenTransfer(from, to, amount);
  }

  function togglePause() onlyOwner external returns (bool) {

    if (paused) {
        paused = false;
    }
    else{
        paused = true;
    }

    return true;

  }

  function isPaused()  external view returns (bool) {

   return paused;
    
}

}