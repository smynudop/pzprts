

interface HTMLCanvasElement {
    toBuffer: (type: string, quality: number) => string | Buffer<ArrayBuffer> | Uint8Array<ArrayBuffer> | ArrayBuffer | null;
}