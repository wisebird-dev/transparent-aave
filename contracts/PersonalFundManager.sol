// SPDX-License-Identifier: Unlicense
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "hardhat/console.sol";

import { ILendingPoolAddressesProvider } from "./interfaces/ILendingPoolAddressesProvider.sol";
import { ILendingPool } from "./interfaces/ILendingPool.sol";
import { IERC20 } from "./interfaces/IERC20.sol";
import { Initializable } from "./dependencies/openzepellin/Initializable.sol";
import { DataTypes } from "./interfaces/DataTypes.sol";

contract PersonalFundManager is Initializable {
	uint16 interestRateMode;

	// AAVE Integration
	uint16 REFERRAL_CODE = 0;
	ILendingPoolAddressesProvider public ADDRESSES_PROVIDER;

	function initialize(ILendingPoolAddressesProvider _addressesProvider, uint16 _interestRateMode) public initializer {
		ADDRESSES_PROVIDER = _addressesProvider;
		interestRateMode = _interestRateMode;
	}

	function deposit(address _asset, uint256 _amount) public {
		ILendingPool lendingPool = ILendingPool(ADDRESSES_PROVIDER.getLendingPool());
		IERC20(_asset).transferFrom(msg.sender, address(this), _amount);
		IERC20(_asset).approve(ADDRESSES_PROVIDER.getLendingPool(), _amount);
		lendingPool.deposit(_asset, _amount, address(this), REFERRAL_CODE);
	}

	function borrow(address _asset, uint256 _amount) public {
		ILendingPool lendingPool = ILendingPool(ADDRESSES_PROVIDER.getLendingPool());
		lendingPool.borrow(_asset, _amount, interestRateMode, REFERRAL_CODE, address(this));
	}

	function withdraw(address _asset, uint256 _amount) public {
		ILendingPool lendingPool = ILendingPool(ADDRESSES_PROVIDER.getLendingPool());
		lendingPool.withdraw(_asset, _amount, address(this));
	}

	function repay(address _asset, uint256 _amount) public {
		address lendingPoolAddress = ADDRESSES_PROVIDER.getLendingPool();
		ILendingPool lendingPool = ILendingPool(lendingPoolAddress);
		DataTypes.ReserveData memory reserve = lendingPool.getReserveData(_asset);
		IERC20(reserve.aTokenAddress).approve(lendingPoolAddress, _amount);
		IERC20(_asset).approve(lendingPoolAddress, _amount);
		lendingPool.repay(_asset, _amount, interestRateMode, address(this));
	}
}
