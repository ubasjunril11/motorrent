import { Platform } from 'react-native';

export function isRemoteImageUri(uri: string): boolean {
  return uri.startsWith('http://') || uri.startsWith('https://');
}

function extensionFromMime(mime: string): string {
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('gif')) return 'gif';
  return 'jpg';
}

export async function appendImageToFormData(
  formData: FormData,
  imageUri: string,
  fieldName = 'image'
): Promise<void> {
  if (Platform.OS === 'web') {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const ext = extensionFromMime(blob.type || 'image/jpeg');
    const filename = `motorcycle-${Date.now()}.${ext}`;
    const typedBlob =
      blob.type && blob.type.startsWith('image/')
        ? blob
        : new Blob([blob], { type: `image/${ext === 'jpg' ? 'jpeg' : ext}` });

    formData.append(fieldName, typedBlob, filename);
    return;
  }

  const rawName = imageUri.split('/').pop()?.split('?')[0] || '';
  const hasExt = /\.(jpe?g|png|webp|gif)$/i.test(rawName);
  const filename = hasExt ? rawName : `motorcycle-${Date.now()}.jpg`;

  formData.append(
    fieldName,
    {
      uri: imageUri,
      name: filename,
      type: 'image/jpeg',
    } as unknown as Blob
  );
}
