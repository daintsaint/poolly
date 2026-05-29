import type { Idl } from "@coral-xyz/anchor";
export const IDL = {
  "address": "Edv6BNFLKPKJ4KUWco2MEmGSTsdSU4xBWFsaFFmezpcq",
  "metadata": {
    "name": "poolly",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Poolly group-buying escrow program"
  },
  "instructions": [
    {
      "name": "claim_refund",
      "discriminator": [
        15,
        16,
        30,
        161,
        255,
        228,
        97,
        60
      ],
      "accounts": [
        {
          "name": "member",
          "writable": true,
          "signer": true
        },
        {
          "name": "pool",
          "writable": true
        },
        {
          "name": "member_token",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "member"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "pool.mint",
                "account": "Pool"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "escrow_token",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "pool.mint",
                "account": "Pool"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "member_record",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  109,
                  98,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "member"
              }
            ]
          }
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "close_pool",
      "discriminator": [
        140,
        189,
        209,
        23,
        239,
        62,
        239,
        11
      ],
      "accounts": [
        {
          "name": "host",
          "signer": true,
          "relations": [
            "pool"
          ]
        },
        {
          "name": "pool",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "create_pool",
      "discriminator": [
        233,
        146,
        209,
        142,
        207,
        104,
        64,
        188
      ],
      "accounts": [
        {
          "name": "host",
          "writable": true,
          "signer": true
        },
        {
          "name": "mint"
        },
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "host"
              },
              {
                "kind": "arg",
                "path": "params.title"
              }
            ]
          }
        },
        {
          "name": "escrow_token",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associated_token_program",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "CreatePoolParams"
            }
          }
        }
      ]
    },
    {
      "name": "flag_dispute",
      "discriminator": [
        150,
        222,
        78,
        72,
        117,
        140,
        2,
        75
      ],
      "accounts": [
        {
          "name": "member",
          "writable": true,
          "signer": true
        },
        {
          "name": "pool",
          "writable": true
        },
        {
          "name": "member_record",
          "docs": [
            "Verifies caller is a pool member"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  109,
                  98,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "member"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "join_pool",
      "discriminator": [
        14,
        65,
        62,
        16,
        116,
        17,
        195,
        107
      ],
      "accounts": [
        {
          "name": "member",
          "writable": true,
          "signer": true
        },
        {
          "name": "pool",
          "writable": true
        },
        {
          "name": "member_token",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "member"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "pool.mint",
                "account": "Pool"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "escrow_token",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "pool.mint",
                "account": "Pool"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "member_record",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  109,
                  98,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "member"
              }
            ]
          }
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associated_token_program",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "leave_pool",
      "discriminator": [
        249,
        99,
        213,
        170,
        247,
        191,
        36,
        115
      ],
      "accounts": [
        {
          "name": "member",
          "writable": true,
          "signer": true
        },
        {
          "name": "pool",
          "writable": true
        },
        {
          "name": "member_token",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "member"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "pool.mint",
                "account": "Pool"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "escrow_token",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "pool.mint",
                "account": "Pool"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "member_record",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  109,
                  98,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "member"
              }
            ]
          }
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "release_funds",
      "discriminator": [
        225,
        88,
        91,
        108,
        126,
        52,
        2,
        26
      ],
      "accounts": [
        {
          "name": "host",
          "signer": true,
          "relations": [
            "pool"
          ]
        },
        {
          "name": "pool",
          "writable": true
        },
        {
          "name": "escrow_token",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "pool.mint",
                "account": "Pool"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "host_token",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "host"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "pool.mint",
                "account": "Pool"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "platform_token",
          "writable": true
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "resolve_dispute",
      "discriminator": [
        231,
        6,
        202,
        6,
        96,
        103,
        12,
        230
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true
        },
        {
          "name": "pool",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "in_favor_of_host",
          "type": "bool"
        }
      ]
    },
    {
      "name": "submit_proof",
      "discriminator": [
        54,
        241,
        46,
        84,
        4,
        212,
        46,
        94
      ],
      "accounts": [
        {
          "name": "host",
          "signer": true,
          "relations": [
            "pool"
          ]
        },
        {
          "name": "pool",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "proof_uri",
          "type": "string"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "MemberRecord",
      "discriminator": [
        26,
        35,
        161,
        83,
        248,
        8,
        189,
        249
      ]
    },
    {
      "name": "Pool",
      "discriminator": [
        241,
        154,
        109,
        4,
        17,
        177,
        109,
        188
      ]
    }
  ],
  "events": [
    {
      "name": "DisputeFlagged",
      "discriminator": [
        52,
        205,
        253,
        115,
        186,
        119,
        132,
        141
      ]
    },
    {
      "name": "DisputeResolved",
      "discriminator": [
        121,
        64,
        249,
        153,
        139,
        128,
        236,
        187
      ]
    },
    {
      "name": "FundsReleased",
      "discriminator": [
        178,
        119,
        252,
        230,
        131,
        104,
        210,
        210
      ]
    },
    {
      "name": "MemberJoined",
      "discriminator": [
        156,
        199,
        149,
        88,
        193,
        203,
        191,
        210
      ]
    },
    {
      "name": "MemberLeft",
      "discriminator": [
        48,
        83,
        72,
        92,
        111,
        227,
        133,
        142
      ]
    },
    {
      "name": "PoolClosed",
      "discriminator": [
        106,
        46,
        29,
        231,
        42,
        44,
        73,
        119
      ]
    },
    {
      "name": "PoolCreated",
      "discriminator": [
        202,
        44,
        41,
        88,
        104,
        220,
        157,
        82
      ]
    },
    {
      "name": "ProofSubmitted",
      "discriminator": [
        160,
        51,
        85,
        70,
        249,
        89,
        5,
        139
      ]
    },
    {
      "name": "RefundClaimed",
      "discriminator": [
        136,
        64,
        242,
        99,
        4,
        244,
        208,
        130
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidPrice",
      "msg": "Price must be greater than zero"
    },
    {
      "code": 6001,
      "name": "InvalidSlots",
      "msg": "Slots must be between 1 and 50"
    },
    {
      "code": 6002,
      "name": "InvalidCycle",
      "msg": "Cycle must be between 7 and 365 days"
    },
    {
      "code": 6003,
      "name": "TitleTooLong",
      "msg": "Title must be 1–64 characters"
    },
    {
      "code": 6004,
      "name": "UriTooLong",
      "msg": "Proof URI must be 1–200 characters"
    },
    {
      "code": 6005,
      "name": "PoolNotOpen",
      "msg": "Pool is not open for joining"
    },
    {
      "code": 6006,
      "name": "PoolFull",
      "msg": "Pool is full"
    },
    {
      "code": 6007,
      "name": "AlreadyMember",
      "msg": "Already a member of this pool"
    },
    {
      "code": 6008,
      "name": "PoolNotActive",
      "msg": "Pool is not active"
    },
    {
      "code": 6009,
      "name": "PoolNotClosed",
      "msg": "Pool is not closed"
    },
    {
      "code": 6010,
      "name": "NoFunds",
      "msg": "No funds in escrow"
    },
    {
      "code": 6011,
      "name": "Unauthorized",
      "msg": "Unauthorized"
    },
    {
      "code": 6012,
      "name": "AlreadyClosed",
      "msg": "Pool is already closed"
    },
    {
      "code": 6013,
      "name": "HostCannotLeave",
      "msg": "Host cannot leave their own pool — close it instead"
    },
    {
      "code": 6014,
      "name": "PoolDisputed",
      "msg": "Pool is under dispute — release blocked"
    },
    {
      "code": 6015,
      "name": "AlreadyDisputed",
      "msg": "Pool is already flagged as disputed"
    },
    {
      "code": 6016,
      "name": "NotDisputed",
      "msg": "Pool has no active dispute"
    },
    {
      "code": 6017,
      "name": "NotAdmin",
      "msg": "Caller is not the admin"
    }
  ],
  "types": [
    {
      "name": "CreatePoolParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "title",
            "type": "string"
          },
          {
            "name": "category",
            "type": "u8"
          },
          {
            "name": "price_per_slot",
            "type": "u64"
          },
          {
            "name": "max_slots",
            "type": "u8"
          },
          {
            "name": "min_slots",
            "type": "u8"
          },
          {
            "name": "cycle_days",
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "DisputeFlagged",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pool",
            "type": "pubkey"
          },
          {
            "name": "member",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "DisputeResolved",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pool",
            "type": "pubkey"
          },
          {
            "name": "in_favor_of_host",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "FundsReleased",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pool",
            "type": "pubkey"
          },
          {
            "name": "host_amount",
            "type": "u64"
          },
          {
            "name": "fee",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "MemberJoined",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pool",
            "type": "pubkey"
          },
          {
            "name": "member",
            "type": "pubkey"
          },
          {
            "name": "filled_slots",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "MemberLeft",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pool",
            "type": "pubkey"
          },
          {
            "name": "member",
            "type": "pubkey"
          },
          {
            "name": "filled_slots",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "MemberRecord",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pool",
            "type": "pubkey"
          },
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "joined_at",
            "type": "i64"
          },
          {
            "name": "cycles_paid",
            "type": "u32"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "Pool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "host",
            "type": "pubkey"
          },
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "title",
            "type": "string"
          },
          {
            "name": "category",
            "type": "u8"
          },
          {
            "name": "price_per_slot",
            "type": "u64"
          },
          {
            "name": "max_slots",
            "type": "u8"
          },
          {
            "name": "min_slots",
            "type": "u8"
          },
          {
            "name": "filled_slots",
            "type": "u8"
          },
          {
            "name": "cycle_days",
            "type": "u16"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "PoolStatus"
              }
            }
          },
          {
            "name": "created_at",
            "type": "i64"
          },
          {
            "name": "next_charge_at",
            "type": "i64"
          },
          {
            "name": "total_cycles",
            "type": "u32"
          },
          {
            "name": "last_proof_uri",
            "type": "string"
          },
          {
            "name": "is_disputed",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "PoolClosed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pool",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "PoolCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pool",
            "type": "pubkey"
          },
          {
            "name": "host",
            "type": "pubkey"
          },
          {
            "name": "title",
            "type": "string"
          },
          {
            "name": "price_per_slot",
            "type": "u64"
          },
          {
            "name": "max_slots",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "PoolStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Pending"
          },
          {
            "name": "Active"
          },
          {
            "name": "Closed"
          }
        ]
      }
    },
    {
      "name": "ProofSubmitted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pool",
            "type": "pubkey"
          },
          {
            "name": "proof_uri",
            "type": "string"
          },
          {
            "name": "cycle",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "RefundClaimed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pool",
            "type": "pubkey"
          },
          {
            "name": "member",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    }
  ]
} as unknown as Idl;
export type Poolly = typeof IDL;
