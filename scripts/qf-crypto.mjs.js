/* note the encryption key is private. Do not reverse engineer */

export function getDecryption_key(key_type) {
  switch (key_type) {
    case 0:  // private
      return "1a9a5c4b1cc62e975e3e10e4b5746c5de581dcfab3474d0488cb2cd10073e01b";
    case 1:  // domain
      return "68a025ffe52fd5cf9beaf0693b6e77e58278f6089f01bdac4afe965241f5cf8a5d9e25d0750091a7c8bcb3807909ddc290f00ed9ab6437d801ab1a2ac14cd5b";
    default:
      return -1; // unknown or free license
  }
}

export function getModulus(key_type) {
  switch (key_type) {
    case 0:  // private
      return "2e1a582ecaab7ea39580890e1db6462137c20fb8abcad9b2dad70a610011e685";
    case 1:  // domain
      return "12c127d3fb813f8bba7e863ab31c9943b76505f96cb87bfa9d4f9dc503a1bfe0c74e0057cff6ee9f3814fb90bc42207fdd908fbdb00cbf9a8f8c53dc7c4ed7b5";
    default:
      return -1; // unknown or free license
  }
}

export function getMaxDigits(key_type) {
  switch (key_type) {
    case 0:  // private
      return 35;
    case 1:  // domain
      return 67;
    default:
      return 0; // unknown or free license
  }
}
  
export function getKeyLength(key_type) {
  switch (key_type) {
    case 0:  // private
      return 256;
    case 1:  // domain
      return 512;
    default:
      return 0; // unknown or free license
  }
}
