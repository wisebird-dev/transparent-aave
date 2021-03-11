//SPDX-License-Identifier: Unlicense
pragma solidity ^0.6.12;

import "hardhat/console.sol";

import "./interfaces/ILendingPool.sol";

contract PersonalFundManager {
    // total assets
    // total debt
    // number of assets
    // assets
    ILendingPool lendingPool;
    uint256 interestRateMode;

    // AAVE Integration
    uint16 REFERRAL_CODE = 0;

    constructor(address _lendingPool, uint256 _interestRateMode) public {
        console.log("Setting up the lending pool");
        lendingPool = ILendingPool(_lendingPool);
        interestRateMode = _interestRateMode;
    }

    function deposit(address asset, uint256 amount) public {
        lendingPool.deposit(asset, amount, address(this), 0);
    }

    function borrow(address asset, uint256 amount) public {
        lendingPool.borrow(
            asset,
            amount,
            interestRateMode,
            REFERRAL_CODE,
            address(this)
        );
    }

    function withdraw(address asset, uint256 amount) public {
        lendingPool.withdraw(asset, amount, address(this));
    }

    function repay(address asset, uint256 amount) public {
        lendingPool.repay(asset, amount, interestRateMode, address(this));
    }

    // function greet() public view returns (string memory) {
    //     return greeting;
    // }

    // function setGreeting(string memory _greeting) public {
    //     console.log("Changing greeting from '%s' to '%s'", greeting, _greeting);
    //     greeting = _greeting;
    // }

    // deposit
    // borrow
    // repay
    // withdraw
}
