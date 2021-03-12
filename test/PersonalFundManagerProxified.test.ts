import { ethers } from "hardhat";
import { Signer, BigNumber as EthersBigNumber, Contract, utils, constants } from "ethers";
import chai, { expect } from 'chai'
import { toChecksumAddress } from "web3-utils";
import { BigNumber } from "bignumber.js";

import { EthereumAddress, InterestRateMode } from '../types'
import { LENDING_POOL_ADDRESS_PROVIDER_ADDRESS } from "../constants";
import { DAI_ADDRESS, DAI_DECIMALS, ERC20ABI, getAaveProtocolDataProvider, getDAI } from "./utils";

chai.use(require('chai-bignumber')());

const test = it

describe("PersonalFundManagerProxified tests", function () {
    let accounts: Signer[];
    let userAccount: Signer
    let userAddress: EthereumAddress
    let adminAccount: Signer
    let adminAddress: EthereumAddress
    let proxyAdminInstance: Contract
    let proxyInstance: Contract
    let implementationInstance: Contract
    let daiInstanceForUser: Contract
    let protocolDataProvider: Contract

    before(async () => {
        accounts = await ethers.getSigners();
        userAccount = accounts[0]
        userAddress = await userAccount.getAddress()
        adminAccount = accounts[1]
        adminAddress = await adminAccount.getAddress()

        console.log("User address", userAddress)
        console.log("Admin address", adminAddress)

        // deploy admin
        const proxyAdminFactory = await ethers.getContractFactory("ProxyAdmin", adminAccount);
        proxyAdminInstance = await proxyAdminFactory.deploy()
        await proxyAdminInstance.deployTransaction.wait()

        // deploy implementation
        const implementationFactory = await ethers.getContractFactory("PersonalFundManager");
        implementationInstance = await implementationFactory.deploy()
        await implementationInstance.deployTransaction.wait()

        // get DAI
        await getDAI(userAccount)
        await getDAI(adminAccount)

        protocolDataProvider = getAaveProtocolDataProvider(userAccount)
    })

    beforeEach(async () => {
        // deploy proxy
        const initializeData = implementationInstance.interface.encodeFunctionData("initialize", [LENDING_POOL_ADDRESS_PROVIDER_ADDRESS, InterestRateMode.Variable])
        const proxyFactory = await ethers.getContractFactory("TransparentUpgradeableProxy", adminAccount)
        proxyInstance = await proxyFactory.deploy(
            implementationInstance.address,
            proxyAdminInstance.address,
            initializeData
        )
        await proxyInstance.deployTransaction.wait()

        // approvals
        daiInstanceForUser = new ethers.Contract(DAI_ADDRESS, ERC20ABI, userAccount);
        const approvalForUserReceipt = await daiInstanceForUser.approve(proxyInstance.address, constants.MaxUint256)
        await approvalForUserReceipt.wait()

        const approvalForAdminReceipt = await daiInstanceForUser.connect(adminAccount).approve(proxyInstance.address, constants.MaxUint256)
        await approvalForAdminReceipt.wait()
    });

    test('implementation is initialized', async () => {
        const proxyInstanceWithImplementationABI = implementationInstance.attach(proxyInstance.address)
        const addressProviderFromImplementation = await proxyInstanceWithImplementationABI.ADDRESSES_PROVIDER()

        expect(toChecksumAddress(addressProviderFromImplementation)).to.equal(toChecksumAddress(LENDING_POOL_ADDRESS_PROVIDER_ADDRESS))
    })

    test('user can deposit', async () => {
        const proxyInstanceWithImplementationABI = implementationInstance.attach(proxyInstance.address).connect(userAccount)
        const daiBalanceBefore: EthersBigNumber = await daiInstanceForUser.balanceOf(userAddress)
        const amountToDeposit = 1000;
        const amountToDepositUsingAssetDecimals = utils.parseUnits(amountToDeposit.toString(), DAI_DECIMALS)

        const receipt = await proxyInstanceWithImplementationABI.deposit(DAI_ADDRESS, amountToDepositUsingAssetDecimals)
        await receipt.wait()

        expect(receipt).to.be.an('object')

        const daiBalanceAfterFromContract: EthersBigNumber = await daiInstanceForUser.balanceOf(userAddress)
        const balanceAfterDepositCalculated = new BigNumber(daiBalanceBefore.toString()).minus(new BigNumber(amountToDepositUsingAssetDecimals.toString()))

        expect(balanceAfterDepositCalculated).to.be.bignumber.equal(new BigNumber(daiBalanceAfterFromContract.toString()))

        const userReserveData = await protocolDataProvider.getUserReserveData(DAI_ADDRESS, proxyInstance.address);

        expect(new BigNumber(userReserveData.currentATokenBalance.toString())).to.be.bignumber.greaterThan(new BigNumber(1))
    })
})