// SPDX-License-Identifier: Unlicense
pragma solidity ^0.6.12;

import "hardhat/console.sol";

import "./interfaces/ILendingPoolAddressesProvider.sol";
import "./interfaces/ILendingPool.sol";
import "./interfaces/IERC20.sol";
import "./dependencies/openzepellin/Initializable.sol";

contract PersonalFundManager is Initializable {
	uint256 interestRateMode;

	// AAVE Integration
	uint16 REFERRAL_CODE = 0;
	ILendingPoolAddressesProvider public ADDRESSES_PROVIDER;

	function initialize(ILendingPoolAddressesProvider _addressesProvider, uint256 _interestRateMode) public initializer {
		ADDRESSES_PROVIDER = _addressesProvider;
		interestRateMode = _interestRateMode;
	}

	function deposit(address _asset, uint256 _amount) public {
		ILendingPool lendingPool = ILendingPool(ADDRESSES_PROVIDER.getLendingPool());
		IERC20(_asset).transferFrom(msg.sender, address(this), _amount);
		IERC20(_asset).approve(ADDRESSES_PROVIDER.getLendingPool(), _amount);
		lendingPool.deposit(_asset, _amount, address(this), REFERRAL_CODE);
	}

	function borrow(address asset, uint256 amount) public {
		ILendingPool lendingPool = ILendingPool(ADDRESSES_PROVIDER.getLendingPool());
		lendingPool.borrow(asset, amount, interestRateMode, REFERRAL_CODE, address(this));
	}

	function withdraw(address asset, uint256 amount) public {
		ILendingPool lendingPool = ILendingPool(ADDRESSES_PROVIDER.getLendingPool());
		lendingPool.withdraw(asset, amount, address(this));
	}

	function repay(address asset, uint256 amount) public {
		ILendingPool lendingPool = ILendingPool(ADDRESSES_PROVIDER.getLendingPool());
		lendingPool.repay(asset, amount, interestRateMode, address(this));
	}
}
