import {
  ProofVerificationFailed as ProofVerificationFailedEvent,
  RepositoryRegistered as RepositoryRegisteredEvent
} from "../generated/RepoRewards/RepoRewards"
import {
  ProofVerificationFailed,
  RepositoryRegistered
} from "../generated/schema"

export function handleProofVerificationFailed(
  event: ProofVerificationFailedEvent
): void {
  let entity = new ProofVerificationFailed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.repoUrl = event.params.repoUrl
  entity.sender = event.params.sender

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRepositoryRegistered(
  event: RepositoryRegisteredEvent
): void {
  let entity = new RepositoryRegistered(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.repoUrl = event.params.repoUrl
  entity.fundPoolAddress = event.params.fundPoolAddress
  entity.totalPullRequests = event.params.totalPullRequests

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
