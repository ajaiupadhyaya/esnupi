/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SPLINE_URL?: string;
  readonly VITE_GITHUB_USER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.mdx" {
  import type { ComponentType } from "react";
  const MDXComponent: ComponentType<Record<string, unknown>>;
  export default MDXComponent;
}
