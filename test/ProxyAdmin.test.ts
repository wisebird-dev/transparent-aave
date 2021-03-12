import { ethers } from "hardhat";
import { Signer, BigNumber as EthersBigNumber, Contract, utils, constants } from "ethers";
import chai, { expect } from 'chai'

import { EthereumAddress } from '../types'

chai.use(require('chai-bignumber')());

const test = it

const IMPLEMENTATION_LABEL = 'eip1967.proxy.implementation';
const ADMIN_LABEL = 'eip1967.proxy.admin';

describe("ProxyAdmin tests", function () {
    this.timeout(200000)

    let accounts: Signer[];
    let userAccount: Signer
    let userAddress: EthereumAddress
    let adminAccount: Signer
    let adminAddress: EthereumAddress
    let extraUserAccount: Signer
    let extraUserAddress: EthereumAddress
    let proxyAdminInstance: Contract
    let proxyInstance: Contract
    let implementationInstance: Contract

    before(async () => {
        accounts = await ethers.getSigners();
        userAccount = accounts[0]
        userAddress = await userAccount.getAddress()
        adminAccount = accounts[1]
        adminAddress = await adminAccount.getAddress()
        extraUserAccount = accounts[2]
        extraUserAddress = await extraUserAccount.getAddress()

        console.log("User address", userAddress)
        console.log("Admin address", adminAddress)
        console.log("Extra user address", extraUserAddress)

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

    test('proxy admin has owner', async () => {
        const proxyOwner = await proxyAdminInstance.owner()

        expect(proxyOwner).to.equal(adminAddress);
    })

    describe('getProxyAdmin', () => {
        test('can return the admin of the proxy', async () => {
            const admin = await proxyAdminInstance.getProxyAdmin(proxyInstance.address);

            expect(admin).to.be.equal(proxyAdminInstance.address);
        });
    });


    describe('changeProxyAdmin', () => {
        test('proxy admin can be changed', async () => {
            const changeProxyReceipt = await proxyAdminInstance.changeProxyAdmin(proxyInstance.address, extraUserAddress)
            await changeProxyReceipt.wait()

            const proxyOwner = await proxyAdminInstance.owner() // Note: The owner of the ProxyAdmin will continue being the admin address
            expect(proxyOwner).to.equal(adminAddress);

            const newProxyInstanceWithNewAdminSigner = proxyInstance.connect(extraUserAccount)
            const ownerFromProxy = await newProxyInstanceWithNewAdminSigner.callStatic.admin()
            expect(ownerFromProxy).to.equals(extraUserAddress)
        })
    })

    describe('getProxyImplementation', () => {
        test('get proxy implementation address', async () => {
            const implementationAddress = await proxyAdminInstance.getProxyImplementation(proxyInstance.address);

            expect(implementationAddress).to.be.equal(implementationInstance.address);
        });
    });

    test.skip('I can get admin from storage', async () => {
        const admin_storage_slot = "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103"

        const ownerFromStorage = await userAccount.provider?.getStorageAt(proxyInstance.address, admin_storage_slot)

        console.log("Owner from storage", ownerFromStorage)
    })
});
