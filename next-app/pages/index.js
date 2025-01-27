import Head from "next/head";
import { BigNumber, ethers } from "ethers";
import Web3Modal from "web3modal";
import {
  NFTContractAddress,
  NFTContractABI,
  tokenContractAddress,
  tokenContractABI,
} from "../constants";
import { useState, useEffect, useRef } from "react";
import styles from "../styles/Home.module.css";

export default function Home() {
  const zero = ethers.BigNumber.from("0");

  const [walletConnected, setWalletConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [balanceOfTokens, setBalanceOfTokens] = useState(zero);
  const [totalSupply, setTotalSupply] = useState(zero);
  const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero);
  const [amount, setAmount] = useState(zero);
  const [isOwner, setIsOwner] = useState(false);
  const web3ModalRef = useRef();

  const mintTokens = async (amount) => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new ethers.Contract(
        tokenContractAddress,
        tokenContractABI.abi,
        signer
      );

      const value = amount * 0.001;
      let txn = await tokenContract.publicMint(amount, {
        value: ethers.utils.parseEther(value.toString()),
      });
      setLoading(true);
      console.log("Minting...");

      await txn.wait();
      setLoading(false);
      console.log("Minting done");

      await getBalanceOfTokens();
      await getTokensToBeClaimed();
      getTotalSupply();
    } catch (e) {
      console.log(e);
    }
  };

  const claimTokens = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new ethers.Contract(
        tokenContractAddress,
        tokenContractABI.abi,
        signer
      );

      let txn = await tokenContract.claimToken();
      setLoading(true);
      console.log("Claiming tokens...");

      await txn.wait();
      setLoading(false);
      console.log("Claimed tokens");

      await getBalanceOfTokens();
      await getTotalSupply();
      await getTokensToBeClaimed();
    } catch (e) {
      console.log(e);
    }
  };

  const getBalanceOfTokens = async () => {
    try {
      const provider = await getProviderOrSigner();
      const tokenContract = new ethers.Contract(
        tokenContractAddress,
        tokenContractABI.abi,
        provider
      );

      const signer = await getProviderOrSigner(true);
      const senderAddress = await signer.getAddress();

      const balance = await tokenContract.balanceOf(senderAddress);
      setBalanceOfTokens(balance);
    } catch (e) {
      console.log(e);
      setBalanceOfTokens(zero);
    }
  };

  const getTotalSupply = async () => {
    try {
      const provider = await getProviderOrSigner();
      const tokenContract = new ethers.Contract(
        tokenContractAddress,
        tokenContractABI.abi,
        provider
      );

      const _totalSupply = await tokenContract.totalSupply();
      setTotalSupply(_totalSupply);
    } catch (e) {
      console.log(e);
    }
  };

  const getTokensToBeClaimed = async () => {
    try {
      let amount = 0;

      const provider = await getProviderOrSigner();

      const tokenContract = new ethers.Contract(
        tokenContractAddress,
        tokenContractABI.abi,
        provider
      );
      const nftContract = new ethers.Contract(
        NFTContractAddress,
        NFTContractABI.abi,
        provider
      );

      const signer = await getProviderOrSigner(true);
      const senderAddress = await signer.getAddress();

      const balance = await nftContract.balanceOf(senderAddress);

      if (balance > 0) {
        for (let index = 0; index < balance; index++) {
          const tokenId = await nftContract.tokenOfOwnerByIndex(
            senderAddress,
            index
          );
          const isClaimed = await tokenContract.tokensClaimed(tokenId);

          if (!isClaimed) {
            amount++;
          }
        }
      } else {
        setTokensToBeClaimed(zero);
      }
      setTokensToBeClaimed(BigNumber.from(amount));
    } catch (e) {
      console.log(e);
      setTokensToBeClaimed(zero);
    }
  };

  const getOwner = async () => {
    try {
      const provider = await getProviderOrSigner();
      const tokenContract = new ethers.Contract(
        tokenContractAddress,
        tokenContractABI.abi,
        provider
      );
      const _ownerAddress = await tokenContract.owner();

      const signer = await getProviderOrSigner(true);
      const senderAddress = await signer.getAddress();

      if (_ownerAddress.toLowerCase() === senderAddress.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (e) {
      console.log(e);
    }
  };

  const withdrawCoins = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new ethers.Contract(
        tokenContractAddress,
        tokenContractABI.abi,
        signer
      );

      let txn = await tokenContract.withdraw();
      setLoading(true);

      await txn.wait();
      setLoading(false);

      await getOwner();
    } catch (e) {
      console.log(e);
    }
  };

  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);

      await getTotalSupply();
      await getBalanceOfTokens();
    } catch (e) {
      console.log(e);
    }
  };

  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new ethers.providers.Web3Provider(provider);

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }

    return web3Provider;
  };

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
      getTotalSupply();
      getBalanceOfTokens();
      getTokensToBeClaimed();
      withdrawCoins();
    }
  }, [walletConnected]);

  const renderButton = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-3">
          <button className="py-2 pl-4 pr-5 text-white font-semibold rounded-3xl bg-cyan-600">
            Please wait...
          </button>
        </div>
      );
    }

    if (walletConnected && isOwner) {
      return (
        <div className="flex justify-center py-3">
          <button
            className="py-2 pl-4 pr-5 text-white font-semibold rounded-3xl bg-cyan-600"
            onClick={withdrawCoins}
          >
            Withdraw coins
          </button>
        </div>
      );
    }

    if (tokensToBeClaimed > 0) {
      return (
        <div className="flex justify-center py-3">
          <button
            className="py-2 pl-4 pr-5 text-white font-semibold rounded-3xl bg-cyan-600"
            onClick={claimTokens}
          >
            Claim tokens
          </button>
        </div>
      );
    }

    return (
      <div className="flex justify-center py-3">
        <div className="w-96">
          <input
            type="text"
            placeholder="Enter amount of tokens you want to mint..."
            className="p-2 text-black w-full rounded-l-3xl"
            onChange={(e) => setAmount(e.currentTarget.value)}
          />
        </div>

        <button
          className="py-2 pl-4 pr-5 text-white font-semibold rounded-r-3xl bg-gradient-to-r bg-cyan-600"
          onClick={() => mintTokens(amount)}
        >
          Mint
        </button>
      </div>
    );
  };

  return (
    <div className="flex h-screen justify-center items-center bg-slate-800">
      <Head>
        <title>Crypto Devs</title>
        <meta name="description" content="ICO-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="text-white">
        <div>
          <h1 className="text-6xl font-semibold text-center">
            Welcome to Crypto Devs ICO!
          </h1>
          <div className="text-xl py-7 text-center">
            You can claim or mint Crypto Dev tokens here
          </div>
          {walletConnected ? (
            <div>
              <div className="text-xl py-2 text-center">
                You have minted {ethers.utils.formatEther(balanceOfTokens)}{" "}
                Crypto Dev Tokens
              </div>
              <div className="text-xl py-2 text-center">
                Overall {ethers.utils.formatEther(totalSupply)}/10000 have been
                minted!!!
              </div>
              {renderButton()}
            </div>
          ) : (
            <div className="flex justify-center py-3">
              <button
                onClick={connectWallet}
                className="py-2 px-7 text-white font-semibold bg-indigo-700 rounded-3xl"
              >
                Connect your wallet
              </button>
            </div>
          )}
        </div>
      </div>

      <footer className="absolute inset-x-0 bottom-0 py-4 bg-slate-700 text-white flex justify-center">
        Made by Crypto Devs with{" "}
        <span className="text-red-500"> &#10084; </span>
      </footer>
    </div>
  );
}
