import { ethers } from "hardhat";
import { Signer, BigNumber as EthersBigNumber, Contract, utils, constants } from "ethers";
import chai, { expect } from 'chai'
import { BigNumber } from "bignumber.js";

import ProtocolDataProviderArtifact from '@aave/protocol-v2/artifacts/contracts/misc/AaveProtocolDataProvider.sol/AaveProtocolDataProvider.json'
import LendingPoolAddressProviderArtifact from '@aave/protocol-v2/artifacts/contracts/interfaces/ILendingPoolAddressesProvider.sol/ILendingPoolAddressesProvider.json'
import LendingPoolArtifact from '@aave/protocol-v2/artifacts/contracts/interfaces/ILendingPool.sol/ILendingPool.json'

import { DAI, ETHEREUM_ADDRESS_LENGTH } from '../constants'
import { getDAI, DAI_ADDRESS, ERC20ABI, DAI_DECIMALS } from './utils'
import { EthereumAddress } from "../types";
import { toChecksumAddress } from "web3-utils";

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
    })

    beforeEach(async () => {
        // deploy
        const PersonalFundManager = await ethers.getContractFactory("PersonalFundManager");
        personalFundManagerInstance = await PersonalFundManager.deploy();
        await personalFundManagerInstance.deployTransaction.wait()

        // initialize 
        const initializeReceipt = await personalFundManagerInstance.initialize(LENDING_POOL_ADDRESS_PROVIDER_ADDRESS, InterestRateMode.Variable);
        await initializeReceipt.wait()

        // approve first
        const daiContractInstance = new ethers.Contract(DAI_ADDRESS, ERC20ABI, userAccount);
        const approvalReceipt = await daiContractInstance.approve(personalFundManagerInstance.address, constants.MaxUint256)
        await approvalReceipt.wait()

        protocolDataProvider = getAaveProtocolDataProvider(userAccount)
    });

    test('preconditions: user should have DAI balance > 0', async () => {
        const daiContract = new ethers.Contract(DAI_ADDRESS, ERC20ABI, userAccount);
        const daiBalance: EthersBigNumber = await daiContract.balanceOf(userAddress);

        expect(new BigNumber(daiBalance.toString())).to.be.bignumber.greaterThan(1);
    })

    test('preconditions: my current DAI Address is correct', async () => {
        const reservesTokens = await protocolDataProvider.getAllReservesTokens();
        const daiAddress = reservesTokens.find((token: { symbol: string }) => token.symbol === DAI)?.tokenAddress;

        expect(toChecksumAddress(daiAddress)).to.equal(toChecksumAddress(DAI_ADDRESS))
    })

    test("contract deployment", async () => {
        expect(personalFundManagerInstance).to.be.an('object');
        expect(personalFundManagerInstance.address).to.be.a('string')
        expect(personalFundManagerInstance.address).to.have.lengthOf(ETHEREUM_ADDRESS_LENGTH)
    })

    test('deposit', async () => {
        const amountToDeposit = 1000;
        const amountToDepositUsingAssetDecimals = utils.parseUnits(amountToDeposit.toString(), DAI_DECIMALS)


        const depositReceipt = await personalFundManagerInstance.deposit(DAI_ADDRESS, amountToDepositUsingAssetDecimals)
        await depositReceipt.wait()
        expect(depositReceipt).to.be.an('object')

        // TODO: assert events
    })

    test('borrow', async () => {
        await makeDeposit(1000)

        // TODO: try to see how to get interest rates and more data about the borrowing...
        const amountToBorrow = 10;
        const amountToBorrowUsingAssetDecimals = utils.parseUnits(amountToBorrow.toString(), DAI_DECIMALS)

        const borrowReceipt = await personalFundManagerInstance.borrow(DAI_ADDRESS, amountToBorrowUsingAssetDecimals)
        await borrowReceipt.wait()

        expect(borrowReceipt).to.be.an('object')

        // TODO: assert balances
    })

    test('withdraw', async () => {
        await makeDeposit(1000)

        const amountToWithdraw = 10;
        const amountToWithdrawUsingAssetDecimals = utils.parseUnits(amountToWithdraw.toString(), DAI_DECIMALS)

        const withdrawReceipt = await personalFundManagerInstance.withdraw(DAI_ADDRESS, amountToWithdrawUsingAssetDecimals)
        await withdrawReceipt.wait()

        expect(withdrawReceipt).to.be.an('object')

        // TODO: assert balances
    })

    test('repay', async () => {
        await makeDeposit(1000)
        await makeBorrow(10)

        const amountToRepay = 10;
        const amountToRepayUsingAssetDecimals = utils.parseUnits(amountToRepay.toString(), DAI_DECIMALS)

        const repayReceipt = await personalFundManagerInstance.repay(DAI_ADDRESS, amountToRepayUsingAssetDecimals)
        await repayReceipt.wait()

        expect(repayReceipt).to.be.an('object')

        // TODO: assert balances
    })


    const makeDeposit = async (amountToDeposit: number) => {
        const amountToDepositUsingAssetDecimals = utils.parseUnits(amountToDeposit.toString(), DAI_DECIMALS)
        const depositReceipt = await personalFundManagerInstance.deposit(DAI_ADDRESS, amountToDepositUsingAssetDecimals)
        await depositReceipt.wait()
    }

    const makeBorrow = async (amountToBorrow: number) => {
        const amountToBorrowUsingAssetDecimals = utils.parseUnits(amountToBorrow.toString(), DAI_DECIMALS)

        const borrowReceipt = await personalFundManagerInstance.borrow(DAI_ADDRESS, amountToBorrowUsingAssetDecimals)
        await borrowReceipt.wait()
    }

});
