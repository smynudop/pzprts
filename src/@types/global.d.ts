import type { WrapperBase } from "../candle";

declare global {
    interface HTMLCanvasElement {
        toBuffer: (type: string, quality: number) => string | Buffer<ArrayBuffer> | Uint8Array<ArrayBuffer> | ArrayBuffer | null;
    }

    interface HTMLElement {
        getContext: (type: string) => WrapperBase
        toDataURL: (type: string, quality: number) => string
        toBuffer: (type: string, quality: number) => string | Buffer<ArrayBuffer> | Uint8Array<ArrayBuffer> | ArrayBuffer | null;
        toBlob: (callback: (blob: Blob | null, option?: any) => void, type: string, quality: number) => void
    }
}
