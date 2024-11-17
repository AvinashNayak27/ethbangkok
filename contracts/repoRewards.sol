// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

// Structs for claim and proof information
struct ClaimInfo {
    string provider;
    string parameters;
    string context;
}

struct Claim {
    bytes32 identifier;
    address owner;
    uint32 timestampS;
    uint32 epoch;
}

struct SignedClaim {
    Claim claim;
    bytes[] signatures;
}

struct Proof {
    ClaimInfo claimInfo;
    SignedClaim signedClaim;
}

// Interface for ReclaimVerifier
interface IReclaimVerifier {
    function verifyProof(Proof memory proof) external view;
}

// Contract to manage funds for each repository
contract FundPool {
    string public repoUrl;
    uint256 public totalFunds;
    uint256 public totalPullRequests;
    address public immutable reclaimAddress;

    // Event to log claims
    event FundsClaimed(string username, uint256 amount);

    constructor(string memory _repoUrl, uint256 _totalPullRequests, address _reclaimAddress) {
        repoUrl = _repoUrl;
        totalPullRequests = _totalPullRequests;
        reclaimAddress = _reclaimAddress;
    }

    // Function to receive funds
    receive() external payable {
        totalFunds += msg.value;
    }

    // Function to claim funds based on user's share of merged PRs
    function claim(Proof memory proof) external {
        // Verify the proof first
        try IReclaimVerifier(reclaimAddress).verifyProof(proof) {
            string memory context = proof.claimInfo.context;
            string memory username = extractFieldFromContext(context, '"login":"');
            uint256 userMergedPrs = parseUint(getMergedPrsCount(context));

            require(userMergedPrs > 0, "User has no merged PRs");

            // Quadratic distribution (userMergedPrs^2 / totalPullRequests^2)
            uint256 userShare = ((userMergedPrs * userMergedPrs) * 1e18) /
                (totalPullRequests * totalPullRequests);
            uint256 claimAmount = (userShare * totalFunds) / 1e18;

            require(claimAmount > 0, "Insufficient funds to claim");

            totalFunds -= claimAmount;
            payable(msg.sender).transfer(claimAmount);

            // Emit event with the username and amount claimed
            emit FundsClaimed(username, claimAmount);
        } catch {
            revert("Proof verification failed");
        }
    }

    function extractFieldFromContext(string memory _data, string memory target)
        public
        pure
        returns (string memory)
    {
        bytes memory dataBytes = bytes(_data);
        bytes memory targetBytes = bytes(target);

        require(
            dataBytes.length >= targetBytes.length,
            "target is longer than data"
        );

        uint256 start = 0;
        bool foundStart = false;

        for (uint256 i = 0; i <= dataBytes.length - targetBytes.length; i++) {
            bool isMatch = true;
            for (uint256 j = 0; j < targetBytes.length && isMatch; j++) {
                if (dataBytes[i + j] != targetBytes[j]) {
                    isMatch = false;
                }
            }
            if (isMatch) {
                start = i + targetBytes.length;
                foundStart = true;
                break;
            }
        }

        if (!foundStart) {
            return "";
        }

        uint256 end = start;
        while (
            end < dataBytes.length &&
            !(dataBytes[end] == '"' && (end == 0 || dataBytes[end - 1] != "\\"))
        ) {
            end++;
        }

        if (end <= start) {
            return "";
        }

        bytes memory contextMessage = new bytes(end - start);
        for (uint256 i = start; i < end; i++) {
            contextMessage[i - start] = dataBytes[i];
        }
        return string(contextMessage);
    }

    function getMergedPrsCount(string memory _data)
        public
        pure
        returns (string memory)
    {
        return extractFieldFromContext(_data, '"total_count":"');
    }

    function parseUint(string memory _value) internal pure returns (uint256) {
        bytes memory valueBytes = bytes(_value);
        uint256 result = 0;
        for (uint256 i = 0; i < valueBytes.length; i++) {
            require(
                valueBytes[i] >= 0x30 && valueBytes[i] <= 0x39,
                "Invalid character"
            );
            result = result * 10 + (uint256(uint8(valueBytes[i])) - 0x30);
        }
        return result;
    }
}

// Factory contract to create FundPool contracts
contract RepoRewards {
    address public reclaimAddress;
    mapping(string => address) public repoToFundPool; // Maps repo URL to FundPool contract address

    // Events
    event RepositoryRegistered(
        string repoUrl,
        address fundPoolAddress,
        uint256 totalPullRequests
    );
    event ProofVerificationFailed(string repoUrl, address sender);

    // Constructor to set the ReclaimVerifier address
    constructor() {
        reclaimAddress = 0xF90085f5Fd1a3bEb8678623409b3811eCeC5f6A5;
    }

    // Function to register a repository by submitting a proof
    function registerRepository(Proof memory proof) public returns (address) {
        try IReclaimVerifier(reclaimAddress).verifyProof(proof) {
            string memory repoUrl = getRepoUrl(proof.claimInfo.context);
            require(
                repoToFundPool[repoUrl] == address(0),
                "Repository already registered"
            );

            uint256 totalPullRequests = parseUint(
                getMergedPrsCount(proof.claimInfo.context)
            );
            FundPool fundPool = new FundPool(repoUrl, totalPullRequests, reclaimAddress);
            repoToFundPool[repoUrl] = address(fundPool);
            emit RepositoryRegistered(
                repoUrl,
                address(fundPool),
                totalPullRequests
            );

            return address(fundPool);
        } catch {
            revert("Proof verification failed");
        }
    }

    function getRepoUrl(string memory _data)
        public
        pure
        returns (string memory)
    {
        return extractFieldFromContext(_data, '"repository_url":"');
    }

    function getMergedPrsCount(string memory _data)
        public
        pure
        returns (string memory)
    {
        return extractFieldFromContext(_data, '"total_count":"');
    }

    function extractFieldFromContext(string memory _data, string memory target)
        public
        pure
        returns (string memory)
    {
        bytes memory dataBytes = bytes(_data);
        bytes memory targetBytes = bytes(target);

        require(
            dataBytes.length >= targetBytes.length,
            "target is longer than data"
        );

        uint256 start = 0;
        bool foundStart = false;

        for (uint256 i = 0; i <= dataBytes.length - targetBytes.length; i++) {
            bool isMatch = true;
            for (uint256 j = 0; j < targetBytes.length && isMatch; j++) {
                if (dataBytes[i + j] != targetBytes[j]) {
                    isMatch = false;
                }
            }
            if (isMatch) {
                start = i + targetBytes.length;
                foundStart = true;
                break;
            }
        }

        if (!foundStart) {
            return "";
        }

        uint256 end = start;
        while (
            end < dataBytes.length &&
            !(dataBytes[end] == '"' && (end == 0 || dataBytes[end - 1] != "\\"))
        ) {
            end++;
        }

        if (end <= start) {
            return "";
        }

        bytes memory contextMessage = new bytes(end - start);
        for (uint256 i = start; i < end; i++) {
            contextMessage[i - start] = dataBytes[i];
        }
        return string(contextMessage);
    }

    function parseUint(string memory _value) internal pure returns (uint256) {
        bytes memory valueBytes = bytes(_value);
        uint256 result = 0;
        for (uint256 i = 0; i < valueBytes.length; i++) {
            require(
                valueBytes[i] >= 0x30 && valueBytes[i] <= 0x39,
                "Invalid character"
            );
            result = result * 10 + (uint256(uint8(valueBytes[i])) - 0x30);
        }
        return result;
    }
}
