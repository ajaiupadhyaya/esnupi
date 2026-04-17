declare module "hydra-synth" {
  interface HydraOptions {
    width?: number;
    height?: number;
    canvas?: HTMLCanvasElement;
    detectAudio?: boolean;
    makeGlobal?: boolean;
    autoLoop?: boolean;
    numSources?: number;
    numOutputs?: number;
  }

  export default class HydraRenderer {
    constructor(opts?: HydraOptions);
    eval(code: string): void;
    setResolution(width: number, height: number): void;
    hush(): void;
    canvas: HTMLCanvasElement;
  }
}
