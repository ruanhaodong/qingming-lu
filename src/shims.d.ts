declare module "pixelfx" {
  export function createFrame(w: number, h: number, ox?: number, oy?: number): any;
  export function clearFrame(f: any): any;
  export function createFx(mod: any, o?: any): any;
  export function createAct(mod: any, o?: any): any;
  export function composite(f: any, out: Uint8ClampedArray | Uint8Array, bg?: any, lightK?: number): Uint8ClampedArray | Uint8Array;
  export function painterFor(frame: any): any;
  export const PAL: Record<string, string[]>;
}

declare module "*.js" {
  export const meta: {
    name?: string;
    desc?: string;
    size: [number, number];
    origin: [number, number];
    duration: number;
    loop?: boolean;
    fps?: number;
    actor?: number;
    options?: Record<string, unknown>;
    [k: string]: unknown;
  };
  export function create(o?: any): any;
  export function draw(p: any, t: number, o?: any): void;
  export function drawBack(p: any, t: number, o?: any): void;
  export const act: any;
}
