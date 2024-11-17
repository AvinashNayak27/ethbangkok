"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Home, PlusSquare, Compass } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePrivy, useLogout } from "@privy-io/react-auth";

export default function Explore() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();
  const { user, ready } = usePrivy();
  const [userData, setUserData] = useState(null);
  const [githubAccessToken, setGithubAccessToken] = useState(null);
  const [repositories, setRepositories] = useState([]);

  const {logout} = useLogout();
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
    const fetchRepositories = async () => {
      try {
        const response = await fetch('https://api.studio.thegraph.com/query/81414/reporewards/v0.0.1', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `
              {
                repositoryRegistereds {
                  id
                  repoUrl
                  fundPoolAddress
                  totalPullRequests
                }
              }
            `
          }),
        });
        const data = await response.json();
        setRepositories(data.data.repositoryRegistereds);
      } catch (error) {
        console.error('Error fetching repositories:', error);
      }
    };

    fetchRepositories();
  }, []);

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

      <div className="max-w-6xl mx-auto space-y-8 mb-20">
        <h1 className="text-2xl font-bold">Explore</h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {repositories.map((repo) => (
            <div
              key={repo.id}
              onClick={() => router.push(`/explore/${repo.fundPoolAddress}`)}
              className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
            >
              <h3 className="text-lg font-semibold mb-2 truncate">
                {repo.repoUrl.split('/').slice(-2).join('/')}
              </h3>
              <div className="flex items-center text-gray-600">
                <span className="mr-2">Pull Requests:</span>
                <span className="font-medium">{repo.totalPullRequests}</span>
              </div>
              <div className="mt-2 text-sm text-gray-500 truncate">
                Pool: {repo.fundPoolAddress}
              </div>
            </div>
          ))}
        </div>
      </div>

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
