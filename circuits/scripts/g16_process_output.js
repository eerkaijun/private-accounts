const { transformFile } = require("./_transform_file");

const FILE_TANSFORMS = [
  {
    filename: "./generated/TransactionVerifier.sol",
    edits: [
      [`contract Verifier`, `contract TransactionVerifier`],
      [`pragma solidity ^0.6.11;`, `pragma solidity ^0.8.0;`],
    ],
  },
  {
    filename: "./generated/BlocklistVerifier.sol",
    edits:[
      [`contract Verifier`, `contract BlocklistVerifier`],
      [`pragma solidity ^0.6.11;`, `pragma solidity ^0.8.0;`],
    ]
  },
  {
    filename: "./generated/CompliantVerifier.sol",
    edits:[
      [`contract Verifier`, `contract CompliantVerifier`],
      [`pragma solidity ^0.6.11;`, `pragma solidity ^0.8.0;`],
    ]
  },
  {
    filename: "./generated/AuthenticationVerifier.sol",
    edits:[
      [`contract Verifier`, `contract AuthenticationVerifier`],
      [`pragma solidity ^0.6.11;`, `pragma solidity ^0.8.0;`],
    ]
  }
];

transformFile(FILE_TANSFORMS)
  .then(() => console.log("Verifier Processed Successfully"))
  .catch((err) => console.error(err));
