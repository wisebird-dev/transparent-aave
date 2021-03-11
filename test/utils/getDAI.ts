import { ethers, Signer } from "ethers";
import {
    ChainId,
    Token,
    WETH,
    Fetcher,
    Trade,
    Route,
    TokenAmount,
    TradeType,
    Percent,
} from "@uniswap/sdk";
import RouterArtifact from "@uniswap/v2-periphery/build/IUniswapV2Router02.json";
import { toChecksumAddress } from "web3-utils";

import { ERC20ABI } from './ERC20'

// https://etherscan.io/token/0x6b175474e89094c44da98b954eedeac495271d0f
export const DAI_ADDRESS = "0x6b175474e89094c44da98b954eedeac495271d0f"
export const DAI_DECIMALS = 18;
export const UNISWAP_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"

export const getDAI = async (signer: Signer) => {
    const daiContract = new ethers.Contract(DAI_ADDRESS, ERC20ABI, signer);
    const userAddress = await signer.getAddress()

    // balances before
    const ethBefore = await signer.getBalance();
    const daiBefore = await daiContract.balanceOf(userAddress);
    console.log("ETH balance before", ethers.utils.formatEther(ethBefore), "ETH");
    console.log("DAI balance before", ethers.utils.formatUnits(daiBefore), "DAI");

    // uniswap trade
    const daiTokenInstance = new Token(ChainId.MAINNET, toChecksumAddress(DAI_ADDRESS), DAI_DECIMALS);
    const pair = await Fetcher.fetchPairData(daiTokenInstance, WETH[daiTokenInstance.chainId]);
    const route = new Route([pair], WETH[daiTokenInstance.chainId]);
    const amountIn = "10000000000000000000"; // 10 WETH / ETH (handled by the router)

    const trade = new Trade(
        route,
        new TokenAmount(WETH[daiTokenInstance.chainId], amountIn),
        TradeType.EXACT_INPUT
    );
    const slippageTolerance = new Percent("50", "10000"); // 50 bips, or 0.50%
    const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw; // needs to be converted to e.g. hex
    const path = [WETH[daiTokenInstance.chainId].address, daiTokenInstance.address];
    const to = userAddress; // should be a checksummed recipient address
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from the current Unix time

    const amountOutMinHex = ethers.BigNumber.from(
        amountOutMin.toString()
    ).toHexString();

    const uniswapContract = new ethers.Contract(
        UNISWAP_ROUTER,
        RouterArtifact.abi,
        signer
    );

    const txReceipt = await uniswapContract.swapExactETHForTokens(
        amountOutMinHex,
        path,
        toChecksumAddress(to),
        deadline,
        {
            value: ethers.utils.parseEther("10"),
            gasLimit: 4000000,
        }
    );

    await txReceipt.wait();

    // balances after
    const ethAfter = await signer.getBalance();
    const daiAfter = await daiContract.balanceOf(userAddress);
    console.log("Ethereum Address", userAddress);
    console.log("ETH balance", ethers.utils.formatEther(ethAfter), "ETH");
    console.log("DAI balance", ethers.utils.formatUnits(daiAfter), "DAI");
};