import type { ChatFrequency, CleaningEstimate } from "./chat-agent";

export type EstimatePdfDetails = {
  estimate: CleaningEstimate;
  adjustedRecurringEstimateUsd?: number | null;
  locale: "en" | "es";
  name?: string;
  phone?: string;
  address?: string;
  zipCode?: string;
  bedrooms: string;
  bathrooms: string;
  frequency: ChatFrequency;
  preferredTimes?: string[];
  notes?: string;
};

export type PdfLogoImage = {
  data: Uint8Array;
  width: number;
  height: number;
};

export function buildEstimatePdfLines(details: EstimatePdfDetails) {
  const recurring = details.adjustedRecurringEstimateUsd ?? details.estimate.recurringEstimateUsd;
  const firstCleaning = recurring ? recurring * 2 : details.estimate.firstCleaningEstimateUsd;
  const lines = [
    "Medina Clean",
    details.locale === "es" ? "Estimado de limpieza" : "Cleaning estimate",
    details.name ? `Name: ${details.name}` : "",
    details.phone ? `Phone: ${details.phone}` : "",
    details.address ? `Address: ${details.address}` : "",
    details.zipCode ? `ZIP: ${details.zipCode}` : "",
    `Bedrooms: ${details.bedrooms}`,
    `Bathrooms: ${details.bathrooms}`,
    `Frequency: ${frequencyLabel(details.frequency)}`,
    recurring
      ? `First cleaning rough estimate: $${firstCleaning}`
      : details.frequency === "post_construction"
        ? "Post-construction cleanup: onsite inspection required"
        : `One-time rough estimate: $${details.estimate.oneTimeEstimateUsd}`,
    recurring ? `Recurring rough estimate: $${recurring}` : "",
    details.estimate.addOns.length > 0
      ? `Add-ons: ${details.estimate.addOns.map((addOn) => `oven and refrigerator $${addOn.priceUsd}`).join(", ")}`
      : "",
    ...(details.preferredTimes || []).filter(Boolean).map((time, index) => `Preferred time ${index + 1}: ${time}`),
    details.notes ? `Notes: ${details.notes}` : "",
    "This is a rough estimate. Rosa confirms the final amount after seeing the property."
  ];

  return lines.filter(Boolean);
}

