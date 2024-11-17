"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Home, PlusSquare, Compass, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePrivy, useLogout } from "@privy-io/react-auth";
import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useWriteContract } from "wagmi";
import { parseEther } from "viem";
import { useAccount } from "wagmi";

export default function Create() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();
  const { user, ready } = usePrivy();
  const [userData, setUserData] = useState(null);
  const [githubAccessToken, setGithubAccessToken] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [mergedPRCount, setMergedPRCount] = useState(0);
  const [repoUrl, setRepoUrl] = useState("");
  const account = useAccount();
  const { data: hash, writeContractAsync ,error} = useWriteContract();

  const { logout } = useLogout();
  useEffect(() => {
    if (!user && ready) {
      router.push("/");
    }
  }, [user, ready]);


  useEffect(() => {
    if (error) {
      alert(error.message);
    }
  }, [error]);

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

  const searchRepositories = async (query) => {
    if (!query || !githubAccessToken) return;
    setIsSearching(true);

    try {
      const response = await fetch(
        `https://api.github.com/search/repositories?q=${query}`,
        {
          headers: { Authorization: `Bearer ${githubAccessToken}` },
        }
      );
      const data = await response.json();
      setSearchResults(data.items || []);
    } catch (error) {
      console.error("Error searching repositories:", error);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchRepositories(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const fetchMergedPRCount = async (repo) => {
    try {
      const response = await fetch(
        `https://api.github.com/search/issues?q=type:pr+repo:${repo.owner.login}/${repo.name}+is:merged`,
        {
          headers: { Authorization: `Bearer ${githubAccessToken}` },
        }
      );
      const data = await response.json();
      setMergedPRCount(data.total_count);
    } catch (error) {
      console.error("Error fetching merged PR count:", error);
    }
  };

  const handleRepoSelect = (repo) => {
    setSelectedRepo(repo);
    fetchMergedPRCount(repo);
    setSearchQuery("");
    setSearchResults([]);
  };

  const parseGitHubUrl = (url) => {
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.hostname !== "github.com") return null;

      const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
      if (pathParts.length >= 2) {
        return {
          owner: pathParts[0],
          repo: pathParts[1],
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const fetchRepositoryByUrl = async (owner, repo) => {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}`,
        {
          headers: { Authorization: `Bearer ${githubAccessToken}` },
        }
      );
      const data = await response.json();
      if (data.id) {
        handleRepoSelect(data);
      }
    } catch (error) {
      console.error("Error fetching repository:", error);
    }
  };

  const handleUrlSubmit = async (e) => {
    e.preventDefault();
    const parsed = parseGitHubUrl(repoUrl);
    if (parsed) {
      await fetchRepositoryByUrl(parsed.owner, parsed.repo);
      setRepoUrl("");
    }
  };

  const registerRepository = async () => {
    const response = await fetch(
      "http://localhost:3001/generate-proof-for-register",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${githubAccessToken}` },
        body: JSON.stringify({
          owner: selectedRepo.owner.login,
          repo: selectedRepo.name,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();
    const proof = data.proofData;
    await writeContractAsync({
      address: "0x9F0Df5d484cf185397fBcCc8A88E72fE2449760e",
      abi: [
        {
          inputs: [],
          stateMutability: "nonpayable",
          type: "constructor",
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: false,
              internalType: "string",
              name: "repoUrl",
              type: "string",
            },
            {
              indexed: false,
              internalType: "address",
              name: "sender",
              type: "address",
            },
          ],
          name: "ProofVerificationFailed",
          type: "event",
        },
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
          name: "registerRepository",
          outputs: [
            {
              internalType: "address",
              name: "",
              type: "address",
            },
          ],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: false,
              internalType: "string",
              name: "repoUrl",
              type: "string",
            },
            {
              indexed: false,
              internalType: "address",
              name: "fundPoolAddress",
              type: "address",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "totalPullRequests",
              type: "uint256",
            },
          ],
          name: "RepositoryRegistered",
          type: "event",
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
          inputs: [
            {
              internalType: "string",
              name: "_data",
              type: "string",
            },
          ],
          name: "getRepoUrl",
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
          inputs: [
            {
              internalType: "string",
              name: "",
              type: "string",
            },
          ],
          name: "repoToFundPool",
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
      ],
      functionName: "registerRepository",
      args: [proof],
    });

    alert("Repository registered successfully");
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
      <div className="max-w-6xl mx-auto space-y-8 mb-20 mt-20">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Register a Repository
          </h2>

          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>

            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto">
                {searchResults.map((repo) => (
                  <div
                    key={repo.id}
                    className="p-3 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleRepoSelect(repo)}
                  >
                    <div className="font-medium">{repo.name}</div>
                    <div className="text-sm text-gray-500">
                      {repo.description}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="relative">
              <div className="flex items-center">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm w-full">
                  <span className="px-2 text-gray-500 bg-white">
                    or import directly from URL
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleUrlSubmit}>
              <Input
                type="text"
                placeholder="Enter repository URL (e.g., https://github.com/owner/repo)"
                className="w-full"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
              />
              <Button type="submit" className="mt-2 w-full" disabled={!repoUrl}>
                Import Repository
              </Button>
            </form>
          </div>

          {selectedRepo && (
            <div className="mt-6 border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={selectedRepo.owner.avatar_url}
                      alt="Owner avatar"
                    />
                    <AvatarFallback>
                      {selectedRepo.owner.login.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">
                      {selectedRepo.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedRepo.owner.login}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-500">
                    ⭐ {selectedRepo.stargazers_count}
                  </div>
                  <div className="text-sm text-gray-500">
                    🔀 {selectedRepo.forks_count}
                  </div>
                  <div className="text-sm text-gray-500">
                    🔄 {mergedPRCount} PRs
                  </div>
                </div>
              </div>
              <p className="text-gray-600 mt-3">{selectedRepo.description}</p>
              <div className="mt-3 text-sm text-gray-500">
                Last updated:{" "}
                {new Date(selectedRepo.updated_at).toLocaleDateString()}
              </div>
              <Button className="w-full mt-4" onClick={registerRepository}>
                Register Repository
              </Button>
            </div>
          )}
        </div>
      </div>

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
