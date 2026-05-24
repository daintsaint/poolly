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
      discriminator: [76, 51, 204, 168, 60, 114, 145, 60];
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
      discriminator: [186, 111, 226, 130, 97, 120, 31, 141];
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
      discriminator: [196, 130, 22, 16, 244, 56, 249, 133];
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
      discriminator: [12, 166, 195, 0, 252, 242, 91, 239];
    }
  ];
  types: [
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
  address: "7kc872pcWWcyrbVBZdZ3YPNzccJkkD7qxriNwEjZfysd",
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
      discriminator: [76, 51, 204, 168, 60, 114, 145, 60],
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
      discriminator: [186, 111, 226, 130, 97, 120, 31, 141],
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
      discriminator: [196, 130, 22, 16, 244, 56, 249, 133],
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
    { name: "memberRecord", discriminator: [12, 166, 195, 0, 252, 242, 91, 239] },
  ],
  types: [
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
