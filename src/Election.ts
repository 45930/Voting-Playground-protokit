import {
  RuntimeModule,
  runtimeModule,
  state,
  runtimeMethod,
} from "@proto-kit/module";

import { State } from "@proto-kit/protocol";

import { Field, UInt64, Struct, Provable, Character, Poseidon } from 'snarkyjs';

export class IpfsHash extends Struct({
  value: Provable.Array(Character, 60)
}) {
  static blank(): IpfsHash {
    let empty = new Array(60).fill(Character.fromFields([Field(0)]));
    return new IpfsHash({ value: empty });
  }

  hash(): Field {
    return Poseidon.hash(this.value.map(x => x.value))
  }
}

export class Ballot extends Struct({
  value: Provable.Array(UInt64, 5)
}) { }

@runtimeModule()
export class Election extends RuntimeModule<{}> {
  @state() public electionDetails = State.from<IpfsHash>(IpfsHash);
  @state() public votes = State.from<Ballot>(Ballot);

  @runtimeMethod()
  setElectionDetails(newElectionDetails: IpfsHash) {
    const electionDetails = this.electionDetails.get();
    IpfsHash.blank().hash().assertEquals(electionDetails.value.hash());
    this.electionDetails.set(newElectionDetails);
  }

  @runtimeMethod()
  castBallot1(vote: Ballot) {
    const votes = this.votes.get();

    let voteSum = UInt64.from(0);
    for (let i = 0; i < 5; i++) {
      voteSum = voteSum.add(vote.value[i]);
      votes.value.value[i] = votes.value.value[i].add(vote.value[i]);
    }
    voteSum.value.assertEquals(1); // vote must be exactly one vote for one choice
    this.votes.set(votes.value);
  }
}
