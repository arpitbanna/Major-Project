const express = require('express');
const router = express.Router();
const pdfmake = require('pdfmake');
const { supabase, isConfigured } = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

// Configure pdfmake with standard Helvetica font
const fonts = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  }
};
pdfmake.setFonts(fonts);
pdfmake.setUrlAccessPolicy(() => false);
pdfmake.setLocalAccessPolicy(() => true);

// Protect all report routes with authentication
router.use(requireAuth);

/**
 * Check DB configuration
 */
function checkDbReady(req, res, next) {
  if (!isConfigured || !supabase) {
    return res.status(503).json({
      status: 'error',
      message: 'Database service is not configured. Cannot generate reports.'
    });
  }
  next();
}

/**
 * GET /api/reports/handover/:id/pdf
 * Generates official PDF for a single shift handover log
 */
router.get('/handover/:id/pdf', checkDbReady, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: handover, error } = await supabase
      .from('shift_handovers')
      .select(`
        *,
        outgoing:outgoing_incharge_id (id, full_name, role, designation),
        incoming:incoming_incharge_id (id, full_name, role, designation),
        acknowledged_by:acknowledged_by_id (id, full_name, role, designation)
      `)
      .eq('id', id)
      .single();

    if (error || !handover) {
      return res.status(404).json({
        status: 'error',
        message: 'Shift handover record not found'
      });
    }

    const docDefinition = {
      defaultStyle: { font: 'Helvetica', fontSize: 10, color: '#1e293b' },
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 40],
      content: [
        // Header
        {
          columns: [
            {
              text: 'COALSAFE COLLIERY MANAGEMENT',
              fontSize: 16,
              bold: true,
              color: '#0f172a'
            },
            {
              text: `STATUS: ${handover.status.toUpperCase()}`,
              alignment: 'right',
              fontSize: 11,
              bold: true,
              color: handover.status === 'Acknowledged' ? '#166534' : '#854d0e'
            }
          ]
        },
        {
          text: 'Statutory Shift Handover Logbook Entry • CMPDI / DGMS Standard Format',
          fontSize: 9,
          color: '#64748b',
          margin: [0, 2, 0, 15]
        },
        {
          canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#cbd5e1' }],
          margin: [0, 0, 0, 15]
        },

        // Shift Information Table
        {
          table: {
            widths: ['25%', '25%', '25%', '25%'],
            body: [
              [
                { text: 'Shift Date:', bold: true, fillColor: '#f8fafc' },
                { text: handover.shift_date },
                { text: 'Shift Type:', bold: true, fillColor: '#f8fafc' },
                { text: handover.shift_type }
              ],
              [
                { text: 'Mine Section:', bold: true, fillColor: '#f8fafc' },
                { text: handover.mine_section },
                { text: 'Record ID:', bold: true, fillColor: '#f8fafc' },
                { text: handover.id.substring(0, 13) + '...', fontSize: 8 }
              ]
            ]
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#cbd5e1',
            vLineColor: () => '#cbd5e1'
          },
          margin: [0, 0, 0, 15]
        },

        // Personnel Signatures Section
        {
          table: {
            widths: ['50%', '50%'],
            body: [
              [
                { text: 'OUTGOING SHIFT IN-CHARGE', bold: true, fillColor: '#f1f5f9', fontSize: 9 },
                { text: 'INCOMING SHIFT IN-CHARGE / ACKNOWLEDGEMENT', bold: true, fillColor: '#f1f5f9', fontSize: 9 }
              ],
              [
                {
                  stack: [
                    { text: `Name: ${handover.outgoing?.full_name || 'Staff'}` },
                    { text: `Role: ${handover.outgoing?.role || 'Shift In-charge'}` },
                    { text: `Designation: ${handover.outgoing?.designation || 'Staff'}` },
                    { text: `Submitted: ${handover.submitted_at ? new Date(handover.submitted_at).toLocaleString() : 'Draft'}` }
                  ],
                  margin: [0, 4, 0, 4]
                },
                {
                  stack: [
                    { text: `Name: ${handover.acknowledged_by?.full_name || handover.incoming?.full_name || 'Awaiting Sign-off'}` },
                    { text: `Role: ${handover.acknowledged_by?.role || handover.incoming?.role || 'Shift In-charge'}` },
                    { text: `Status: ${handover.status === 'Acknowledged' ? 'Verified & Accepted' : 'Pending Review'}` },
                    { text: `Acknowledged: ${handover.acknowledged_at ? new Date(handover.acknowledged_at).toLocaleString() : 'Pending'}` }
                  ],
                  margin: [0, 4, 0, 4]
                }
              ]
            ]
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#cbd5e1',
            vLineColor: () => '#cbd5e1'
          },
          margin: [0, 0, 0, 15]
        },

        // Operational Sections
        { text: '1. PRODUCTION & COAL OUTPUT SUMMARY', bold: true, fontSize: 10, margin: [0, 6, 0, 4] },
        {
          text: handover.production_summary || 'No production details recorded.',
          margin: [0, 0, 0, 12],
          fontSize: 9,
          lineHeight: 1.2
        },

        { text: '2. EQUIPMENT & MACHINERY STATUS', bold: true, fontSize: 10, margin: [0, 6, 0, 4] },
        {
          text: handover.equipment_status || 'All machinery reported in normal operating condition.',
          margin: [0, 0, 0, 12],
          fontSize: 9,
          lineHeight: 1.2
        },

        { text: '3. SAFETY OBSERVATIONS & MINE ATMOSPHERE / STRATA', bold: true, fontSize: 10, margin: [0, 6, 0, 4] },
        {
          text: handover.safety_observations || 'No safety incidents, abnormal gases or roof control issues reported.',
          margin: [0, 0, 0, 12],
          fontSize: 9,
          lineHeight: 1.2
        },

        { text: '4. PENDING WORK / INCOMPLETE JOBS FOR NEXT SHIFT', bold: true, fontSize: 10, margin: [0, 6, 0, 4] },
        {
          text: handover.pending_work || 'None specified.',
          margin: [0, 0, 0, 12],
          fontSize: 9,
          lineHeight: 1.2
        },

        { text: '5. SPECIAL REMARKS & STATUTORY INSTRUCTIONS', bold: true, fontSize: 10, margin: [0, 6, 0, 4] },
        {
          text: handover.remarks || 'None.',
          margin: [0, 0, 0, 20],
          fontSize: 9,
          lineHeight: 1.2
        },

        // Immutability Seal Footer
        {
          canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#94a3b8' }],
          margin: [0, 10, 0, 8]
        },
        {
          columns: [
            {
              text: 'CoalSafe Mining System • DGMS Immutability Guard Active',
              fontSize: 8,
              color: '#64748b'
            },
            {
              text: `Generated on ${new Date().toLocaleString()}`,
              alignment: 'right',
              fontSize: 8,
              color: '#64748b'
            }
          ]
        }
      ]
    };

    const doc = pdfmake.createPdf(docDefinition);
    const buffer = await doc.getBuffer();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Shift_Handover_${handover.shift_date}_${handover.id.substring(0, 8)}.pdf"`
    );
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (err) {
    console.error('[Reports API] Handover PDF generation error:', err.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate PDF report.'
    });
  }
});

