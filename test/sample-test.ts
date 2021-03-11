import { ethers } from "hardhat";
import { Signer, BigNumber as EthersBigNumber } from "ethers";
import chai, { expect } from 'chai'
import { BigNumber } from "bignumber.js";

import { getDAI, DAI_ADDRESS, ERC20ABI } from './utils'

chai.use(require('chai-bignumber')());

// https://docs.aave.com/developers/getting-started/deployed-contracts
const LENDING_POOL_ADDRESS = "0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9"

enum InterestRateMode {
    Stable = 1,
    Variable = 2
}

enum SupportedAssets {
    DAI = "",
    USDC = "",
    USDT = ""
}

type EthereumAddress = string

const test = it

describe("PersonalFundManager", function () {

    let accounts: Signer[];
    let userAccount: Signer
    let userAddress: EthereumAddress

    before(async () => {
        accounts = await ethers.getSigners();
        userAccount = accounts[0]
        userAddress = await userAccount.getAddress()
        await getDAI(userAccount)
    })

    beforeEach(async function () {
    });

    test('preconditions: user should have DAI balance > 0', async () => {
        const daiContract = new ethers.Contract(DAI_ADDRESS, ERC20ABI, userAccount);
        const daiBalance: EthersBigNumber = await daiContract.balanceOf(userAddress);

        expect(new BigNumber(daiBalance.toString())).to.be.bignumber.greaterThan(1);
    })

    test("contract deployment", async function () {
        const PersonalFundManager = await ethers.getContractFactory("PersonalFundManager");
        const personalFundManagerInstance = await PersonalFundManager.deploy(LENDING_POOL_ADDRESS, InterestRateMode.Variable);

        await personalFundManagerInstance.deployed();

        expect(personalFundManagerInstance).to.be.an('object');


    });
});
