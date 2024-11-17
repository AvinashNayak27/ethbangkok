import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, BigInt } from "@graphprotocol/graph-ts"
import { ProofVerificationFailed } from "../generated/schema"
import { ProofVerificationFailed as ProofVerificationFailedEvent } from "../generated/RepoRewards/RepoRewards"
import { handleProofVerificationFailed } from "../src/repo-rewards"
import { createProofVerificationFailedEvent } from "./repo-rewards-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let repoUrl = "Example string value"
    let sender = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let newProofVerificationFailedEvent = createProofVerificationFailedEvent(
      repoUrl,
      sender
    )
    handleProofVerificationFailed(newProofVerificationFailedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("ProofVerificationFailed created and stored", () => {
    assert.entityCount("ProofVerificationFailed", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "ProofVerificationFailed",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "repoUrl",
      "Example string value"
    )
    assert.fieldEquals(
      "ProofVerificationFailed",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "sender",
      "0x0000000000000000000000000000000000000001"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
