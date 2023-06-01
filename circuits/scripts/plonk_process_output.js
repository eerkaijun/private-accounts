const { transformFile } = require("./_transform_file");

const FILE_TANSFORMS = [
  {
    filename: "./generated/TransactionVerifier.sol",
    edits: [
      [`contract PlonkVerifier`, `contract TransactionVerifier`],
      [
        `        assembly {`,
        `        bool result;
        assembly {`,
      ],
      [
        `            mstore(0, isValid)
            return(0,0x20)
        }
        
    }
}`,
        `            mstore(0, isValid)
            result := mload(0)
        }
        return result;
    }
}`,
      ],
    ],
  },
  {
    filename: "./generated/BlocklistVerifier.sol",
    edits: [
      [`contract PlonkVerifier`, `contract BlocklistVerifier`],
      [
        `        assembly {`,
        `        bool result;
        assembly {`,
      ],
      [
        `            mstore(0, isValid)
            return(0,0x20)
        }
        
    }
}`,
        `            mstore(0, isValid)
            result := mload(0)
        }
        return result;
    }
}`,
      ],
    ],
  },
  {
    filename: "./generated/CompliantVerifier.sol",
    edits: [
      [`contract PlonkVerifier`, `contract CompliantVerifier`],
      [
        `        assembly {`,
        `        bool result;
        assembly {`,
      ],
      [
        `            mstore(0, isValid)
            return(0,0x20)
        }
        
    }
}`,
        `            mstore(0, isValid)
            result := mload(0)
        }
        return result;
    }
}`,
      ],
    ],
  },
];

transformFile(FILE_TANSFORMS)
  .then(() => console.log("Verifier Processed Successfully"))
  .catch((err) => console.error(err));
