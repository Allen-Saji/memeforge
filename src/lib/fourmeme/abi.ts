export const TOKEN_MANAGER_ADDRESS =
  "0x5c952063c7fc8610FFDB798152D69F0B9550762b";

// Minimal ABI — only what we need for createToken + event parsing
export const TOKEN_MANAGER_ABI = [
  "function createToken(bytes calldata createArg, bytes calldata signature) external payable returns (address)",
  "event TokenCreate(address indexed token, address indexed creator)",
] as const;
