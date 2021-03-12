import { Signer, Contract, utils } from "ethers";

import ProtocolDataProviderArtifact from '@aave/protocol-v2/artifacts/contracts/misc/AaveProtocolDataProvider.sol/AaveProtocolDataProvider.json'
import LendingPoolAddressProviderArtifact from '@aave/protocol-v2/artifacts/contracts/interfaces/ILendingPoolAddressesProvider.sol/ILendingPoolAddressesProvider.json'
import LendingPoolArtifact from '@aave/protocol-v2/artifacts/contracts/interfaces/ILendingPool.sol/ILendingPool.json'

import { AAVE_DATA_PROVIDER_ADDRESS, LENDING_POOL_ADDRESS_PROVIDER_ADDRESS } from '../../constants'
import { EthereumAddress } from '../../types'

export const getAaveProtocolDataProvider = (signer: Signer): Contract => {
    return new Contract(AAVE_DATA_PROVIDER_ADDRESS, new utils.Interface(ProtocolDataProviderArtifact.abi), signer)
}

export const getLendingPoolAddressProvider = (signer: Signer): Contract => {
    return new Contract(LENDING_POOL_ADDRESS_PROVIDER_ADDRESS, new utils.Interface(LendingPoolAddressProviderArtifact.abi), signer)
}

export const getLendingPoolAt = (at: EthereumAddress, signer: Signer): Contract => {
    return new Contract(at, new utils.Interface(LendingPoolArtifact.abi), signer)
}
