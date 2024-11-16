// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ISPHook} from "@ethsign/sign-protocol-evm/src/interfaces/ISPHook.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";

// Interfaces for ISP and ERC721
interface ISPInterface {
    enum DataLocation {
        ONCHAIN,
        ARWEAVE,
        IPFS,
        CUSTOM
    }

    struct Attestation {
        uint64 schemaId;
        uint64 linkedAttestationId;
        uint64 attestTimestamp;
        uint64 revokeTimestamp;
        address attester;
        uint64 validUntil;
        DataLocation dataLocation;
        bool revoked;
        bytes[] recipients;
        bytes data;
    }

    function getAttestation(uint64 attestationId)
        external
        view
        returns (Attestation memory);
}

interface IL2RepoRewardsRegistrar {
    function register(string memory label, address owner) external;

    function available(uint256 tokenId) external view returns (bool);
}

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

// The Reporewards Onboarding contract implementing ISPHook
contract ReporewardsOnboard is ISPHook {
    event AttestationReceived(
        address indexed attester,
        uint64 schemaId,
        uint64 attestationId,
        bytes extraData
    );
    event RevocationReceived(
        address indexed attester,
        uint64 schemaId,
        uint64 attestationId,
        bytes extraData
    );

    // Contract addresses
    address public ispContractAddress =
        0x4e4af2a21ebf62850fD99Eb6253E1eFBb56098cD;
    address public reclaimAddress = 0xF90085f5Fd1a3bEb8678623409b3811eCeC5f6A5;
    address public onboardingNFTAddress =
        0x492b3ab6Fa060F6E3218dbaCF6878eFD46a3F5b5;
    address public l2RepoRewardsRegistrarAddress =
        0x89e16ef4e3caF63d44928F8D79b6760f505Ecea7;

    mapping(uint256 => bool) private usedTimestamps;

    // Function to handle attestation reception
    function didReceiveAttestation(
        address attester,
        uint64 schemaId,
        uint64 attestationId,
        bytes calldata extraData
    ) external payable {
        bytes memory attestationData = fetchAttestationData(attestationId);
        Proof memory proof = decodeToReclaimProof(attestationData);

        // Verify the proof
        try IReclaimVerifier(reclaimAddress).verifyProof(proof) {
            uint256 timestamp = proof.signedClaim.claim.timestampS;
            require(
                !usedTimestamps[timestamp],
                "This proof has already been used"
            );

            usedTimestamps[timestamp] = true;

            // Extract contributions
            uint256 TotalCommitContributions = parseStringToInt(
                getTotalCommitContributions(proof.claimInfo.context)
            );
            require(
                TotalCommitContributions > 10,
                "TotalCommitContributions must be greater than 10"
            );
            string memory label = string(
                abi.encodePacked(
                    getUserLogin(proof.claimInfo.context),
                    ".reporewards.eth"
                )
            );

            bytes32 labelhash = keccak256(abi.encodePacked(label));
            uint256 tokenId = uint256(labelhash);

            // Check if the tokenId is available
            bool isAvailable = IL2RepoRewardsRegistrar(
                l2RepoRewardsRegistrarAddress
            ).available(tokenId);

            if (isAvailable) {
                IL2RepoRewardsRegistrar(l2RepoRewardsRegistrarAddress).register(
                    label,
                    attester
                );
            } else {
                revert("Name already taken");
            }

            emit AttestationReceived(
                attester,
                schemaId,
                attestationId,
                abi.encodePacked(extraData, TotalCommitContributions)
            );
        } catch {
            revert("Invalid proof");
        }
    }

    function didReceiveAttestation(
        address attester,
        uint64 schemaId,
        uint64 attestationId,
        IERC20, // resolverFeeERC20Token
        uint256, // resolverFeeERC20Amount
        bytes calldata extraData
    ) external {
        emit AttestationReceived(attester, schemaId, attestationId, extraData);
    }

    function didReceiveRevocation(
        address attester,
        uint64 schemaId,
        uint64 attestationId,
        bytes calldata extraData
    ) external payable {
        emit RevocationReceived(attester, schemaId, attestationId, extraData);
    }

    function didReceiveRevocation(
        address attester,
        uint64 schemaId,
        uint64 attestationId,
        IERC20, // resolverFeeERC20Token
        uint256, // resolverFeeERC20Amount
        bytes calldata extraData
    ) external {
        emit RevocationReceived(attester, schemaId, attestationId, extraData);
    }

    function uintToStr(uint256 _i) public pure returns (string memory) {
        // Handle 0 case
        if (_i == 0) {
            return "0";
        }

        uint256 temp = _i;
        uint256 digits;

        // Count number of digits in the number
        while (temp != 0) {
            digits++;
            temp /= 10;
        }

        bytes memory result = new bytes(digits);
        uint256 index = digits - 1;

        // Convert the number to bytes (string format)
        while (_i != 0) {
            result[index] = bytes1(uint8(48 + (_i % 10))); // ASCII value of '0' is 48
            _i /= 10;
            index--;
        }

        return string(result);
    }

    // Fetch attestation data from ISP contract
    function fetchAttestationData(uint64 attestationId)
        public
        view
        returns (bytes memory)
    {
        ISPInterface ispContract = ISPInterface(ispContractAddress);
        ISPInterface.Attestation memory attestation = ispContract
            .getAttestation(attestationId);
        return attestation.data;
    }

    // Decode data into a Reclaim Proof
    function decodeToReclaimProof(bytes memory encodedData)
        public
        pure
        returns (Proof memory proof)
    {
        (
            string memory provider,
            string memory parameters,
            string memory context,
            bytes32 identifier,
            address owner,
            uint256 timestampS,
            uint256 epoch,
            bytes[] memory signatures
        ) = abi.decode(
                encodedData,
                (
                    string,
                    string,
                    string,
                    bytes32,
                    address,
                    uint256,
                    uint256,
                    bytes[]
                )
            );

        proof.claimInfo = ClaimInfo(provider, parameters, context);
        proof.signedClaim = SignedClaim(
            Claim(identifier, owner, uint32(timestampS), uint32(epoch)),
            signatures
        );
    }

    // Extract a  field from the context message

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

    // Parse a string into an integer
    function parseStringToInt(string memory str)
        internal
        pure
        returns (uint256)
    {
        bytes memory strBytes = bytes(str);
        uint256 number = 0;
        bool parsing = false;

        for (uint256 i = 0; i < strBytes.length; i++) {
            bytes1 b = strBytes[i];
            if (b >= "0" && b <= "9") {
                parsing = true;
                number = number * 10 + (uint8(b) - 48);
            } else if (parsing) {
                break;
            }
        }
        return number;
    }

    function getTotalCommitContributions(string memory _data)
        public
        pure
        returns (string memory)
    {
        return extractFieldFromContext(_data, '"totalCommitContributions":"');
    }

    function getUserLogin(string memory _data)
        public
        pure
        returns (string memory)
    {
        return extractFieldFromContext(_data, '"login":"');
    }

    receive() external payable {}
}
