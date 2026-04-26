import crypto from 'crypto';

export class CryptoService {
  static hash(input: string, type: 'md5' | 'sha256'): string {
    return crypto.createHash(type).update(input).digest('hex');
  }

  static encode(input: string, type: 'base64'): string {
    if (type === 'base64') {
      return Buffer.from(input).toString('base64');
    }
    throw new Error(`Unsupported encoding type: ${type}`);
  }

  static decode(input: string, type: 'base64'): string {
    if (type === 'base64') {
      return Buffer.from(input, 'base64').toString('utf-8');
    }
    throw new Error(`Unsupported decoding type: ${type}`);
  }
}
