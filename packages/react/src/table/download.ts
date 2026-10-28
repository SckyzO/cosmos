// The file download of a DataTable export or a job log. Internal: not re-exported.

// A spreadsheet needs the byte order mark to read a CSV as UTF-8 (accents).
const BOM = '\ufeff';

/** Downloads `content` as a file named `fileName` of type `type`, through a temporary link. */
export const downloadFile = (content: string, fileName: string, type: string): void => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

/** Downloads `csv` as a UTF-8 file named `fileName`, with the byte order mark a spreadsheet needs. */
export const downloadCsv = (csv: string, fileName: string): void =>
  downloadFile(BOM + csv, fileName, 'text/csv;charset=utf-8');
