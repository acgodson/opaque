"use client";

import { useState, useEffect, useCallback } from "react";

interface WalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    isConnected: false,
    isConnecting: false,
    chainId: null,
  });

  const checkConnection = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) return;

    try {
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });
      const chainId = await window.ethereum.request({ method: "eth_chainId" });

      if (accounts.length > 0) {
        setState({
          address: accounts[0],
          isConnected: true,
          isConnecting: false,
          chainId: parseInt(chainId, 16),
        });
      }
    } catch (error) {
      console.error("Failed to check connection:", error);
    }
  }, []);

  useEffect(() => {
    checkConnection();

    if (window.ethereum) {
      window.ethereum.on?.("accountsChanged", (accounts: string[]) => {
        if (accounts.length > 0) {
          setState((prev) => ({
            ...prev,
            address: accounts[0],
            isConnected: true,
          }));
        } else {
          setState({
            address: null,
            isConnected: false,
            isConnecting: false,
            chainId: null,
          });
        }
      });

      window.ethereum.on?.("chainChanged", (chainId: string) => {
        setState((prev) => ({ ...prev, chainId: parseInt(chainId, 16) }));
      });
    }
  }, [checkConnection]);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask Flask");
      return;
    }

    setState((prev) => ({ ...prev, isConnecting: true }));

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const chainId = await window.ethereum.request({ method: "eth_chainId" });

      setState({
        address: accounts[0],
        isConnected: true,
        isConnecting: false,
        chainId: parseInt(chainId, 16),
      });
    } catch (error) {
      console.error("Failed to connect:", error);
      setState((prev) => ({ ...prev, isConnecting: false }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({
      address: null,
      isConnected: false,
      isConnecting: false,
      chainId: null,
    });
  }, []);

  const switchToMantleSepolia = useCallback(async () => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x138b" }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x138b",
              chainName: "Mantle Sepolia",
              rpcUrls: ["https://rpc.sepolia.mantle.xyz"],
              nativeCurrency: { name: "MNT", symbol: "MNT", decimals: 18 },
              blockExplorerUrls: ["https://sepolia.mantlescan.xyz"],
            },
          ],
        });
      }
    }
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    switchToSepolia: switchToMantleSepolia,
    isWrongNetwork: state.chainId !== null && state.chainId !== 5003,
  };
}
