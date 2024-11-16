"'use client'"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowUpRight, Copy } from "lucide-react"
import { usePrivy,useWallets ,getEmbeddedConnectedWallet} from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function ResponsiveDashboard() {
  const { user,ready } = usePrivy();
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [embeddedWallet, setEmbeddedWallet] = useState(null);

  const [githubAccessToken, setGithubAccessToken] = useState(null);
  const {ready: walletsReady, wallets} = useWallets();

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
      const embeddedWallet = getEmbeddedConnectedWallet(wallets);
      if (embeddedWallet) {
        setEmbeddedWallet(embeddedWallet);
      }
    }
  }, [walletsReady, wallets]);


  return (
    (<div className="min-h-screen bg-gray-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={userData?.avatar_url} alt="User avatar" />
              <AvatarFallback>{userData?.login?.slice(0, 2).toUpperCase() || 'GH'}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">Welcome, {userData?.name || userData?.login || 'GitHub User'}</h1>
              <p className="text-gray-500">@{userData?.login}</p>
            </div>
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
                  <span className="mr-2 hidden sm:inline">{embeddedWallet?.address}</span>
                  <span className="mr-2 sm:hidden">{embeddedWallet?.address?.slice(0, 6)}...{embeddedWallet?.address?.slice(-4)}</span>
                  <button aria-label="Copy wallet address">
                    <Copy className="h-4 w-4 cursor-pointer" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
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
                  className="flex items-center justify-between py-2 border-b last:border-0">
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
    </div>)
  );
}