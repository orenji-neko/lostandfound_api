import { randomBytes } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

export const saveFile = async (image: File): Promise<string> => {
  // Ensure the /file directory exists
  await mkdir(path.join(process.cwd(), 'file'), { recursive: true });

  // Generate a unique hashed filename
  const fileExtension = path.extname(image.name);
  const hashedFilename = randomBytes(16).toString('hex') + fileExtension;
  const filePath = path.join(process.cwd(), 'file', hashedFilename);

  // Convert ArrayBuffer to Uint8Array
  const arrayBuffer = await image.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  // Write the file to the /file directory
  await writeFile(filePath, uint8Array);

  return hashedFilename;
}