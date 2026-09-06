export interface StoredFile {
  key: string;
  mime: string;
  bytes: number;
}

export interface StorageProvider {
  save(data: Buffer, mime: string): Promise<StoredFile>;
  read(key: string): Promise<Buffer>;
}
