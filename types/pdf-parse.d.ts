declare module "pdf-parse" {
  type PdfParseResult = {
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: unknown;
    text: string;
    version: string;
  };

  export default function pdfParse(dataBuffer: Buffer): Promise<PdfParseResult>;
}

declare module "pdf-parse/lib/pdf-parse.js" {
  import pdfParse from "pdf-parse";
  export default pdfParse;
}

declare module "pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js" {
  type PdfTextItem = {
    str: string;
    transform: number[];
  };

  type PdfPage = {
    getTextContent(): Promise<{ items: PdfTextItem[] }>;
  };

  type PdfDocument = {
    numPages: number;
    getPage(pageNumber: number): Promise<PdfPage>;
  };

  export function getDocument(data: Uint8Array): {
    promise: Promise<PdfDocument>;
  };
}
