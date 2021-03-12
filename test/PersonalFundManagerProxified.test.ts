import { ethers } from "hardhat";
import { Signer, BigNumber as EthersBigNumber, Contract, utils, constants } from "ethers";
import chai, { expect } from 'chai'

import { EthereumAddress } from '../types'

chai.use(require('chai-bignumber')());

const test = it

const IMPLEMENTATION_LABEL = 'eip1967.proxy.implementation';
const ADMIN_LABEL = 'eip1967.proxy.admin';

describe("PersonalFundManagerProxified tests", function () {
    let accounts: Signer[];
    let userAccount: Signer
    let userAddress: EthereumAddress
    let adminAccount: Signer
    let adminAddress: EthereumAddress
    let proxyAdminInstance: Contract
    let proxyInstance: Contract
    let implementationInstance: Contract

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
    })

    beforeEach(async () => {
        // deploy proxy
        const initializeData = Buffer.from('')
        const proxyFactory = await ethers.getContractFactory("TransparentUpgradeableProxy", adminAccount)
        proxyInstance = await proxyFactory.deploy(
            implementationInstance.address,
            proxyAdminInstance.address,
            initializeData
        )
        await proxyInstance.deployTransaction.wait()
    });

    test('implementation is initialized', () => {

    })

    test('admin user can NOT call implementation functions', async () => {

    })

    test('admin user can call admin functions', async () => {

    })

    test('user (NOT ADMIN) can NOT call admin functions', async () => {

    })

    test('user (NOT ADMIN) can call implementation functions', async () => {

    })
})