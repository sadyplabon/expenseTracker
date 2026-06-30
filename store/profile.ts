import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_NAME = 'profile_name';
const KEY_PHOTO = 'profile_photo';

export async function getProfile(): Promise<{ name: string; photoUri: string | null }> {
  const [name, photoUri] = await Promise.all([
    AsyncStorage.getItem(KEY_NAME),
    AsyncStorage.getItem(KEY_PHOTO),
  ]);
  return { name: name ?? '', photoUri };
}

export async function saveProfile(name: string, photoUri: string | null): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(KEY_NAME, name),
    photoUri
      ? AsyncStorage.setItem(KEY_PHOTO, photoUri)
      : AsyncStorage.removeItem(KEY_PHOTO),
  ]);
}