/**
 * GET /api/reports/handovers/pdf
 * Generates consolidated handover summary report PDF
 */
router.get('/handovers/pdf', checkDbReady, async (req, res) => {
  try {
    const { data: handovers, error } = await supabase
      .from('shift_handovers')
      .select(`
        id, shift_date, shift_type, mine_section, status, submitted_at, acknowledged_at,
        outgoing:outgoing_incharge_id (full_name),
        incoming:incoming_incharge_id (full_name)
      `)
      .order('shift_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) throw error;

    const rows = [
      [
        { text: 'Date', bold: true, fillColor: '#f1f5f9' },
        { text: 'Shift', bold: true, fillColor: '#f1f5f9' },
        { text: 'Section', bold: true, fillColor: '#f1f5f9' },
        { text: 'Outgoing In-charge', bold: true, fillColor: '#f1f5f9' },
        { text: 'Incoming In-charge', bold: true, fillColor: '#f1f5f9' },
        { text: 'Status', bold: true, fillColor: '#f1f5f9' }
      ]
    ];

    (handovers || []).forEach((h) => {
      rows.push([
        { text: h.shift_date, fontSize: 8 },
        { text: h.shift_type.split(' ')[0], fontSize: 8 },
        { text: h.mine_section, fontSize: 8 },
        { text: h.outgoing?.full_name || 'Staff', fontSize: 8 },
        { text: h.incoming?.full_name || 'Pending', fontSize: 8 },
        { text: h.status, fontSize: 8, bold: true }
      ]);
    });

    const docDefinition = {
      defaultStyle: { font: 'Helvetica', fontSize: 9, color: '#1e293b' },
      pageSize: 'A4',
      pageOrientation: 'landscape',
      pageMargins: [40, 40, 40, 40],
      content: [
        {
          columns: [
            { text: 'COALSAFE — SHIFT HANDOVER LOGBOOK REGISTER', fontSize: 14, bold: true },
            { text: `Report Date: ${new Date().toLocaleDateString()}`, alignment: 'right', fontSize: 9 }
          ]
        },
        {
          text: 'Consolidated shift handover verification register across active mine sections.',
          fontSize: 8,
          color: '#64748b',
          margin: [0, 2, 0, 15]
        },
        {
          table: {
            headerRows: 1,
            widths: ['15%', '15%', '20%', '20%', '20%', '10%'],
            body: rows
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#cbd5e1',
            vLineColor: () => '#cbd5e1'
          }
        }
      ]
    };

    const doc = pdfmake.createPdf(docDefinition);
    const buffer = await doc.getBuffer();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Shift_Handovers_Logbook_Report.pdf"');
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (err) {
    console.error('[Reports API] Handovers list PDF error:', err.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate handovers summary report.'
    });
  }
});

/**
 * GET /api/reports/hazards/pdf
 * Generates Safety Management Plan (SMP) Hazard Register PDF
 */
router.get('/hazards/pdf', checkDbReady, async (req, res) => {
  try {
    const { data: hazards, error } = await supabase
      .from('hazards_smp')
      .select(`
        id, title, mine_section, hazard_category, likelihood, severity, risk_score, risk_level, status, created_at,
        reported_by:reported_by_id (full_name),
        verified_by:verified_by_id (full_name),
        safety_actions (id, status)
      `)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) throw error;

    const rows = [
      [
        { text: 'Category', bold: true, fillColor: '#f1f5f9' },
        { text: 'Hazard Title & Section', bold: true, fillColor: '#f1f5f9' },
        { text: 'Risk Score (5x5)', bold: true, fillColor: '#f1f5f9' },
        { text: 'Status', bold: true, fillColor: '#f1f5f9' },
        { text: 'Actions', bold: true, fillColor: '#f1f5f9' },
        { text: 'Reported By', bold: true, fillColor: '#f1f5f9' }
      ]
    ];

    (hazards || []).forEach((h) => {
      const totalActions = (h.safety_actions || []).length;
      const completed = (h.safety_actions || []).filter((a) => a.status === 'Completed').length;
      rows.push([
        { text: h.hazard_category, fontSize: 8 },
        {
          stack: [
            { text: h.title, bold: true, fontSize: 8 },
            { text: `Section: ${h.mine_section}`, fontSize: 7, color: '#64748b' }
          ]
        },
        { text: `${h.risk_score} (${h.risk_level})`, bold: true, fontSize: 8 },
        { text: h.status, fontSize: 8 },
        { text: `${completed}/${totalActions} done`, fontSize: 8 },
        { text: h.reported_by?.full_name || 'Staff', fontSize: 8 }
      ]);
    });

    const docDefinition = {
      defaultStyle: { font: 'Helvetica', fontSize: 9, color: '#1e293b' },
      pageSize: 'A4',
      pageOrientation: 'landscape',
      pageMargins: [40, 40, 40, 40],
      content: [
        {
          columns: [
            { text: 'DGMS SAFETY MANAGEMENT PLAN — WORKPLACE HAZARD REGISTER', fontSize: 13, bold: true },
            { text: `Report Date: ${new Date().toLocaleDateString()}`, alignment: 'right', fontSize: 9 }
          ]
        },
        {
          text: 'Formal risk assessment register using 5x5 matrix evaluation and corrective mitigation tracking.',
          fontSize: 8,
          color: '#64748b',
          margin: [0, 2, 0, 15]
        },
        {
          table: {
            headerRows: 1,
            widths: ['18%', '32%', '14%', '12%', '10%', '14%'],
            body: rows
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#cbd5e1',
            vLineColor: () => '#cbd5e1'
          }
        }
      ]
    };

    const doc = pdfmake.createPdf(docDefinition);
    const buffer = await doc.getBuffer();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Safety_Management_Plan_Register.pdf"');
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (err) {
    console.error('[Reports API] Hazards PDF error:', err.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate SMP Hazard Register report.'
    });
  }
});

module.exports = router;
