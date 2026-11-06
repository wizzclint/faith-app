import { Asset } from "expo-asset";
import { Platform } from "react-native";

/** SDK 52's Android audio player needs a real file path, not a raw resource name. */
export async function bundledAudioSource(moduleId: number): Promise<{ uri: string }> {
  const asset = await Asset.fromModule(moduleId).downloadAsync();
  const uri = asset.localUri || asset.uri;
  if (!uri) throw new Error("Bundled audio file is unavailable");
  // expo-audio 0.3.x wraps local paths in File(), so strip the file:// scheme.
  if (Platform.OS === "android" && uri.startsWith("file://")) {
    return { uri: decodeURIComponent(uri.slice("file://".length)) };
  }
  return { uri };
}
