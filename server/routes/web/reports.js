const express = require('express');
const router = express.Router();
const pool = require('../../db');
const PDFDocument = require('pdfkit-table');
const path = require('path');
const fs = require('fs');

// ─── ASSETS (Adjusted path) ──────────────────────────────
const ASSETS = path.join(__dirname, '..', '..', 'assets');
const LOGO = path.join(ASSETS, 'logo.png');
const WATERMARK = path.join(ASSETS, 'watermark.png');

const HAS_LOGO = fs.existsSync(LOGO);
const HAS_WATERMARK = fs.existsSync(WATERMARK);

// ─── COLORS ──────────────────────────────────────────────
const C = {
  dark: '#0F172A',
  slate: '#334155',
  muted: '#64748B',
  light: '#94A3B8',
  border: '#CBD5E1',
  bg: '#F1F5F9',
  blue: '#2563EB',
  white: '#FFFFFF',
};

// ─── FONTS (built-in only) ───────────────────────────────
const F = { regular: 'Helvetica', bold: 'Helvetica-Bold' };

// ─── HELPERS ─────────────────────────────────────────────
function drawLine(doc, x1, y, x2, color = C.border) {
  doc.save().strokeColor(color).lineWidth(0.5)
    .moveTo(x1, y).lineTo(x2, y).stroke().restore();
}

function addFooter(doc, pageNum, totalPages, PW, PH, ML, CW) {
  drawLine(doc, ML, PH - 48, PW - 55);
  doc.font(F.regular).fontSize(7).fillColor(C.light)
    .text('Computer-generated clinical protocol. Valid with verified clinic ID.',
      ML, PH - 40, { width: CW, align: 'left' });
  doc.font(F.regular).fontSize(7).fillColor(C.light)
    .text(`ProstoCalc Medical Intelligence  |  Page ${pageNum} of ${totalPages}`,
      ML, PH - 40, { width: CW, align: 'right' });
}

