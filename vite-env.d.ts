// Fixed: Removed unused env definitions
// Reference to vite/client removed due to missing type definition file

interface ImportMetaEnv {
  // Add env vars here if needed in future
  [key: string]: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
