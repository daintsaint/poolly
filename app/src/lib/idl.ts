export type Poolly = {
  address: string;
  metadata: { name: "poolly"; version: "0.1.0"; spec: "0.1.0" };
  instructions: [
    {
      name: "createPool";
      discriminator: [233, 146, 209, 142, 207, 104, 64, 188];
      accounts: [
        { name: "host"; writable: true; signer: true },
        { name: "mint" },
        { name: "pool"; writable: true; pda: { seeds: [{ kind: "const"; value: [112, 111, 111, 108] }, { kind: "account"; path: "host" }, { kind: "arg"; path: "params.title" }] } },
        { name: "escrowToken"; writable: true; pda: { seeds: [{ kind: "account"; path: "pool" }, { kind: "const"; value: [6, 221, 246, 225, 215, 101, 161, 147, 217, 203, 225, 70, 206, 235, 121, 172, 28, 180, 133, 237, 95, 91, 55, 145, 58, 140, 245, 133, 126, 255, 0, 169] }, { kind: "account"; path: "mint" }] } },
        { name: "tokenProgram" },
        { name: "associatedTokenProgram" },
        { name: "systemProgram" }
      ];
      args: [{ name: "params"; type: { defined: { name: "createPoolParams" } } }];
    },
    {
      name: "joinPool";
      discriminator: [14, 65, 62, 16, 116, 17, 195, 107];
      accounts: [
        { name: "member"; writable: true; signer: true },
        { name: "pool"; writable: true },
        { name: "memberToken"; writable: true },
        { name: "escrowToken"; writable: true },
        { name: "memberRecord"; writable: true; pda: { seeds: [{ kind: "const"; value: [109, 101, 109, 98, 101, 114] }, { kind: "account"; path: "pool" }, { kind: "account"; path: "member" }] } },
        { name: "tokenProgram" },
        { name: "associatedTokenProgram" },
        { name: "systemProgram" }
      ];
      args: [];
    },
    {
      name: "releaseFunds";
      discriminator: [225, 88, 91, 108, 126, 52, 2, 26];
      accounts: [
        { name: "host"; signer: true },
        { name: "pool"; writable: true },
        { name: "escrowToken"; writable: true },
        { name: "hostToken"; writable: true },
        { name: "platformToken"; writable: true },
        { name: "tokenProgram" }
      ];
      args: [];
    },
    {
      name: "submitProof";
      discriminator: [54, 241, 46, 84, 4, 212, 46, 94];
      accounts: [
        { name: "host"; signer: true },
        { name: "pool"; writable: true }
      ];
      args: [{ name: "proofUri"; type: "string" }];
    },
    {
      name: "closePool";
      discriminator: [140, 189, 209, 23, 239, 62, 239, 11];
      accounts: [
        { name: "host"; signer: true },
        { name: "pool"; writable: true },
        { name: "escrowToken"; writable: true },
        { name: "hostToken"; writable: true },
        { name: "tokenProgram" }
      ];
      args: [];
    }
  ];
  accounts: [
    {
      name: "pool";
      discriminator: [241, 154, 109, 4, 17, 177, 109, 188];
    },
    {
      name: "memberRecord";
      discriminator: [26, 35, 161, 83, 248, 8, 189, 249];
    }
  ];
  types: [
    {
      name: "pool";
      type: {
        kind: "struct";
        fields: [
          { name: "host"; type: "pubkey" },
          { name: "mint"; type: "pubkey" },
          { name: "title"; type: "string" },
          { name: "category"; type: "u8" },
          { name: "pricePerSlot"; type: "u64" },
          { name: "maxSlots"; type: "u8" },
          { name: "minSlots"; type: "u8" },
          { name: "filledSlots"; type: "u8" },
          { name: "cycleDays"; type: "u16" },
          { name: "status"; type: { defined: { name: "poolStatus" } } },
          { name: "createdAt"; type: "i64" },
          { name: "nextChargeAt"; type: "i64" },
          { name: "totalCycles"; type: "u32" },
          { name: "lastProofUri"; type: "string" },
          { name: "bump"; type: "u8" },
          { name: "escrowBump"; type: "u8" }
        ];
      };
    },
    {
      name: "memberRecord";
      type: {
        kind: "struct";
        fields: [
          { name: "pool"; type: "pubkey" },
          { name: "wallet"; type: "pubkey" },
          { name: "joinedAt"; type: "i64" },
          { name: "cyclesPaid"; type: "u32" },
          { name: "bump"; type: "u8" }
        ];
      };
    },
    {
      name: "createPoolParams";
      type: {
        kind: "struct";
        fields: [
          { name: "title"; type: "string" },
          { name: "category"; type: "u8" },
          { name: "pricePerSlot"; type: "u64" },
          { name: "maxSlots"; type: "u8" },
          { name: "minSlots"; type: "u8" },
          { name: "cycleDays"; type: "u16" }
        ];
      };
    },
    {
      name: "poolStatus";
      type: { kind: "enum"; variants: [{ name: "Pending" }, { name: "Active" }, { name: "Closed" }] };
    }
  ];
  errors: [
    { code: 6000; name: "InvalidPrice" },
    { code: 6001; name: "InvalidSlots" },
    { code: 6002; name: "InvalidCycle" },
    { code: 6003; name: "TitleTooLong" },
    { code: 6004; name: "UriTooLong" },
    { code: 6005; name: "PoolNotOpen" },
    { code: 6006; name: "PoolFull" },
    { code: 6007; name: "AlreadyMember" },
    { code: 6008; name: "PoolNotActive" },
    { code: 6009; name: "NoFunds" },
    { code: 6010; name: "Unauthorized" },
    { code: 6011; name: "AlreadyClosed" }
  ];
};