export function createEstimatePdf(lines: string[], logo?: PdfLogoImage) {
  const objects: Array<string | Array<string | Uint8Array>> = [];
  const imageObjectId = logo ? 6 : null;
  const contentObjectId = logo ? 7 : 6;
  const resources = logo
    ? "/Font << /F1 4 0 R /F2 5 0 R >> /XObject << /Logo 6 0 R >>"
    : "/Font << /F1 4 0 R /F2 5 0 R >>";
  const content = buildContentStream(lines, Boolean(logo));

  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << ${resources} >> /Contents ${contentObjectId} 0 R >>`);
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

  if (logo && imageObjectId) {
    objects.push([
      `<< /Type /XObject /Subtype /Image /Width ${logo.width} /Height ${logo.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logo.data.length} >>\nstream\n`,
      logo.data,
      "\nendstream"
    ]);
  }

  objects.push(`<< /Length ${new TextEncoder().encode(content).length} >>\nstream\n${content}\nendstream`);

  return writePdf(objects);
}

function buildContentStream(lines: string[], hasLogo: boolean) {
  const commands: string[] = [
    color(255, 250, 251),
    rect(0, 0, 612, 792, "f"),
    color(214, 51, 123),
    rect(0, 704, 612, 88, "f"),
    color(248, 232, 239),
    rect(0, 700, 612, 4, "f"),
    color(214, 51, 123),
    rect(54, 104, 504, 1, "f")
  ];

  if (hasLogo) {
    commands.push("q", "90 0 0 60 60 716 cm", "/Logo Do", "Q");
  }

  const title = lines[1] || "Cleaning estimate";
  const customer = extractValue(lines, "Name");
  const phone = extractValue(lines, "Phone");
  const address = extractValue(lines, "Address");
  const zip = extractValue(lines, "ZIP");
  const bedrooms = extractValue(lines, "Bedrooms");
  const bathrooms = extractValue(lines, "Bathrooms");
  const frequency = extractValue(lines, "Frequency");
  const firstCleaning = findLine(lines, "First cleaning rough estimate");
  const recurring = findLine(lines, "Recurring rough estimate");
  const oneTime = findLine(lines, "One-time rough estimate");
  const onsite = findLine(lines, "Post-construction cleanup");
  const addOns = extractValue(lines, "Add-ons");
  const notes = extractValue(lines, "Notes");
  const preferredTimes = lines.filter((line) => line.startsWith("Preferred time"));
  const date = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date());

  commands.push(
    text(title.toUpperCase(), 420, 752, 10, "F2", [255, 255, 255]),
    text("Medina Clean", 420, 728, 24, "F2", [255, 255, 255]),
    text("Woodstock, GA cleaning estimate", 420, 712, 10, "F1", [255, 255, 255]),
    text("Prepared for", 54, 662, 10, "F2", [154, 31, 83]),
    text(customer || "Customer", 54, 642, 18, "F2", [42, 36, 38]),
    text(address || "Address to be confirmed", 54, 622, 11, "F1", [78, 68, 72]),
    text([phone, zip ? `ZIP ${zip}` : ""].filter(Boolean).join("  |  "), 54, 604, 11, "F1", [78, 68, 72]),
    text("Estimate date", 410, 662, 10, "F2", [154, 31, 83]),
    text(date, 410, 642, 14, "F2", [42, 36, 38])
  );

  commands.push(...sectionCard(54, 424, 504, 142, "Estimate summary"));
  commands.push(
    text(firstCleaning || oneTime || onsite || "Rosa will confirm pricing after review.", 78, 526, 16, "F2", [42, 36, 38]),
    recurring ? text(recurring, 78, 500, 13, "F2", [154, 31, 83]) : "",
    text("Frequency", 78, 466, 9, "F2", [154, 31, 83]),
    text(frequency || "To be confirmed", 78, 448, 12, "F1", [42, 36, 38]),
    text("Home details", 244, 466, 9, "F2", [154, 31, 83]),
    text(`${bedrooms || "-"} bedrooms  |  ${bathrooms || "-"} bathrooms`, 244, 448, 12, "F1", [42, 36, 38]),
    text("Add-ons", 410, 466, 9, "F2", [154, 31, 83]),
    text(addOns || "None selected", 410, 448, 12, "F1", [42, 36, 38])
  );

  commands.push(...sectionCard(54, 260, 504, 128, "Requested appointment times"));
  if (preferredTimes.length > 0) {
    preferredTimes.slice(0, 3).forEach((time, index) => {
      commands.push(text(time, 78, 348 - index * 24, 12, "F1", [42, 36, 38]));
    });
  } else {
    commands.push(text("Rosa will coordinate times directly with the customer.", 78, 348, 12, "F1", [42, 36, 38]));
  }

  commands.push(...sectionCard(54, 136, 504, 88, "Notes and confirmation"));
  commands.push(
    ...wrapText(notes || "No extra customer notes.", 78, 188, 12, 74, 16, [42, 36, 38]),
    text("This is a rough estimate. Rosa confirms the final amount after seeing the property.", 78, 148, 10, "F2", [
      154,
      31,
      83
    ]),
    text("Medina Clean | Careful residential and small business cleaning near Woodstock, GA", 54, 76, 10, "F1", [
      78,
      68,
      72
    ]),
    text("Generated in your browser. This PDF is not stored on the server.", 54, 58, 9, "F1", [78, 68, 72])
  );

  return `${commands.filter(Boolean).join("\n")}\n`;
}

function sectionCard(x: number, y: number, width: number, height: number, title: string) {
  return [
    color(255, 255, 255),
    rect(x, y, width, height, "f"),
    color(248, 232, 239),
    rect(x, y + height - 34, width, 34, "f"),
    color(232, 204, 214),
    rect(x, y, width, height, "S"),
    text(title, x + 24, y + height - 22, 12, "F2", [154, 31, 83])
  ];
}

function text(value: string, x: number, y: number, size: number, font: "F1" | "F2", rgb: [number, number, number]) {
  return `${color(...rgb)}\nBT\n/${font} ${size} Tf\n1 0 0 1 ${x} ${y} Tm\n(${escapePdfString(value)}) Tj\nET`;
}

function wrapText(value: string, x: number, y: number, size: number, maxChars: number, lineHeight: number, rgb: [number, number, number]) {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines.slice(0, 3).map((line, index) => text(line, x, y - index * lineHeight, size, "F1", rgb));
}

function rect(x: number, y: number, width: number, height: number, mode: "f" | "S") {
  return `${x} ${y} ${width} ${height} re ${mode}`;
}

function color(red: number, green: number, blue: number) {
  return `${(red / 255).toFixed(3)} ${(green / 255).toFixed(3)} ${(blue / 255).toFixed(3)} rg\n${(red / 255).toFixed(3)} ${(green / 255).toFixed(3)} ${(blue / 255).toFixed(3)} RG`;
}

function extractValue(lines: string[], label: string) {
  const prefix = `${label}: `;
  return lines.find((line) => line.startsWith(prefix))?.slice(prefix.length) || "";
}

function findLine(lines: string[], label: string) {
  return lines.find((line) => line.startsWith(label)) || "";
}

function writePdf(objects: Array<string | Array<string | Uint8Array>>) {
  const chunks: Array<string | Uint8Array> = ["%PDF-1.4\n"];
  const offsets = [0];

  for (const [index, object] of objects.entries()) {
    offsets.push(partsLength(chunks));
    chunks.push(`${index + 1} 0 obj\n`);
    if (Array.isArray(object)) {
      chunks.push(...object);
    } else {
      chunks.push(object);
    }
    chunks.push("\nendobj\n");
  }

  const xrefOffset = partsLength(chunks);
  chunks.push(`xref\n0 ${objects.length + 1}\n`);
  chunks.push("0000000000 65535 f \n");
  for (const offset of offsets.slice(1)) {
    chunks.push(`${String(offset).padStart(10, "0")} 00000 n \n`);
  }
  chunks.push(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  return new Blob(
    chunks.map((chunk) => (typeof chunk === "string" ? chunk : toPlainArrayBuffer(chunk))),
    { type: "application/pdf" }
  );
}

function toPlainArrayBuffer(chunk: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(chunk.byteLength);
  copy.set(chunk);
  return copy.buffer;
}

function escapePdfString(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)").replace(/[^\x20-\x7E]/g, "");
}

function partsLength(parts: Array<string | Uint8Array>) {
  return parts.reduce((total, part) => total + (typeof part === "string" ? new TextEncoder().encode(part).length : part.length), 0);
}

function frequencyLabel(frequency: ChatFrequency) {
  if (frequency === "every_2_weeks") {
    return "Every 2 weeks";
  }

  if (frequency === "every_3_weeks") {
    return "Every 3 weeks";
  }

  if (frequency === "post_construction") {
    return "Post-construction cleanup";
  }

  return "First-time / one-time";
}
