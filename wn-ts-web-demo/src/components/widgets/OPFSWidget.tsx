import React from 'react';
import { Card } from '../shared/Card';
import type { useOPFS } from '../../hooks/useOPFS';

type OPFSWidgetProps = ReturnType<typeof useOPFS>;

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export const OPFSWidget: React.FC<OPFSWidgetProps> = ({ isSupported, storageInfo }) => {
  return (
    <Card title="OPFS Status">
      <div data-testid="opfs-status" className="space-y-4 text-sm">
        <div>
          <p className="font-medium text-gray-500">OPFS Support</p>
          <p className={isSupported ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
            {isSupported ? 'Supported & Active' : 'Not Supported'}
          </p>
        </div>
        {isSupported && storageInfo && (
          <div>
            <p className="font-medium text-gray-500">Storage Usage</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 my-2">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${storageInfo.total > 0 ? (storageInfo.used / storageInfo.total) * 100 : 0}%` }}
              ></div>
            </div>
            <div className="grid grid-cols-2 gap-x-2">
              <p>Used:</p><p className="font-mono text-right">{formatBytes(storageInfo.used)}</p>
              <p>Available:</p><p className="font-mono text-right">{formatBytes(storageInfo.available)}</p>
              <p>Total:</p><p className="font-mono text-right">{formatBytes(storageInfo.total)}</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