export const IDL: Poolly = {
  address: "Edv6BNFLKPKJ4KUWco2MEmGSTsdSU4xBWFsaFFmezpcq",
  metadata: { name: "poolly", version: "0.1.0", spec: "0.1.0" },
  instructions: [
    {
      name: "createPool",
      discriminator: [233, 146, 209, 142, 207, 104, 64, 188],
      accounts: [
        { name: "host", writable: true, signer: true },
        { name: "mint" },
        { name: "pool", writable: true, pda: { seeds: [{ kind: "const", value: [112, 111, 111, 108] }, { kind: "account", path: "host" }, { kind: "arg", path: "params.title" }] } },
        { name: "escrowToken", writable: true, pda: { seeds: [{ kind: "account", path: "pool" }, { kind: "const", value: [6, 221, 246, 225, 215, 101, 161, 147, 217, 203, 225, 70, 206, 235, 121, 172, 28, 180, 133, 237, 95, 91, 55, 145, 58, 140, 245, 133, 126, 255, 0, 169] }, { kind: "account", path: "mint" }] } },
        { name: "tokenProgram" },
        { name: "associatedTokenProgram" },
        { name: "systemProgram" }
      ],
      args: [{ name: "params", type: { defined: { name: "createPoolParams" } } }],
    },
    {
      name: "joinPool",
      discriminator: [14, 65, 62, 16, 116, 17, 195, 107],
      accounts: [
        { name: "member", writable: true, signer: true },
        { name: "pool", writable: true },
        { name: "memberToken", writable: true },
        { name: "escrowToken", writable: true },
        { name: "memberRecord", writable: true, pda: { seeds: [{ kind: "const", value: [109, 101, 109, 98, 101, 114] }, { kind: "account", path: "pool" }, { kind: "account", path: "member" }] } },
        { name: "tokenProgram" },
        { name: "associatedTokenProgram" },
        { name: "systemProgram" }
      ],
      args: [],
    },
    {
      name: "releaseFunds",
      discriminator: [225, 88, 91, 108, 126, 52, 2, 26],
      accounts: [
        { name: "host", signer: true },
        { name: "pool", writable: true },
        { name: "escrowToken", writable: true },
        { name: "hostToken", writable: true },
        { name: "platformToken", writable: true },
        { name: "tokenProgram" }
      ],
      args: [],
    },
    {
      name: "submitProof",
      discriminator: [54, 241, 46, 84, 4, 212, 46, 94],
      accounts: [
        { name: "host", signer: true },
        { name: "pool", writable: true }
      ],
      args: [{ name: "proofUri", type: "string" }],
    },
    {
      name: "closePool",
      discriminator: [140, 189, 209, 23, 239, 62, 239, 11],
      accounts: [
        { name: "host", signer: true },
        { name: "pool", writable: true },
        { name: "escrowToken", writable: true },
        { name: "hostToken", writable: true },
        { name: "tokenProgram" }
      ],
      args: [],
    },
  ],
  accounts: [
    { name: "pool", discriminator: [241, 154, 109, 4, 17, 177, 109, 188] },
    { name: "memberRecord", discriminator: [26, 35, 161, 83, 248, 8, 189, 249] },
  ],
  types: [
    {
      name: "pool",
      type: {
        kind: "struct",
        fields: [
          { name: "host", type: "pubkey" },
          { name: "mint", type: "pubkey" },
          { name: "title", type: "string" },
          { name: "category", type: "u8" },
          { name: "pricePerSlot", type: "u64" },
          { name: "maxSlots", type: "u8" },
          { name: "minSlots", type: "u8" },
          { name: "filledSlots", type: "u8" },
          { name: "cycleDays", type: "u16" },
          { name: "status", type: { defined: { name: "poolStatus" } } },
          { name: "createdAt", type: "i64" },
          { name: "nextChargeAt", type: "i64" },
          { name: "totalCycles", type: "u32" },
          { name: "lastProofUri", type: "string" },
          { name: "bump", type: "u8" },
          { name: "escrowBump", type: "u8" },
        ],
      },
    },
    {
      name: "memberRecord",
      type: {
        kind: "struct",
        fields: [
          { name: "pool", type: "pubkey" },
          { name: "wallet", type: "pubkey" },
          { name: "joinedAt", type: "i64" },
          { name: "cyclesPaid", type: "u32" },
          { name: "bump", type: "u8" },
        ],
      },
    },
    {
      name: "createPoolParams",
      type: {
        kind: "struct",
        fields: [
          { name: "title", type: "string" },
          { name: "category", type: "u8" },
          { name: "pricePerSlot", type: "u64" },
          { name: "maxSlots", type: "u8" },
          { name: "minSlots", type: "u8" },
          { name: "cycleDays", type: "u16" },
        ],
      },
    },
    {
      name: "poolStatus",
      type: { kind: "enum", variants: [{ name: "Pending" }, { name: "Active" }, { name: "Closed" }] },
    },
  ],
  errors: [
    { code: 6000, name: "InvalidPrice" },
    { code: 6001, name: "InvalidSlots" },
    { code: 6002, name: "InvalidCycle" },
    { code: 6003, name: "TitleTooLong" },
    { code: 6004, name: "UriTooLong" },
    { code: 6005, name: "PoolNotOpen" },
    { code: 6006, name: "PoolFull" },
    { code: 6007, name: "AlreadyMember" },
    { code: 6008, name: "PoolNotActive" },
    { code: 6009, name: "NoFunds" },
    { code: 6010, name: "Unauthorized" },
    { code: 6011, name: "AlreadyClosed" },
  ],
};
