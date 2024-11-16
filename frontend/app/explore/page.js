"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Home, PlusSquare, Compass } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePrivy, useLogout } from "@privy-io/react-auth";
import { useEffect } from "react";

export default function Explore() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();
  const { user, ready } = usePrivy();
  const [userData, setUserData] = useState(null);
  const [githubAccessToken, setGithubAccessToken] = useState(null);

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

      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold">Explore</h1>
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
