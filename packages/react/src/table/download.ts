// The file download of a DataTable export, kept apart from the component. Internal: not re-exported.

// A spreadsheet needs the byte order mark to read a CSV as UTF-8 (accents).
const BOM = '﻿';

/** Downloads `csv` as a UTF-8 file named `fileName`, through a temporary link. */
export const downloadCsv = (csv: string, fileName: string): void => {
  const url = URL.createObjectURL(new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
