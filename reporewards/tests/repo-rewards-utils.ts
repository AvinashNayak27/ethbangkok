import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  ProofVerificationFailed,
  RepositoryRegistered
} from "../generated/RepoRewards/RepoRewards"

export function createProofVerificationFailedEvent(
  repoUrl: string,
  sender: Address
): ProofVerificationFailed {
  let proofVerificationFailedEvent = changetype<ProofVerificationFailed>(
    newMockEvent()
  )

  proofVerificationFailedEvent.parameters = new Array()

  proofVerificationFailedEvent.parameters.push(
    new ethereum.EventParam("repoUrl", ethereum.Value.fromString(repoUrl))
  )
  proofVerificationFailedEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )

  return proofVerificationFailedEvent
}

export function createRepositoryRegisteredEvent(
  repoUrl: string,
  fundPoolAddress: Address,
  totalPullRequests: BigInt
): RepositoryRegistered {
  let repositoryRegisteredEvent = changetype<RepositoryRegistered>(
    newMockEvent()
  )

  repositoryRegisteredEvent.parameters = new Array()

  repositoryRegisteredEvent.parameters.push(
    new ethereum.EventParam("repoUrl", ethereum.Value.fromString(repoUrl))
  )
  repositoryRegisteredEvent.parameters.push(
    new ethereum.EventParam(
      "fundPoolAddress",
      ethereum.Value.fromAddress(fundPoolAddress)
    )
  )
  repositoryRegisteredEvent.parameters.push(
    new ethereum.EventParam(
      "totalPullRequests",
      ethereum.Value.fromUnsignedBigInt(totalPullRequests)
    )
  )

  return repositoryRegisteredEvent
}
