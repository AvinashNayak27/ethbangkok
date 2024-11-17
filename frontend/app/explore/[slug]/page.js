"use client";
import { useAccount, useReadContract } from "wagmi";
import { use } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Home, Compass, PlusSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePrivy, useLogout } from "@privy-io/react-auth";
import { useState, useEffect } from "react";
import { parseEther } from "viem";
import { useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { useWriteContract } from "wagmi";


export default function Page({ params }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();
  const { user, ready } = usePrivy();
  const [userData, setUserData] = useState(null);
  const [githubAccessToken, setGithubAccessToken] = useState(null);
  const [fundAmount, setFundAmount] = useState("0.01");
  const { data: updateFunds, writeContractAsync, error: updateFundsError } = useWriteContract();

  const {
    data: hash,
    error,
    isPending,
    sendTransactionAsync,
  } = useSendTransaction();

  const { logout } = useLogout();
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

  const unwrappedParams = use(params);
  const poolAddress = unwrappedParams.slug;

  const fundpoolabi = [
    {
      inputs: [
        {
          components: [
            {
              components: [
                {
                  internalType: "string",
                  name: "provider",
                  type: "string",
                },
                {
                  internalType: "string",
                  name: "parameters",
                  type: "string",
                },
                {
                  internalType: "string",
                  name: "context",
                  type: "string",
                },
              ],
              internalType: "struct ClaimInfo",
              name: "claimInfo",
              type: "tuple",
            },
            {
              components: [
                {
                  components: [
                    {
                      internalType: "bytes32",
                      name: "identifier",
                      type: "bytes32",
                    },
                    {
                      internalType: "address",
                      name: "owner",
                      type: "address",
                    },
                    {
                      internalType: "uint32",
                      name: "timestampS",
                      type: "uint32",
                    },
                    {
                      internalType: "uint32",
                      name: "epoch",
                      type: "uint32",
                    },
                  ],
                  internalType: "struct Claim",
                  name: "claim",
                  type: "tuple",
                },
                {
                  internalType: "bytes[]",
                  name: "signatures",
                  type: "bytes[]",
                },
              ],
              internalType: "struct SignedClaim",
              name: "signedClaim",
              type: "tuple",
            },
          ],
          internalType: "struct Proof",
          name: "proof",
          type: "tuple",
        },
      ],
      name: "claim",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "string",
          name: "_repoUrl",
          type: "string",
        },
        {
          internalType: "uint256",
          name: "_totalPullRequests",
          type: "uint256",
        },
        {
          internalType: "address",
          name: "_reclaimAddress",
          type: "address",
        },
      ],
      stateMutability: "nonpayable",
      type: "constructor",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "string",
          name: "username",
          type: "string",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "amount",
          type: "uint256",
        },
      ],
      name: "FundsClaimed",
      type: "event",
    },
    {
      stateMutability: "payable",
      type: "receive",
    },
    {
      inputs: [
        {
          internalType: "string",
          name: "_data",
          type: "string",
        },
        {
          internalType: "string",
          name: "target",
          type: "string",
        },
      ],
      name: "extractFieldFromContext",
      outputs: [
        {
          internalType: "string",
          name: "",
          type: "string",
        },
      ],
      stateMutability: "pure",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "string",
          name: "_data",
          type: "string",
        },
      ],
      name: "getMergedPrsCount",
      outputs: [
        {
          internalType: "string",
          name: "",
          type: "string",
        },
      ],
      stateMutability: "pure",
      type: "function",
    },
    {
      inputs: [],
      name: "reclaimAddress",
      outputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "repoUrl",
      outputs: [
        {
          internalType: "string",
          name: "",
          type: "string",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "totalFunds",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "totalPullRequests",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
  ];

  const { data: repoUrl } = useReadContract({
    abi: fundpoolabi,
    address: poolAddress,
    functionName: "repoUrl",
  });

  const { data: totalPullRequests } = useReadContract({
    abi: fundpoolabi,
    address: poolAddress,
    functionName: "totalPullRequests",
  });

  const { data: totalFunds } = useReadContract({
    abi: fundpoolabi,
    address: poolAddress,
    functionName: "totalFunds",
  });

  const claimShare = async () => {
    const response = await fetch(
      "http://localhost:3001/generate-proof-for-claim",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${githubAccessToken}` },
        body: JSON.stringify({
          owner: repoUrl.split("/").slice(-2)[0],
          repo: repoUrl.split("/").slice(-2)[1],
          username: userData.login,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();
    const proof = data.proofData;

    const userMergedPRs = JSON.parse(proof.claimInfo.context)
      .extractedParameters.total_count;

    const userShare =
      totalPullRequests && userMergedPRs
        ? (BigInt(userMergedPRs * userMergedPRs) * BigInt(1e18)) /
          (BigInt(totalPullRequests) * BigInt(totalPullRequests))
        : BigInt(0);

    console.log("userShare", userShare);

    const amountToClaim = userShare * totalFunds;

    console.log("amountToClaim", amountToClaim);

    await writeContractAsync({
      address: poolAddress,
      abi: [
        {
          inputs: [
            {
              components: [
                {
                  components: [
                    {
                      internalType: "string",
                      name: "provider",
                      type: "string",
                    },
                    {
                      internalType: "string",
                      name: "parameters",
                      type: "string",
                    },
                    {
                      internalType: "string",
                      name: "context",
                      type: "string",
                    },
                  ],
                  internalType: "struct ClaimInfo",
                  name: "claimInfo",
                  type: "tuple",
                },
                {
                  components: [
                    {
                      components: [
                        {
                          internalType: "bytes32",
                          name: "identifier",
                          type: "bytes32",
                        },
                        {
                          internalType: "address",
                          name: "owner",
                          type: "address",
                        },
                        {
                          internalType: "uint32",
                          name: "timestampS",
                          type: "uint32",
                        },
                        {
                          internalType: "uint32",
                          name: "epoch",
                          type: "uint32",
                        },
                      ],
                      internalType: "struct Claim",
                      name: "claim",
                      type: "tuple",
                    },
                    {
                      internalType: "bytes[]",
                      name: "signatures",
                      type: "bytes[]",
                    },
                  ],
                  internalType: "struct SignedClaim",
                  name: "signedClaim",
                  type: "tuple",
                },
              ],
              internalType: "struct Proof",
              name: "proof",
              type: "tuple",
            },
          ],
          name: "claim",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "string",
              name: "_repoUrl",
              type: "string",
            },
            {
              internalType: "uint256",
              name: "_totalPullRequests",
              type: "uint256",
            },
            {
              internalType: "address",
              name: "_reclaimAddress",
              type: "address",
            },
          ],
          stateMutability: "nonpayable",
          type: "constructor",
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: false,
              internalType: "string",
              name: "username",
              type: "string",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "amount",
              type: "uint256",
            },
          ],
          name: "FundsClaimed",
          type: "event",
        },
        {
          stateMutability: "payable",
          type: "receive",
        },
        {
          inputs: [
            {
              internalType: "string",
              name: "_data",
              type: "string",
            },
            {
              internalType: "string",
              name: "target",
              type: "string",
            },
          ],
          name: "extractFieldFromContext",
          outputs: [
            {
              internalType: "string",
              name: "",
              type: "string",
            },
          ],
          stateMutability: "pure",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "string",
              name: "_data",
              type: "string",
            },
          ],
          name: "getMergedPrsCount",
          outputs: [
            {
              internalType: "string",
              name: "",
              type: "string",
            },
          ],
          stateMutability: "pure",
          type: "function",
        },
        {
          inputs: [],
          name: "reclaimAddress",
          outputs: [
            {
              internalType: "address",
              name: "",
              type: "address",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "repoUrl",
          outputs: [
            {
              internalType: "string",
              name: "",
              type: "string",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "totalFunds",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "totalPullRequests",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
      ],
      functionName: "claim",
      args: [proof],
    });

    alert("Claim successful");
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

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Repository Details</h2>
          <div className="space-y-4">
            <div>
              <p className="text-gray-600">Repository</p>
              <p className="font-medium">
                {repoUrl
                  ? repoUrl.split("/").slice(-2).join("/")
                  : "Loading..."}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Total Merged PRs</p>
                <p className="font-medium">
                  {totalPullRequests?.toString() || "Loading..."}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Total Funds Available</p>
                <p className="font-medium">
                  {totalFunds !== undefined
                    ? `${(Number(totalFunds) / 1e18).toFixed(2)} ETH`
                    : "Loading..."}
                </p>
              </div>
            </div>

            <Button className="w-full mt-4" onClick={claimShare}>
              Claim Share
            </Button>

            <div className="mt-6 pt-6 border-t">
              <h3 className="text-lg font-semibold mb-2">Fund Pool</h3>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  className="flex-1 p-2 border rounded-md text-sm"
                  placeholder="Amount in ETH"
                />
                <Button
                  onClick={async () => {
                    await sendTransactionAsync({
                      to: poolAddress,
                      value: parseEther(fundAmount),
                    });
                    console.log("Transaction sent:", hash);
                    alert("Funding successful");
                  }}
                >
                  Fund
                </Button>
              </div>
            </div>
          </div>
        </div>
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
