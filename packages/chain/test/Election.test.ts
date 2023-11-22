import { TestingAppChain } from "@proto-kit/sdk";
import { Character, Field, PrivateKey, UInt64 } from "o1js";
import { Ballot, Election, IpfsHash } from "../src/Election";
import { log } from "@proto-kit/common";

log.setLevel("ERROR");

describe("Balances", () => {
  it("should demonstrate how balances work", async () => {
    const totalSupply = UInt64.from(10_000);

    const appChain = TestingAppChain.fromRuntime({
      modules: {
        Election,
      },
      config: {
        Election: {}
      },
    });

    await appChain.start();

    const alicePrivateKey = PrivateKey.random();
    const alice = alicePrivateKey.toPublicKey();

    appChain.setSigner(alicePrivateKey);

    const election = appChain.runtime.resolve("Election");
    const election_details = 'QmaNtrsFkKzF4KxEbdSoSdWr8XoVSdGRYri1U4b8beqwgX';
    let election_details_arr: Character[] = []
    for (let i = 0; i < 60; i++) {
      if (i < election_details.length) {
        election_details_arr.push(Character.fromString(election_details[i]))
      } else {
        election_details_arr.push(Character.fromFields([Field(0)]))
      }
    }

    const tx1 = await appChain.transaction(alice, () => {
      election.setElectionDetails(new IpfsHash({ value: election_details_arr }))
    });

    await tx1.sign();
    await tx1.send();
    const block1 = await appChain.produceBlock();

    const tx2 = await appChain.transaction(alice, () => {
      const myBallot = [0, 0, 1, 0, 0];
      election.castBallot1(new Ballot({ value: myBallot.map(x => UInt64.from(x)) }))
    });

    await tx2.sign();
    await tx2.send();

    const block2 = await appChain.produceBlock();

    const votes = await appChain.query.runtime.Election.votes.get();

    expect(block1?.txs[0].status, block1?.txs[0].statusMessage).toBe(true);
    expect(votes?.value?.toString()).toBe('0,0,1,0,0')
  });
});