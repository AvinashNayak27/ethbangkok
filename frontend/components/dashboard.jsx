"'use client'";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowUpRight, Copy, Home, PlusSquare, Compass } from "lucide-react";
import {
  usePrivy,
  useWallets,
  getEmbeddedConnectedWallet,
  useLogout,
} from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { baseSepolia } from "viem/chains";
import { parseEther } from "viem";
import { encodeFunctionData } from "viem";
import { useFundWallet } from "@privy-io/react-auth";
import { useSetActiveWallet } from "@privy-io/wagmi";
import { useAccount, useBalance } from "wagmi";
import { SignProtocolClient, SpMode, EvmChains } from "@ethsign/sp-sdk";
import { createWalletClient, custom } from "viem";
import { isAddress } from "viem";

export function ResponsiveDashboard() {
  const { user, ready } = usePrivy();
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [embeddedWallet, setEmbeddedWallet] = useState(null);
  const { fundWallet } = useFundWallet();
  const { setActiveWallet } = useSetActiveWallet();

  const account = useAccount();

  const [githubAccessToken, setGithubAccessToken] = useState(null);
  const { ready: walletsReady, wallets } = useWallets();
  const { logout } = useLogout();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const balance = useBalance({
    address: embeddedWallet?.address,
    chainId: baseSepolia.id,
  });

  const [userEvents, setUserEvents] = useState([]);

  useEffect(() => {
    if (!user && ready) {
      router.push("/");
    }
  }, [user, ready]);

  useEffect(() => {
    const accessToken = localStorage.getItem("github_access_token");
    if (accessToken) {
      setGithubAccessToken(accessToken);
    }
  }, []);

  const fetchUserData = async (accessToken) => {
    const response = await fetch(`https://api.github.com/user`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await response.json();
    setUserData(data);
  };

  useEffect(() => {
    if (githubAccessToken) {
      fetchUserData(githubAccessToken);
    }
  }, [githubAccessToken]);

  useEffect(() => {
    if (walletsReady && wallets.length > 0) {
      console.log("walletsReady", walletsReady);
      console.log("wallets", wallets);
      const embeddedWallet = getEmbeddedConnectedWallet(wallets);
      if (embeddedWallet) {
        (async () => {
          await setActiveWallet(embeddedWallet);
          setEmbeddedWallet(embeddedWallet);
        })();
      }
    }
  }, [walletsReady, wallets]);

  useEffect(() => {
    const fetchUserEvents = async () => {
      if (userData?.login && githubAccessToken) {
        try {
          const response = await fetch(
            `https://api.github.com/users/${userData.login}/events`,
            {
              headers: { Authorization: `Bearer ${githubAccessToken}` },
            }
          );
          const events = await response.json();
          setUserEvents(events);
        } catch (error) {
          console.error("Error fetching user events:", error);
        }
      }
    };

    fetchUserEvents();
  }, [userData?.login, githubAccessToken]);

  const MINT_ABI = [
    {
      inputs: [
        {
          internalType: "string",
          name: "color",
          type: "string",
        },
        {
          internalType: "string",
          name: "name",
          type: "string",
        },
        {
          internalType: "address",
          name: "recipient",
          type: "address",
        },
      ],
      name: "mint",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
  ];

  const copyToClipboard = async () => {
    if (embeddedWallet?.address) {
      try {
        await navigator.clipboard.writeText(embeddedWallet.address);
        alert("Wallet address copied to clipboard!");
      } catch (err) {
        alert("Failed to copy wallet address");
      }
    }
  };

  const attestation = async () => {
    // send a request to the backend to generate a proof
    const response = await fetch("http://localhost:3001/generate-proof", {
      method: "POST",
      headers: { Authorization: `Bearer ${githubAccessToken}` },
    });
    const res = await response.json();
    const proof = res.proofData;

    const data = {
      provider: proof.claimInfo.provider,
      context: proof.claimInfo.context,
      parameters: proof.claimInfo.parameters,
      epoch: proof.signedClaim.claim.epoch,
      identifier: proof.signedClaim.claim.identifier,
      owner: proof.signedClaim.claim.owner,
      timestampS: proof.signedClaim.claim.timestampS,
      signatures: proof.signedClaim.signatures,
    };
    try {
      const provider = await embeddedWallet.getEthereumProvider();
      const walletClient = createWalletClient({
        chain: baseSepolia,
        transport: custom(provider),
      });
      const client = new SignProtocolClient(SpMode.OnChain, {
        chain: EvmChains.baseSepolia,
        walletClient: walletClient,
      });

      const createAttestationRes = await client.createAttestation({
        schemaId: "0x4d5",
        indexingValue: "123",
        data: data,
      });
      console.log("createAttestationRes", createAttestationRes);
    } catch (error) {
      console.error("Failed to create attestation:", error);
      if (error.message?.includes("name already taken")) {
        alert("This name has already been taken. Please try a different one.");
      } else {
        alert("Failed to create attestation. Please try again.");
      }
    }
  };

  async function getAttestations(schemaId, attestatorAddress) {
    const apiUrl = "https://testnet-scan.sign.global/api/scan/attestations";
    console.log("attestatorAddress", attestatorAddress);
    
    // Add early return if attestatorAddress is not provided
    if (!attestatorAddress) {
      console.log("No attestator address provided");
      return [];
    }

    const params = new URLSearchParams({
      schemaId: schemaId
    });

    try {
      const response = await fetch(`${apiUrl}?${params.toString()}`, {
        method: "GET",
      });

      const data = await response.json();
      
      // Check if data has the expected structure
      if (data?.success && data?.data?.rows) {
        const filteredData = data.data.rows.filter(
          (attestation) =>
            attestation.attester.toLowerCase() === attestatorAddress.toLowerCase()
        );
        console.log("filteredData", filteredData);
        return filteredData;
      } else {
        console.error("Unexpected data structure:", data);
        return [];
      }
    } catch (error) {
      console.error("Fetch error:", error);
      return [];
    }
  }

  const [userAttestations, setUserAttestations] = useState([]);

  useEffect(() => {
    getAttestations("onchain_evm_84532_0x4d5", embeddedWallet?.address).then(
      (res) => {
        setUserAttestations(res);
        console.log(res);
      }
    );
  }, [embeddedWallet?.address]);

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center justify-between w-full">
            <div>
              <h1 className="text-2xl font-bold">
                Welcome, {userData?.name || userData?.login || "GitHub User"}
              </h1>
            </div>
            <Avatar
              className="h-12 w-12 cursor-pointer"
              onClick={() => setIsDialogOpen(true)}
            >
              <AvatarImage src={userData?.avatar_url} alt="User avatar" />
              <AvatarFallback>
                {userData?.login?.slice(0, 2).toUpperCase() || "GH"}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>
        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Wallet Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">
                  {(Number(balance.data?.value) / 1e18).toFixed(2)} ETH
                </div>
                <Button
                  onClick={async () => {
                    if (embeddedWallet?.address) {
                      await fundWallet(embeddedWallet.address, {
                        chain: baseSepolia,
                      });
                    }
                  }}
                >
                  Fund Wallet
                </Button>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                <span>Wallet Address</span>
                <div className="flex items-center">
                  <span className="mr-2 hidden sm:inline">
                    {embeddedWallet?.address}
                  </span>
                  <span className="mr-2 sm:hidden">
                    {embeddedWallet?.address?.slice(0, 6)}...
                    {embeddedWallet?.address?.slice(-4)}
                  </span>
                  <button
                    aria-label="Copy wallet address"
                    onClick={copyToClipboard}
                  >
                    <Copy className="h-4 w-4 cursor-pointer" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
            <CardHeader>
              <CardTitle>RepoRewards Domain</CardTitle>
              <CardDescription className="text-white/80">
                {userAttestations.length > 0 
                  ? "You've already claimed your domain!"
                  : "Claim your free .reporewards domain"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userAttestations.length === 0 && (
                <Button 
                  onClick={attestation}
                  className="bg-white text-blue-500 hover:bg-white/90"
                >
                  Claim Now
                </Button>
              )}
              {userAttestations.length > 0 && (
                <a 
                  href="https://testnets.opensea.io/assets/base-sepolia/0x93c2de912407b45fc4aaccc56441ada2285eae43/70530683069318769325168725317720980562803267818375902233408550955775387214093"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    className="bg-white text-blue-500 hover:bg-white/90"
                  >
                    View on OpenSea
                  </Button>
                </a>
              )}
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest GitHub events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {userEvents.slice(0, 5).map((event, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {event.type.replace("Event", "")}
                  </span>
                  <span className="text-xs text-gray-500">
                    {event.repo.name}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(event.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="sr-only">User Profile</DialogTitle>
          <div className="flex flex-col items-center space-y-4 py-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={userData?.avatar_url} alt="User avatar" />
              <AvatarFallback>
                {userData?.login?.slice(0, 2).toUpperCase() || "GH"}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-lg font-semibold">
              {userData?.name || userData?.login || "GitHub User"}
            </h2>
            <Button variant="destructive" onClick={logout} className="w-full">
              Logout
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add the mobile-optimized footer navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 sm:hidden">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-around py-3">
            <button
              onClick={() => router.push("/dashboard")}
              className={`flex flex-col items-center space-y-1 ${
                router.pathname === "/dashboard"
                  ? "text-blue-600"
                  : "text-gray-600 hover:text-blue-600"
              }`}
            >
              <Home className="h-5 w-5" />
              <span className="text-xs">Dashboard</span>
            </button>
            <button
              onClick={() => router.push("/create")}
              className={`flex flex-col items-center space-y-1 ${
                router.pathname === "/create"
                  ? "text-blue-600"
                  : "text-gray-600 hover:text-blue-600"
              }`}
            >
              <PlusSquare className="h-5 w-5" />
              <span className="text-xs">Create</span>
            </button>
            <button
              onClick={() => router.push("/explore")}
              className={`flex flex-col items-center space-y-1 ${
                router.pathname === "/explore"
                  ? "text-blue-600"
                  : "text-gray-600 hover:text-blue-600"
              }`}
            >
              <Compass className="h-5 w-5" />
              <span className="text-xs">Explore</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
