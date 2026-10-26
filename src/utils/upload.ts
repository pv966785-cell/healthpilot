export const uploadFile = async (path: string, file: File): Promise<string> => {
  console.log('Uploading file to', path);
  return 'https://example.com/file';
};
