declare module "pdf-parse" {
  interface PDFInfo {
    [key: string]: unknown;
  }

  interface PDFResult {
    numpages: number;
    numrender: number;
    info: PDFInfo;
    metadata?: unknown;
    text: string;
    version?: string;
  }

  function pdf(dataBuffer: Buffer | Uint8Array): Promise<PDFResult>;
  export default pdf;
}
