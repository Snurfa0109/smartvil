import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

export async function uploadImageToStorage(file: File, folder: string = "news"): Promise<string> {
  const name = `${Date.now()}_${file.name.replace(/\s/g, "_")}`;
  const storageRef = ref(storage, `${folder}/${name}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return url;
}
