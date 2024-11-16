import express from "express";
import { ReclaimClient } from "@reclaimprotocol/zk-fetch";
import { transformForOnchain, verifyProof } from "@reclaimprotocol/js-sdk";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());
const client = new ReclaimClient(
  "0xd041e5B4A5a6f725d3708dB3dD001C35AF946083",
  "0x39247f8815c85e4f89f4fa8b30a826c6a5a01eb010d8a55176bea418f08a1a7f"
);

const responseMatches = [
  {
    type: "regex",
    value:
      '{"data":{"viewer":{"login":"(?<login>[^"]+)","contributionsCollection":{"totalCommitContributions":(?<totalCommitContributions>\\d+)}}}}',
  },
];

app.post("/generate-proof", async (req, res) => {
  try {
    const githubToken = req.headers.authorization;
    console.log(githubToken);
    if (!githubToken) {
      return res.status(401).json({ error: "GitHub token is required" });
    }

    const url = "https://api.github.com/graphql";
    const query = `
          query {
            viewer {
              login
              contributionsCollection {
                totalCommitContributions
              }
            }
          }
        `;

    const publicOptions = {
      method: "POST",
      headers: {
        accept: "application/vnd.github.v3+json",
        "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
      },
      body: JSON.stringify({ query }),
    };

    const privateOptions = {
      headers: {
        authorization: githubToken,
      },
      responseMatches: responseMatches,
    };

    const proof = await client.zkFetch(url, publicOptions, privateOptions);
    const isVerified = await verifyProof(proof);
    const proofData = await transformForOnchain(proof);

    res.json({
      isVerified,
      proofData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
