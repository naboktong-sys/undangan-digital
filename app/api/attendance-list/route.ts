import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage, PDFImage } from "pdf-lib";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formatEventDate } from "@/lib/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    const width = font.widthOfTextAtSize(test, fontSize);

    if (width <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);

  return lines.length > 0 ? lines : [""];
}

// pdf-lib (font standar) hanya mendukung karakter Latin-1; buang karakter lain agar tidak error
function pdfSafe(text: string): string {
  return text.replace(/[^\x20-\x7E\u00A0-\u00FF\u2013\u2014\u2022]/g, "");
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const eventId = req.nextUrl.searchParams.get("eventId");
  const event = eventId
    ? await prisma.event.findUnique({ where: { id: eventId } })
    : await prisma.event.findFirst({ orderBy: { createdAt: "desc" } });
  if (!event) return NextResponse.json({ error: "Acara tidak ditemukan" }, { status: 404 });

  const eventName = pdfSafe(event.name);
  const eventDateLabel = pdfSafe(formatEventDate(event.startsAt));
  const eventPlace = pdfSafe(event.location.split(",")[0].trim());

  const guests = await prisma.guest.findMany({
    where: { eventId: event.id },
    orderBy: { name: "asc" },
  });

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 50;
  const fullHeaderHeight = 145;
  const continuationHeaderHeight = 55;
  const footerSpace = 40;
  const fontSize = 11;
  const lineHeight = 15;
  const rowPaddingY = 16;
  const cellPaddingX = 10;
  const borderColor = rgb(0.15, 0.15, 0.15);
  const gridThickness = 0.8; // satu ketebalan & warna untuk semua garis tabel agar konsisten

  // Launching & Bedah Buku: No, Nama Lengkap, Asal Instansi, No. HP, Tanda Tangan (konfirmasi hadir di tempat)
  // + logo SAS (kiri) dan LPOI (kanan) di header.
  // Acara lain (Tasyakuran): tetap memakai kolom No, Nama, Instansi, Tanda Tangan.
  const isBook = event.type === "BEDAH_BUKU";

  async function loadLogo(fileName: string): Promise<Uint8Array | null> {
    try {
      return await readFile(path.join(process.cwd(), "public", fileName));
    } catch {
      // Di Vercel, file public/ bisa tidak ikut ter-bundle ke function; ambil lewat URL situs sendiri.
      try {
        const res = await fetch(new URL(`/${fileName}`, req.nextUrl.origin));
        if (res.ok) return new Uint8Array(await res.arrayBuffer());
      } catch {
        // abaikan: PDF tetap dibuat tanpa logo
      }
      return null;
    }
  }

  let logoLeft: PDFImage | null = null;
  let logoRight: PDFImage | null = null;
  if (isBook) {
    const [sasBytes, lpoiBytes] = await Promise.all([
      loadLogo("sas-logo-green.png"),
      loadLogo("lpoi-logo.png"),
    ]);
    if (sasBytes) logoLeft = await pdfDoc.embedPng(sasBytes);
    if (lpoiBytes) logoRight = await pdfDoc.embedPng(lpoiBytes);
  }
  const logoSize = 62;
  const contentWidth = pageWidth - margin * 2;

  const columns = isBook
    ? [
        { key: "no", label: "No.", width: 34 },
        { key: "name", label: "Nama Lengkap", width: 140 },
        { key: "category", label: "Asal Instansi", width: 110 },
        { key: "phone", label: "No. HP", width: 95 },
        { key: "sign", label: "Tanda Tangan", width: 0 },
      ]
    : [
        { key: "no", label: "No.", width: 34 },
        { key: "name", label: "Nama", width: 215 },
        { key: "category", label: "Instansi", width: 140 },
        { key: "sign", label: "Tanda Tangan", width: 0 },
      ];
  // Kolom terakhir (Tanda Tangan) mengisi sisa lebar tabel.
  const lastCol = columns[columns.length - 1];
  lastCol.width = contentWidth - columns.slice(0, -1).reduce((s, c) => s + c.width, 0);

  const colX: number[] = [];
  let acc = margin;
  for (const col of columns) {
    colX.push(acc);
    acc += col.width;
  }
  const tableRight = margin + columns.reduce((s, c) => s + c.width, 0);

  const rows = guests.map((g, idx) => {
    const nameLines = wrapText(pdfSafe(g.name), font, fontSize, columns[1].width - cellPaddingX * 2);
    const categoryLines = wrapText(pdfSafe(g.category || "-"), font, fontSize, columns[2].width - cellPaddingX * 2);
    const phoneLines = isBook
      ? wrapText(pdfSafe(g.phone || "-"), font, fontSize, columns[3].width - cellPaddingX * 2)
      : [];
    const maxLines = Math.max(nameLines.length, categoryLines.length, phoneLines.length, 1);
    // Baris Bedah Buku dibuat lebih tinggi agar cukup ruang untuk tanda tangan.
    const rowHeight = Math.max(maxLines * lineHeight + rowPaddingY, isBook ? 46 : 38);
    return { index: idx + 1, nameLines, categoryLines, phoneLines, rowHeight };
  });

  function centeredFirstLineY(rowTop: number, rowHeight: number, numLines: number) {
    const blockHeight = numLines * lineHeight;
    return rowTop - (rowHeight - blockHeight) / 2 - lineHeight * 0.78;
  }

  // boxTop = y posisi garis horizontal tepat DI ATAS baris header kolom.
  // Garis vertikal header sekarang dimulai persis dari boxTop, bukan dari headerRowTop+8,
  // supaya tersambung langsung ke garis horizontal di atasnya (tidak "lepas"/mengambang).
  function drawColumnHeaderRow(page: PDFPage, y: number, boxTop: number) {
    const headerRowTop = y;
    for (let i = 0; i < columns.length; i++) {
      const label = columns[i].label;
      const cx = colX[i] + columns[i].width / 2;
      page.drawText(label, {
        x: cx - fontBold.widthOfTextAtSize(label, 11) / 2,
        y: y - 13,
        size: 11,
        font: fontBold,
      });
    }
    y -= 24;
    page.drawLine({ start: { x: margin, y }, end: { x: tableRight, y }, thickness: gridThickness, color: borderColor });

    let vx = margin;
    for (const col of columns) {
      page.drawLine({
        start: { x: vx, y: boxTop },
        end: { x: vx, y },
        thickness: gridThickness,
        color: borderColor,
      });
      vx += col.width;
    }
    page.drawLine({
      start: { x: tableRight, y: boxTop },
      end: { x: tableRight, y },
      thickness: gridThickness,
      color: borderColor,
    });

    return y;
  }

  function drawFullHeader(page: PDFPage) {
    let y = pageHeight - margin;

    if (logoLeft) {
      page.drawImage(logoLeft, { x: margin, y: y - 52, width: logoSize, height: logoSize });
    }
    if (logoRight) {
      page.drawImage(logoRight, { x: tableRight - logoSize, y: y - 52, width: logoSize, height: logoSize });
    }

    page.drawText("DAFTAR HADIR", {
      x: pageWidth / 2 - fontBold.widthOfTextAtSize("DAFTAR HADIR", 17) / 2,
      y,
      size: 17,
      font: fontBold,
    });
    y -= 22;

    // Kalau ada logo, batasi lebar subjudul supaya tidak menabrak logo.
    const subtitleMaxWidth =
      logoLeft || logoRight ? tableRight - margin - (logoSize + 20) * 2 : tableRight - margin - 20;
    const subtitleLines = wrapText(eventName, font, 11, subtitleMaxWidth);
    for (const line of subtitleLines.slice(0, 2)) {
      page.drawText(line, {
        x: pageWidth / 2 - font.widthOfTextAtSize(line, 11) / 2,
        y,
        size: 11,
        font,
      });
      y -= 14;
    }
    y -= 2;

    const meta = `${eventDateLabel}  \u2022  ${eventPlace}`;
    page.drawText(meta, {
      x: pageWidth / 2 - fontItalic.widthOfTextAtSize(meta, 9.5) / 2,
      y,
      size: 9.5,
      font: fontItalic,
      color: rgb(0.35, 0.35, 0.35),
    });
    y -= 22;

    page.drawLine({ start: { x: margin, y }, end: { x: tableRight, y }, thickness: gridThickness, color: borderColor });

    const boxTop = y; // garis vertikal header akan mulai persis dari sini
    y -= 16;

    return drawColumnHeaderRow(page, y, boxTop);
  }

  function drawContinuationHeader(page: PDFPage, pageNum: number) {
    let y = pageHeight - margin;

    const label = `Daftar Hadir \u2014 Lanjutan (Halaman ${pageNum})`;
    page.drawText(label, {
      x: margin,
      y,
      size: 10,
      font: fontItalic,
      color: rgb(0.4, 0.4, 0.4),
    });
    y -= 14;
    page.drawLine({ start: { x: margin, y }, end: { x: tableRight, y }, thickness: gridThickness, color: borderColor });

    const boxTop = y; // garis vertikal header akan mulai persis dari sini
    y -= 16;

    return drawColumnHeaderRow(page, y, boxTop);
  }

  const usableHeightPage1 = pageHeight - margin * 2 - fullHeaderHeight - footerSpace;
  const usableHeightOther = pageHeight - margin * 2 - continuationHeaderHeight - footerSpace;

  const pages: (typeof rows)[] = [];
  let currentPageRows: typeof rows = [];
  let usedHeight = 0;
  let limit = usableHeightPage1;

  for (const row of rows) {
    if (usedHeight + row.rowHeight > limit && currentPageRows.length > 0) {
      pages.push(currentPageRows);
      currentPageRows = [];
      usedHeight = 0;
      limit = usableHeightOther;
    }
    currentPageRows.push(row);
    usedHeight += row.rowHeight;
  }
  if (currentPageRows.length > 0) pages.push(currentPageRows);
  if (pages.length === 0) pages.push([]);

  const totalPages = pages.length;

  pages.forEach((pageRows, pageIdx) => {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageIdx === 0 ? drawFullHeader(page) : drawContinuationHeader(page, pageIdx + 1);
    const tableTop = y;

    for (const row of pageRows) {
      const rowTop = y;
      y -= row.rowHeight;

      const noText = String(row.index);
      page.drawText(noText, {
        x: colX[0] + columns[0].width / 2 - font.widthOfTextAtSize(noText, fontSize) / 2,
        y: centeredFirstLineY(rowTop, row.rowHeight, 1),
        size: fontSize,
        font,
      });

      const nameStartY = centeredFirstLineY(rowTop, row.rowHeight, row.nameLines.length);
      row.nameLines.forEach((line, i) => {
        page.drawText(line, {
          x: colX[1] + cellPaddingX,
          y: nameStartY - i * lineHeight,
          size: fontSize,
          font,
        });
      });

      const catStartY = centeredFirstLineY(rowTop, row.rowHeight, row.categoryLines.length);
      row.categoryLines.forEach((line, i) => {
        page.drawText(line, {
          x: colX[2] + cellPaddingX,
          y: catStartY - i * lineHeight,
          size: fontSize,
          font,
        });
      });

      if (isBook) {
        const phoneStartY = centeredFirstLineY(rowTop, row.rowHeight, row.phoneLines.length);
        row.phoneLines.forEach((line, i) => {
          page.drawText(line, {
            x: colX[3] + cellPaddingX,
            y: phoneStartY - i * lineHeight,
            size: fontSize,
            font,
          });
        });
      }

      page.drawLine({ start: { x: margin, y }, end: { x: tableRight, y }, thickness: gridThickness, color: borderColor });
    }

    let vx = margin;
    for (const col of columns) {
      page.drawLine({ start: { x: vx, y: tableTop }, end: { x: vx, y }, thickness: gridThickness, color: borderColor });
      vx += col.width;
    }
    page.drawLine({ start: { x: tableRight, y: tableTop }, end: { x: tableRight, y }, thickness: gridThickness, color: borderColor });

    const footerText = `Halaman ${pageIdx + 1} dari ${totalPages}`;
    page.drawText(footerText, {
      x: pageWidth / 2 - fontItalic.widthOfTextAtSize(footerText, 8.5) / 2,
      y: margin - 15,
      size: 8.5,
      font: fontItalic,
      color: rgb(0.5, 0.5, 0.5),
    });
  });

  const pdfBytes = await pdfDoc.save();
  const fileSlug =
    event.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "acara";

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="daftar-hadir-${fileSlug}.pdf"`,
    },
  });
}