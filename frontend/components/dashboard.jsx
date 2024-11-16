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
import { ArrowUpRight, Copy } from "lucide-react";
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
import { useSmartWallets } from "@privy-io/react-auth/smart-wallets";
import { baseSepolia } from "viem/chains";
import { parseEther } from "viem";
import { encodeFunctionData } from "viem";
import { parseUnits } from "viem";

export function ResponsiveDashboard() {
  const { user, ready } = usePrivy();
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [embeddedWallet, setEmbeddedWallet] = useState(null);

  const [githubAccessToken, setGithubAccessToken] = useState(null);
  const { ready: walletsReady, wallets } = useWallets();
  const { logout } = useLogout();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { client } = useSmartWallets();

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
      const smartWallet = user?.linkedAccounts?.find(
        (account) => account.type === "smart_wallet"
      );
      console.log("smartWallet", smartWallet);
      if (smartWallet) {
        setEmbeddedWallet(smartWallet);
      }
    }
  }, [walletsReady, wallets]);

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

  const sendTransaction = async () => {
    const txHash = await client.sendTransaction({
      account: client.account,
      calls: [
        {
          to: "0x70F19D04b867431A316D070fa58a22dF02a89c86",
          data: encodeFunctionData({
            abi: MINT_ABI,
            functionName: "mint",
            args: ["#345123", "345123", client.account.address],
          }),
          value: parseEther("0.001"),
          preVerificationGas: 1000000n,
        },
      ],
    });

    console.log("txHash", txHash);
  };

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
              <CardDescription>Your current reward balance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">1,234.56 USDC</div>
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
          <Button onClick={sendTransaction}>Send Transaction</Button>
          <Card>
            <CardHeader>
              <CardTitle>Contribution Stats</CardTitle>
              <CardDescription>Your impact on the project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Merged PRs</span>
                  <span className="text-sm font-medium">24/50</span>
                </div>
                <Progress value={48} />
              </div>
              <div className="flex items-center justify-between">
                <span>Total Contributions</span>
                <span className="font-medium">127</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Ranking</span>
                <span className="font-medium">#3 of 156</span>
              </div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Recent Rewards</CardTitle>
            <CardDescription>Your latest earned rewards</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <div className="font-medium">Merged PR #{i}</div>
                    <div className="text-sm text-gray-500">2 days ago</div>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium mr-2">+25.00 USDC</span>
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                  </div>
                </div>
              ))}
            </div>
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
    </div>
  );
}