// ─── ROUTE ───────────────────────────────────────────────
router.get('/export_treatment_pdf', async (req, res) => {
  const { request_id } = req.query;
  if (!request_id) {
    return res.status(400).json({ status: 'error', message: 'Request ID required' });
  }

  try {
    const sql = `
      SELECT tp.*, p.full_name AS patient_name,
             d.full_name AS dentist_name, d.clinic_name
      FROM treatment_plans tp
      JOIN consultation_requests cr ON tp.request_id = cr.id
      JOIN patients p ON cr.patient_id = p.id
      JOIN dentists d ON cr.dentist_id = d.id
      WHERE tp.request_id = ?
    `;

    const [plans] = await pool.execute(sql, [request_id]);
    if (!plans.length) {
      return res.status(404).json({ status: 'error', message: 'Treatment plan not found' });
    }
    const plan = plans[0];

    const [items] = await pool.execute(`
      SELECT i.*,
             COALESCE(i.treatment_name, t.name, 'Unnamed Procedure') AS name,
             i.cost_override AS cost, t.category
      FROM treatment_plan_items i
      LEFT JOIN treatment_catalog t ON i.treatment_id = t.id
      WHERE i.plan_id = ?
      ORDER BY i.id ASC
    `, [plan.id]);

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 60, bottom: 60, left: 55, right: 55 },
    });

    let currentPage = 0;
    doc.on('page', () => currentPage++);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ClinicalProtocol_${request_id}.pdf"`);
    doc.pipe(res);

    const PW = doc.page.width;
    const PH = doc.page.height;
    const ML = 55;
    const CW = PW - ML - 55;
    const bottomMargin = 60;

    if (HAS_WATERMARK) {
      doc.save().opacity(0.04);
      doc.image(WATERMARK, PW / 2 - 150, PH / 2 - 150, { width: 300 });
      doc.restore();
    }

    doc.save().rect(0, 0, PW, 5).fill(C.blue).restore();

    let y = 40;
    if (HAS_LOGO) doc.image(LOGO, ML, y, { width: 45 });

    const titleX = HAS_LOGO ? ML + 55 : ML;
    doc.font(F.bold).fontSize(16).fillColor(C.dark).text('CLINICAL TREATMENT PROTOCOL', titleX, y + 5);
    doc.font(F.regular).fontSize(9).fillColor(C.muted).text('ProstoCalc Medical Intelligence', titleX, y + 25);
    doc.font(F.bold).fontSize(9).fillColor(C.dark).text(`Case #${request_id}`, ML, y + 5, { width: CW, align: 'right' });
    doc.font(F.regular).fontSize(8).fillColor(C.muted).text(`Issued: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, ML, y + 18, { width: CW, align: 'right' });

    y = 82;
    drawLine(doc, ML, y, PW - 55);

    y += 15;
    doc.save().roundedRect(ML, y, CW, 80, 6).fillAndStroke(C.bg, C.border).restore();
    const col1 = ML + 20;
    const col2 = ML + CW / 2 + 10;
    doc.font(F.regular).fontSize(7).fillColor(C.light).text('PATIENT', col1, y + 14);
    doc.font(F.bold).fontSize(11).fillColor(C.dark).text(plan.patient_name || 'Valued Patient', col1, y + 26);
    doc.font(F.regular).fontSize(7).fillColor(C.light).text('CLINIC', col1, y + 48);
    doc.font(F.regular).fontSize(10).fillColor(C.slate).text(plan.clinic_name || 'Verified Partner', col1, y + 59);
    doc.font(F.regular).fontSize(7).fillColor(C.light).text('CLINICIAN', col2, y + 14);
    doc.font(F.bold).fontSize(11).fillColor(C.dark).text(`Dr. ${plan.dentist_name}`, col2, y + 26);
    doc.font(F.regular).fontSize(7).fillColor(C.light).text('STATUS', col2, y + 48);
    doc.font(F.bold).fontSize(10).fillColor(C.blue).text('Active Protocol', col2, y + 59);

    y += 100;
    doc.y = y;
    doc.font(F.bold).fontSize(12).fillColor(C.dark).text('Procedural Breakdown', ML, y);
    doc.font(F.regular).fontSize(8).fillColor(C.muted).text('Sequence of clinical execution', ML, y + 16);
    y += 32; doc.y = y;

    const tableRows = items.map((item, idx) => ({
      no: String(idx + 1),
      name: item.name || 'Unnamed Procedure',
      category: item.category || 'General',
      cost: `Rs. ${parseFloat(item.cost || 0).toLocaleString('en-IN')}`,
    }));

    await doc.table({
      headers: [
        { label: '#',         property: 'no',       width: CW * 0.07, align: 'center' },
        { label: 'Procedure', property: 'name',     width: CW * 0.43 },
        { label: 'Category',  property: 'category', width: CW * 0.25 },
        { label: 'Cost',      property: 'cost',     width: CW * 0.25, align: 'right' },
      ],
      datas: tableRows.length ? tableRows : [{ no: '-', name: 'No procedures found', category: '-', cost: '-' }],
    }, { x: ML, width: CW, prepareHeader: () => doc.font(F.bold).fontSize(8).fillColor(C.muted), prepareRow: () => doc.font(F.regular).fontSize(9).fillColor(C.slate), padding: 6, columnSpacing: 5 });

    if (plan.share_cost_details) {
      doc.moveDown(1.5); drawLine(doc, ML, doc.y, PW - 55); doc.moveDown(0.8);
      const total = parseFloat(plan.total_cost || 0);
      doc.font(F.regular).fontSize(9).fillColor(C.muted).text('Total Estimated Investment', ML, doc.y, { width: CW, align: 'right' });
      doc.font(F.bold).fontSize(16).fillColor(C.dark).text(`Rs. ${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, ML, doc.y + 2, { width: CW, align: 'right' });
    }

    if (plan.share_ai_explanation && plan.ai_explanation) {
      if (doc.y > PH - bottomMargin - 180) { addFooter(doc, currentPage + 1, currentPage + 1, PW, PH, ML, CW); doc.addPage(); doc.save().rect(0, 0, PW, 5).fill(C.blue).restore(); }
      else { doc.moveDown(1.2); }
      const aiY = doc.y; doc.save().rect(ML, aiY, CW, 18).fill(C.dark).restore();
      doc.font(F.bold).fontSize(9).fillColor(C.white).text('  AI DIAGNOSTIC MAP & CLINICAL RATIONALE', ML + 8, aiY + 4);
      doc.y = aiY + 28;
      const cleaned = plan.ai_explanation.replace(/[#*`]/g, '').trim();
      doc.font(F.regular).fontSize(9).fillColor(C.slate).text(cleaned, ML, doc.y, { width: CW, align: 'justify', lineGap: 4 });
    }

    doc.moveDown(2); drawLine(doc, ML, doc.y, PW - 55); doc.moveDown(0.8);
    doc.font(F.bold).fontSize(9).fillColor(C.dark).text(`Dr. ${plan.dentist_name}`, ML, doc.y);
    doc.font(F.regular).fontSize(8).fillColor(C.muted).text('Digitally Approved', ML, doc.y + 12);
    doc.font(F.regular).fontSize(7).fillColor(C.light).text(plan.clinic_name || 'Clinic Partner', ML, doc.y + 24);

    addFooter(doc, currentPage + 1, currentPage + 1, PW, PH, ML, CW);
    doc.save().rect(18, 18, PW - 36, PH - 36).lineWidth(0.75).strokeColor(C.border).stroke().restore();
    doc.end();

  } catch (err) {
    if (!res.headersSent) res.status(500).json({ status: 'error', message: 'PDF failure' });
  }
});

module.exports = router;
