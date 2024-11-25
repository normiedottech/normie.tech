declare module 'aes-encryption' {
    class Aes {
      secretKey: string;
      secretBuffer: Buffer | null;
  
      constructor();
      setSecretKey(secretKeyInput: string): void;
      encrypt(textPlain: string, secretKeyInput?: string): string;
      decrypt(textEncrypted: string, secretKeyInput?: string): string;
    } 
    export = Aes;
}
  