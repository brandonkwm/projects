/** Ethereum address: 0x followed by 40 hex characters */
const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

export function isValidEthAddress(value: string): boolean {
  return ETH_ADDRESS_REGEX.test(value.trim());
}

export function addressValidationHint(): string {
  return "Use a full Ethereum address (0x + 40 hex characters). Sending to a wrong address cannot be undone.";
}
