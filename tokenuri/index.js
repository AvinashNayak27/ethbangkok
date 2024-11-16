const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
const port = 3000;

require("dotenv").config();

const { createThirdwebClient, getContract, readContract } = require("thirdweb");
const { defineChain } = require("thirdweb/chains");
const client = createThirdwebClient({
  secretKey: process.env.THIRDWEB_SECRET_KEY,
});

// connect to your contract
const contract = getContract({
  client,
  chain: defineChain(84532),
  address: "0x93c2dE912407b45Fc4aaCcC56441aDa2285EAE43",
});

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/:tokenId", async (req, res) => {
  try {
    const tokenId = BigInt(req.params.tokenId);
    const bytes32 = "0x" + tokenId.toString(16).padStart(64, "0");
    const label = await readContract({
      contract,
      method: "function labelFor(bytes32 labelhash) view returns (string)",
      params: [bytes32],
    });

    // Create SVG with blue background and white text
    const svg = `<svg width="1600" height="900" viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#0066cc"/>
      <text 
        x="50%" 
        y="50%" 
        font-family="Arial, sans-serif" 
        font-size="72" 
        fill="white" 
        text-anchor="middle" 
        dominant-baseline="middle"
      >${label}</text>
    </svg>`;

    // Create token metadata
    const metadata = {
      name: `${label}.reporewards.eth`,
      description: `RepoRewards ENS subdomain for ${label}`,
      image: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
      attributes: [
        {
          trait_type: "reporewardee",
          value: label,
        },
      ],
    };

    res.json(metadata);
  } catch (error) {
    res.status(400).json({
      error: "Invalid token ID format",
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
