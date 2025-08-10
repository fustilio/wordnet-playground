export interface StorageInfo {
  total: number;
  used: number;
  available: number;
  databases: DatabaseInfo[];
}

export interface DatabaseInfo {
  name: string;
  size: number;
  lastModified: Date;
  tables: string[];
}
