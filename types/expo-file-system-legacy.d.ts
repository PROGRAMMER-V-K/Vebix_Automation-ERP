declare module 'expo-file-system/legacy' {
  export const documentDirectory: string | null;
  export const cacheDirectory: string | null;
  export const bundleDirectory: string | null;
  export enum EncodingType {
    UTF8 = 'utf8',
    BASE64 = 'base64',
  }
  export function writeAsStringAsync(
    fileUri: string,
    contents: string,
    options?: {
      encoding?: EncodingType | 'utf8' | 'base64';
    }
  ): Promise<void>;
}
