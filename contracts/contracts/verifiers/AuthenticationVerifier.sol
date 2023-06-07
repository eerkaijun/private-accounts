// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {AuthenticationVerifier as Verifier} from "@zrclib/circuits/generated/AuthenticationVerifier.sol";

contract AuthenticationVerifier is Verifier {

    function parseProof(bytes memory data) public pure
        returns (uint[2] memory a, uint[2][2] memory b, uint[2] memory c) {
        (a[0], a[1], b[0][0], b[0][1], b[1][0], b[1][1], c[0], c[1]) = abi
            .decode(data, (uint, uint, uint, uint, uint, uint, uint, uint));
    }

    function verifyGroth16Proof(
        bytes memory proof,
        uint[2] memory pubSignals
    ) public view returns (bool) {
        (uint[2] memory a, uint[2][2] memory b, uint[2] memory c) = parseProof(
            proof
        );
        return verifyProof(a, b, c, pubSignals);
    }
}