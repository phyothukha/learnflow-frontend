function toSnakeCaseFileName(name: string) {
  const trimmed = name.trim();
  const lastDot = trimmed.lastIndexOf(".");
  const hasExt = lastDot > 0 && lastDot < trimmed.length - 1;
  const base = hasExt ? trimmed.slice(0, lastDot) : trimmed;
  const ext = hasExt ? trimmed.slice(lastDot).toLowerCase() : "";
  const snake = base
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase();
  return `${snake || "download"}${ext}`;
}

export function downloadText(content: string, fileName: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = window.document.createElement("a");
  link.href = url;
  link.download = toSnakeCaseFileName(fileName);
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadFromUrl(url: string, fileName: string) {
  const link = window.document.createElement("a");
  link.href = url;
  link.download = toSnakeCaseFileName(fileName);
  link.target = "_blank";
  link.rel = "noopener";
  link.click();
}
