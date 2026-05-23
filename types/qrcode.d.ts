declare module 'qrcode' {
  interface QRCodeOptions {
    width?: number;
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }

  function toBuffer(text: string, options?: QRCodeOptions): Promise<Buffer>;
  function toDataURL(text: string, options?: QRCodeOptions): Promise<string>;
  function toString(text: string, options?: QRCodeOptions): Promise<string>;

  export default { toBuffer, toDataURL, toString };
}
