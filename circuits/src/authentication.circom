pragma circom 2.1.4;

include "../node_modules/circomlib/circuits/poseidon.circom";

template Authentication() {
    // prove that the user has the secret which gains access to the system
    // without revealing the secret

    signal input secret;
    signal input hashedSecret;

    // constraint that the user knows the correct secret
    component poseidon = Poseidon(1);
    poseidon.inputs[0] <== secret;
    poseidon.out === hashedSecret;
}

component main { public [hashedSecret] } = Authentication();