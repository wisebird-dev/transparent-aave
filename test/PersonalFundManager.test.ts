import { ethers } from "hardhat";
import { Signer, BigNumber as EthersBigNumber, Contract, utils, constants } from "ethers";
import chai, { expect } from 'chai'
import { BigNumber } from "bignumber.js";
import { toChecksumAddress } from "web3-utils";

import { DAI, ETHEREUM_ADDRESS_LENGTH } from '../constants'
import { getDAI, DAI_ADDRESS, ERC20ABI, DAI_DECIMALS } from './utils'
// const LendingPoolV2Artifact = require('@aave/protocol-v2/artifacts/contracts/protocol/lendingpool/LendingPool.sol/LendingPool.json');
import ProtocolDataProviderArtifact from '@aave/protocol-v2/artifacts/contracts/misc/AaveProtocolDataProvider.sol/AaveProtocolDataProvider.json'
import LendingPoolAddressProviderArtifact from '@aave/protocol-v2/artifacts/contracts/interfaces/ILendingPoolAddressesProvider.sol/ILendingPoolAddressesProvider.json'
import LendingPoolArtifact from '@aave/protocol-v2/artifacts/contracts/interfaces/ILendingPool.sol/ILendingPool.json'
import { EthereumAddress } from "../types";

chai.use(require('chai-bignumber')());

// https://docs.aave.com/developers/getting-started/deployed-contracts
const LENDING_POOL_ADDRESS_PROVIDER_ADDRESS = "0xb53c1a33016b2dc2ff3653530bff1848a515c8c5"
const AAVE_DATA_PROVIDER_ADDRESS = "0x057835Ad21a177dbdd3090bB1CAE03EaCF78Fc6d"

enum InterestRateMode {
    Stable = 1,
    Variable = 2
}

enum SupportedAssets {
    DAI = "",
    USDC = "",
    USDT = ""
}

const test = it

const getAaveProtocolDataProvider = (signer: Signer): Contract => {
    return new Contract(AAVE_DATA_PROVIDER_ADDRESS, new utils.Interface(ProtocolDataProviderArtifact.abi), signer)
}

const getLendingPoolAddressProvider = (signer: Signer): Contract => {
    return new Contract(LENDING_POOL_ADDRESS_PROVIDER_ADDRESS, new utils.Interface(LendingPoolAddressProviderArtifact.abi), signer)
}

const getLendingPoolAt = (at: EthereumAddress, signer: Signer): Contract => {
    return new Contract(at, new utils.Interface(LendingPoolArtifact.abi), signer)
}

const IMPLEMENTATION_LABEL = 'eip1967.proxy.implementation';
const ADMIN_LABEL = 'eip1967.proxy.admin';

describe("PersonalFundManager", function () {
    this.timeout(200000)

    let accounts: Signer[];
    let userAccount: Signer
    let userAddress: EthereumAddress

    let personalFundManagerInstance: Contract;
    let protocolDataProvider: Contract
    let proxyAdmin: Contract

    before(async () => {
        accounts = await ethers.getSigners();
        userAccount = accounts[0]
        userAddress = await userAccount.getAddress()

        // get DAI
        await getDAI(userAccount)

        // deploy
        const PersonalFundManager = await ethers.getContractFactory("PersonalFundManager");
        personalFundManagerInstance = await PersonalFundManager.deploy();
        await personalFundManagerInstance.deployTransaction.wait()

        // initialize 
        const initializeReceipt = await personalFundManagerInstance.initialize(LENDING_POOL_ADDRESS_PROVIDER_ADDRESS, InterestRateMode.Variable);
        await initializeReceipt.wait()

        protocolDataProvider = getAaveProtocolDataProvider(userAccount)
    })

    beforeEach(async () => {

    });

    test('preconditions: user should have DAI balance > 0', async () => {
        const daiContract = new ethers.Contract(DAI_ADDRESS, ERC20ABI, userAccount);
        const daiBalance: EthersBigNumber = await daiContract.balanceOf(userAddress);

        expect(new BigNumber(daiBalance.toString())).to.be.bignumber.greaterThan(1);
    })

    test("contract deployment", async () => {
        expect(personalFundManagerInstance).to.be.an('object');
        expect(personalFundManagerInstance.address).to.be.a('string')
        expect(personalFundManagerInstance.address).to.have.lengthOf(ETHEREUM_ADDRESS_LENGTH)
    })

    test('deposit', async () => {
        const reservesTokens = await protocolDataProvider.getAllReservesTokens();
        const daiAddress = reservesTokens.find((token: { symbol: string }) => token.symbol === DAI)?.tokenAddress;
        const assetAddress = daiAddress; // DAI_ADDRESS
        const amountToDeposit = 1000;
        const amountToDepositUsingAssetDecimals = utils.parseUnits(amountToDeposit.toString(), DAI_DECIMALS)
        const daiContractInstance = new ethers.Contract(DAI_ADDRESS, ERC20ABI, userAccount);

        // // transfer tokens to contracts
        // const transferReceipt = await daiContractInstance.transfer(personalFundManagerInstance.address, amountToDepositUsingAssetDecimals)
        // await transferReceipt.wait()

        // approve first
        const approvalReceipt = await daiContractInstance.approve(personalFundManagerInstance.address, constants.MaxUint256)
        await approvalReceipt.wait()
        expect(approvalReceipt).to.be.an('object')

        // const lendingPoolAddressProvider = getLendingPoolAddressProvider(userAccount)
        // const lendingPoolAddress = await lendingPoolAddressProvider.getLendingPool()
        // console.log("Lending Pool Address", lendingPoolAddress)

        // const approvalReceipt = await daiContractInstance.approve(lendingPoolAddress, constants.MaxUint256)
        // console.log("approvalReceipt", approvalReceipt)

        // const lendingPoolInstance = getLendingPoolAt(lendingPoolAddress, userAccount)
        // const receipt = await lendingPoolInstance.deposit(assetAddress, 1000, userAddress, 0)
        // console.log("Receipt", receipt)
        // await receipt.wait()
        // expect(receipt).to.be.an('object')

        const depositReceipt = await personalFundManagerInstance.deposit(assetAddress, amountToDepositUsingAssetDecimals)
        await depositReceipt.wait()
        expect(depositReceipt).to.be.an('object')
    })

    test('borrow', async () => {

    })

    test('withdraw', async () => {

    })

    test('repay', async () => {

    })
});
