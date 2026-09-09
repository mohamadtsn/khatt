/* A blob URL rather than a data: URL, because a large document exceeds what a
   data: URL can carry in some browsers. The object URL is revoked on the next
   frame, once the download has been handed to the browser. */
export function download(filename: string, contents: string, mime: string): void {
  const url = URL.createObjectURL(new Blob([contents], { type: `${mime};charset=utf-8` }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  requestAnimationFrame(() => URL.revokeObjectURL(url));
}
