#!/usr/bin/env python3
"""Generate Scoopd SEO Audit PDF using ReportLab."""
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
import html as htmllib

OUTPUT = "/Users/piggy/scoopd/Scoopd-SEO-Audit-April-2026.pdf"

# ── Palette ────────────────────────────────────────────────────────────────────
DARK   = colors.HexColor("#0f0f0d")
CARD   = colors.HexColor("#1a1a16")
GOLD   = colors.HexColor("#c9a96e")
PRI    = colors.HexColor("#e8e4dc")
SEC    = colors.HexColor("#8a8a80")
BORDER = colors.HexColor("#2a2a26")
RED    = colors.HexColor("#c96e6e")
GREEN  = colors.HexColor("#6ec9a0")
ORANGE = colors.HexColor("#e38f09")
AMBER  = colors.HexColor("#c9b882")
WHITE  = colors.white

def mk_style(name, **kw):
    base = getSampleStyleSheet()["Normal"]
    return ParagraphStyle(name, parent=base, **kw)

# ── Paragraph styles ───────────────────────────────────────────────────────────
H1   = mk_style("H1",  fontSize=16, leading=22, textColor=GOLD,  fontName="Helvetica-Bold", spaceBefore=14, spaceAfter=4)
H2   = mk_style("H2",  fontSize=12, leading=16, textColor=WHITE, fontName="Helvetica-Bold", spaceBefore=10, spaceAfter=3)
H3   = mk_style("H3",  fontSize=10, leading=14, textColor=GOLD,  fontName="Helvetica-Bold", spaceBefore=7,  spaceAfter=2)
BODY = mk_style("BD",  fontSize=8.5,leading=13, textColor=PRI,   fontName="Helvetica")
SECD = mk_style("SC",  fontSize=8,  leading=12, textColor=SEC,   fontName="Helvetica")
BULL = mk_style("BL",  fontSize=8.5,leading=13, textColor=PRI,   fontName="Helvetica", leftIndent=12)
CODE = mk_style("CD",  fontSize=8,  leading=12, textColor=GOLD,  fontName="Courier",   backColor=CARD, leftIndent=6, rightIndent=6, spaceAfter=4, spaceBefore=2)
CTR  = mk_style("CT",  fontSize=8,  leading=12, textColor=SEC,   fontName="Helvetica", alignment=TA_CENTER)
TH   = mk_style("TH",  fontSize=8,  leading=12, textColor=GOLD,  fontName="Helvetica-Bold")
TD   = mk_style("TD",  fontSize=8,  leading=12, textColor=PRI,   fontName="Helvetica")
TDS  = mk_style("TDS", fontSize=8,  leading=12, textColor=SEC,   fontName="Helvetica")

def P(text, s=None):
    return Paragraph(str(text), s or BODY)

def SP(n=6): return Spacer(1, n)
def HR():    return HRFlowable(width="100%", thickness=0.5, color=BORDER, spaceAfter=6, spaceBefore=4)
def e(t):    return htmllib.escape(str(t))

# ── Table helper ───────────────────────────────────────────────────────────────
def make_table(rows, widths):
    """rows: list of lists of (text, style) or Paragraph objects."""
    cells = []
    for row in rows:
        cell_row = []
        for cell in row:
            if isinstance(cell, tuple):
                cell_row.append(P(e(cell[0]), cell[1]))
            elif isinstance(cell, str):
                cell_row.append(P(e(cell), TD))
            else:
                cell_row.append(cell)
        cells.append(cell_row)
    t = Table(cells, colWidths=widths)
    t.setStyle(TableStyle([
        ("BACKGROUND",  (0,0), (-1, 0), CARD),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [DARK, CARD]),
        ("VALIGN",      (0,0), (-1,-1), "TOP"),
        ("LINEBELOW",   (0,0), (-1,-2), 0.3, BORDER),
        ("BOX",         (0,0), (-1,-1), 0.5, BORDER),
        ("LEFTPADDING", (0,0), (-1,-1), 5),
        ("RIGHTPADDING",(0,0), (-1,-1), 4),
        ("TOPPADDING",  (0,0), (-1,-1), 5),
        ("BOTTOMPADDING",(0,0),(-1,-1), 5),
    ]))
    return t

# ── Score bar ─────────────────────────────────────────────────────────────────
def score_bar(score, w=100):
    filled = max(2, int(w * score / 100))
    empty  = max(2, w - filled)
    c = GREEN if score >= 70 else (ORANGE if score >= 50 else RED)
    t = Table([[P(""), P("")]], colWidths=[filled, empty])
    t.setStyle(TableStyle([
        ("BACKGROUND",   (0,0),(0,0), c),
        ("BACKGROUND",   (1,0),(1,0), BORDER),
        ("LEFTPADDING",  (0,0),(-1,-1), 0),
        ("RIGHTPADDING", (0,0),(-1,-1), 0),
        ("TOPPADDING",   (0,0),(-1,-1), 3),
        ("BOTTOMPADDING",(0,0),(-1,-1), 3),
    ]))
    return t

def score_color(score):
    if score >= 70: return "#6ec9a0"
    if score >= 50: return "#e38f09"
    return "#c96e6e"

# ── Cover background ──────────────────────────────────────────────────────────
def on_cover(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(DARK)
    canvas.rect(0, 0, A4[0], A4[1], fill=1, stroke=0)
    canvas.setFillColor(GOLD)
    canvas.rect(0, A4[1]-0.9*cm, A4[0], 0.9*cm, fill=1, stroke=0)
    canvas.rect(0, 0, A4[0], 0.4*cm, fill=1, stroke=0)
    canvas.restoreState()

def on_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(DARK)
    canvas.rect(0, 0, A4[0], A4[1], fill=1, stroke=0)
    canvas.setFillColor(GOLD)
    canvas.rect(0, A4[1]-0.4*cm, A4[0], 0.4*cm, fill=1, stroke=0)
    canvas.rect(0, 0, A4[0], 0.35*cm, fill=1, stroke=0)
    canvas.setFillColor(SEC)
    canvas.setFont("Helvetica", 7.5)
    canvas.drawString(2*cm, 0.58*cm, "scoopd.nyc  \u00b7  SEO Audit  \u00b7  April 2026")
    canvas.drawRightString(A4[0]-2*cm, 0.58*cm, f"Page {doc.page}")
    canvas.restoreState()

# ══════════════════════════════════════════════════════════════════════════════
# BUILD DOCUMENT
# ══════════════════════════════════════════════════════════════════════════════
doc = SimpleDocTemplate(OUTPUT, pagesize=A4,
    topMargin=2*cm, bottomMargin=1.8*cm, leftMargin=2*cm, rightMargin=2*cm,
    title="Scoopd SEO Audit April 2026")

story = []

# ── COVER PAGE ────────────────────────────────────────────────────────────────
story.append(SP(5*cm))
story.append(P("SCOOPD", mk_style("BR", fontSize=12, textColor=GOLD, fontName="Helvetica-Bold", letterSpacing=5, alignment=TA_CENTER)))
story.append(SP(10))
story.append(P("SEO Audit Report", mk_style("CT2", fontSize=30, leading=38, textColor=WHITE, fontName="Helvetica-Bold", alignment=TA_CENTER)))
story.append(SP(6))
story.append(P("scoopd.nyc  \u00b7  NYC Restaurant Reservation Intelligence", mk_style("CS2", fontSize=12, textColor=GOLD, fontName="Helvetica", alignment=TA_CENTER)))
story.append(SP(30))

# Score box
score_box = Table(
    [[P(f'<font size="36"><b><font color="#c96e6e">58</font></b></font><br/><font size="10" color="#8a8a80">/ 100</font>',
        mk_style("SB", fontSize=36, fontName="Helvetica-Bold", alignment=TA_CENTER, leading=46))]],
    colWidths=[4*cm], rowHeights=[4.2*cm])
score_box.setStyle(TableStyle([
    ("BOX",        (0,0),(-1,-1), 2, GOLD),
    ("BACKGROUND", (0,0),(-1,-1), CARD),
    ("VALIGN",     (0,0),(-1,-1), "MIDDLE"),
    ("ALIGN",      (0,0),(-1,-1), "CENTER"),
]))
center_wrapper = Table([[score_box]], colWidths=[17*cm])
center_wrapper.setStyle(TableStyle([("ALIGN",(0,0),(-1,-1),"CENTER"),("VALIGN",(0,0),(-1,-1),"MIDDLE")]))
story.append(center_wrapper)
story.append(SP(8))
story.append(P("Overall SEO Health Score", mk_style("OSL", fontSize=10, textColor=SEC, fontName="Helvetica", alignment=TA_CENTER)))
story.append(SP(36))
story.append(P("April 20, 2026  \u00b7  197 pages crawled  \u00b7  Next.js 16.2 / Vercel / Supabase",
    mk_style("CML", fontSize=9, textColor=SEC, fontName="Helvetica", alignment=TA_CENTER)))
story.append(PageBreak())

# ── TABLE OF CONTENTS ─────────────────────────────────────────────────────────
story.append(P("Table of Contents", H1))
story.append(HR())
toc_entries = [
    ("1",  "Executive Summary",                    "3"),
    ("2",  "Score Card",                           "3"),
    ("3",  "Technical SEO  \u2014  52/100",        "4"),
    ("4",  "On-Page SEO  \u2014  55/100",          "4"),
    ("5",  "Content Quality  \u2014  68/100",      "5"),
    ("6",  "Schema / Structured Data  \u2014  48/100","5"),
    ("7",  "Open Graph / Social  \u2014  30/100",  "6"),
    ("8",  "Performance  \u2014  62/100",          "6"),
    ("9",  "Internal Linking  \u2014  52/100",     "7"),
    ("10", "AI Search Readiness  \u2014  45/100",  "7"),
    ("11", "Prioritized Action Plan",              "8"),
    ("12", "Implementation Roadmap",               "10"),
]
toc_rows = []
for num, title, pg in toc_entries:
    toc_rows.append([
        P(num, SECD),
        P(title, mk_style(f"TOC{num}", fontSize=10, leading=16, textColor=PRI, fontName="Helvetica")),
        P(pg,   mk_style(f"PG{num}",  fontSize=10, alignment=TA_RIGHT, textColor=GOLD)),
    ])
toc_tbl = Table(toc_rows, colWidths=[1*cm, 13.5*cm, 1.5*cm])
toc_tbl.setStyle(TableStyle([
    ("VALIGN",      (0,0),(-1,-1),"TOP"),
    ("LINEBELOW",   (0,0),(-1,-2), 0.3, BORDER),
    ("TOPPADDING",  (0,0),(-1,-1), 5),
    ("BOTTOMPADDING",(0,0),(-1,-1),5),
    ("LEFTPADDING", (0,0),(-1,-1), 3),
]))
story.append(toc_tbl)
story.append(PageBreak())

# ── 1. EXECUTIVE SUMMARY ──────────────────────────────────────────────────────
story.append(P("1. Executive Summary", H1))
story.append(HR())
story.append(P(
    "Scoopd has a strong technical foundation: Vercel hosting, HTTPS, valid sitemap, Google Analytics, "
    "and JSON-LD structured data on all restaurant pages. However, four fixable issues are significantly "
    "limiting search performance: a title duplication bug affecting 194 pages, zero canonical URLs across "
    "the entire site, no social sharing images, and a cache-control misconfiguration that prevents "
    "Vercel's CDN from caching any HTML page.", BODY))
story.append(SP(6))
for line in [
    "Business Type: NYC Restaurant Reservation Intelligence Platform (SaaS / Freemium Directory)",
    "Stack: Next.js 16.2.1 App Router  \u00b7  Supabase  \u00b7  Stripe  \u00b7  Vercel Hobby",
    "Pages crawled: 197  (homepage + 194 restaurant pages + supporting pages)",
]:
    story.append(P(line, SECD))
story.append(SP(10))

def mini_list_table(rows, hcolor):
    cells = []
    for i, row in enumerate(rows):
        s = mk_style(f"ML{i}", fontSize=8,
            fontName="Helvetica-Bold" if i == 0 else "Helvetica",
            textColor=hcolor if i == 0 else PRI, leading=13)
        cells.append([P(row, s)])
    t = Table(cells, colWidths=[7.6*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND",   (0,0),(-1, 0), CARD),
        ("ROWBACKGROUNDS",(0,1),(-1,-1), [DARK, CARD]),
        ("BOX",          (0,0),(-1,-1), 0.5, BORDER),
        ("LINEBELOW",    (0,0),(-1,-2), 0.3, BORDER),
        ("LEFTPADDING",  (0,0),(-1,-1), 6),
        ("TOPPADDING",   (0,0),(-1,-1), 5),
        ("BOTTOMPADDING",(0,0),(-1,-1), 5),
    ]))
    return t

issues = [
    "TOP 5 CRITICAL ISSUES",
    '1. Title duplication on 194 pages ("| Scoopd | Scoopd")',
    "2. No canonical URLs on any page sitewide",
    "3. No OG/Twitter images  \u2014  blank social share cards",
    "4. cache-control: private, no-cache on all HTML",
    "5. No schema on homepage or /how-it-works",
]
wins = [
    "TOP 5 QUICK WINS",
    "1. Remove | Scoopd from title strings  \u2014  15 min",
    "2. Add alternates.canonical to all metadata exports",
    "3. Add priceRange to Restaurant JSON-LD (data in DB)",
    "4. Remove /signup from sitemap  \u2014  10 min",
    "5. force-static on /how-it-works  \u2014  instant CDN cache",
]
pair = Table(
    [[mini_list_table(issues, RED), P(""), mini_list_table(wins, GREEN)]],
    colWidths=[7.6*cm, 0.4*cm, 7.6*cm])
pair.setStyle(TableStyle([
    ("VALIGN",        (0,0),(-1,-1), "TOP"),
    ("LEFTPADDING",   (0,0),(-1,-1), 0),
    ("RIGHTPADDING",  (0,0),(-1,-1), 0),
    ("TOPPADDING",    (0,0),(-1,-1), 0),
    ("BOTTOMPADDING", (0,0),(-1,-1), 0),
]))
story.append(pair)

# ── 2. SCORE CARD ─────────────────────────────────────────────────────────────
story.append(SP(14))
story.append(P("2. Score Card", H1))
story.append(HR())
entries = [
    ("Technical SEO",            52, "22%"),
    ("Content Quality",          68, "23%"),
    ("On-Page SEO",              55, "20%"),
    ("Schema / Structured Data", 48, "10%"),
    ("Performance (CWV)",        62, "10%"),
    ("AI Search Readiness",      45, "10%"),
    ("Open Graph / Social",      30,  "5%"),
    ("Internal Linking",         52,  " \u2014 "),
    ("OVERALL",                  58,  ""),
]
sc_rows = []
for label, score, weight in entries:
    bold = label == "OVERALL"
    lbl_s = mk_style(f"SCL{label}", fontSize=8,
        fontName="Helvetica-Bold" if bold else "Helvetica",
        textColor=WHITE if bold else PRI)
    val_s = mk_style(f"SCV{label}", fontSize=9, fontName="Helvetica-Bold", alignment=TA_CENTER)
    sc_rows.append([
        P(label, lbl_s),
        score_bar(score),
        P(f'<font color="{score_color(score)}"><b>{score}</b></font>', val_s),
        P(weight, SECD),
    ])
sc_tbl = Table(sc_rows, colWidths=[5.5*cm, 5*cm, 1.5*cm, 1.5*cm])
sc_tbl.setStyle(TableStyle([
    ("ROWBACKGROUNDS", (0,0),(-1,-2), [DARK, CARD]),
    ("BACKGROUND",     (0,-1),(-1,-1), CARD),
    ("VALIGN",         (0,0),(-1,-1), "MIDDLE"),
    ("LINEBELOW",      (0,0),(-1,-2), 0.3, BORDER),
    ("BOX",            (0,0),(-1,-1), 0.5, BORDER),
    ("LEFTPADDING",    (0,0),(-1,-1), 6),
    ("TOPPADDING",     (0,0),(-1,-1), 5),
    ("BOTTOMPADDING",  (0,0),(-1,-1), 5),
]))
story.append(sc_tbl)
story.append(PageBreak())

# ── 3. TECHNICAL SEO ──────────────────────────────────────────────────────────
story.append(P("3. Technical SEO  \u2014  52/100", H1))
story.append(HR())
result_colors = {"PASS":"#6ec9a0", "PARTIAL":"#e38f09", "FAIL":"#c96e6e"}
tech_checks = [
    ("robots.txt",     "PASS",    "Correct. /admin, /api/, /_next/static/ blocked. Sitemap URL present."),
    ("Sitemap",        "PARTIAL", "197 URLs. Missing /drops and /plan. All lastmod timestamps identical (build time). /signup included with no search value."),
    ("Canonical URLs", "FAIL",    "Zero canonical tags on any page. Full site vulnerable to query-string duplicate content."),
    ("Indexability",   "PARTIAL", "/signup indexed with no search intent. /founding, /terms, /privacy correctly noindexed."),
    ("HTTPS/Security", "PASS",    "HTTPS enforced. HSTS present (max-age=63072000). x-powered-by: Next.js exposed (minor)."),
    ("Cache-Control",  "FAIL",    "ALL HTML pages: cache-control: private, no-cache. Vercel CDN: MISS on every request. Root cause: createSupabaseServer() forces dynamic rendering. TTFB ~250ms."),
]
hdr = [
    (("Check",  mk_style("TH1",fontSize=8,fontName="Helvetica-Bold",textColor=GOLD))),
    (("Result", mk_style("TH2",fontSize=8,fontName="Helvetica-Bold",textColor=GOLD))),
    (("Finding",mk_style("TH3",fontSize=8,fontName="Helvetica-Bold",textColor=GOLD))),
]
tech_rows = [[P("Check",TH), P("Result",TH), P("Finding",TH)]]
for chk, res, finding in tech_checks:
    rc = result_colors.get(res, "#8a8a80")
    tech_rows.append([
        P(chk, mk_style(f"TCA{chk}", fontSize=8, fontName="Helvetica-Bold", textColor=WHITE)),
        P(f'<font color="{rc}"><b>{res}</b></font>', mk_style(f"TCB{chk}", fontSize=8, fontName="Helvetica-Bold")),
        P(finding, SECD),
    ])
tech_tbl = Table(tech_rows, colWidths=[3.2*cm, 1.8*cm, 10.5*cm])
tech_tbl.setStyle(TableStyle([
    ("BACKGROUND",     (0,0),(-1, 0), CARD),
    ("ROWBACKGROUNDS", (0,1),(-1,-1), [DARK, CARD]),
    ("VALIGN",         (0,0),(-1,-1), "TOP"),
    ("LINEBELOW",      (0,0),(-1,-2), 0.3, BORDER),
    ("BOX",            (0,0),(-1,-1), 0.5, BORDER),
    ("LEFTPADDING",    (0,0),(-1,-1), 5),
    ("TOPPADDING",     (0,0),(-1,-1), 5),
    ("BOTTOMPADDING",  (0,0),(-1,-1), 5),
]))
story.append(tech_tbl)

# ── 4. ON-PAGE SEO ────────────────────────────────────────────────────────────
story.append(SP(12))
story.append(P("4. On-Page SEO  \u2014  55/100", H1))
story.append(HR())
story.append(P('<font color="#c96e6e"><b>CRITICAL  \u2014  Title Tag Duplication Bug (194 pages)</b></font>', H3))
story.append(P(
    'layout.js applies template "%s | Scoopd" to every page. Restaurant pages already return titles '
    'ending in "| Scoopd", producing:', BODY))
story.append(SP(3))
story.append(P('"Carbone Reservations  \u2014  Drop Time &amp; Booking Intelligence | Scoopd | Scoopd"', CODE))
story.append(P("Fix: Remove | Scoopd from the title string in generateMetadata. Same bug affects /drops page.", SECD))
story.append(SP(8))
story.append(P("Meta Descriptions: GOOD", H3))
story.append(P(
    "Restaurant pages with editorial notes use hand-written copy truncated to 155 chars. "
    "Auto-generated descriptions are functional. Homepage 155 chars, keyword-rich.", BODY))
story.append(SP(6))
story.append(P("Heading Structure: PARTIAL", H3))
story.append(P(
    "Each restaurant page has one H1 (restaurant name). Zero H2 tags on restaurant pages or homepage. "
    "Info sections (Release Time, Days Out, etc.) are styled divs, not semantic headings. "
    "How It Works has a correct H1 + five H2 structure.", BODY))
story.append(SP(6))
story.append(P("H1 / Title Alignment: PARTIAL", H3))
story.append(P(
    'H1 "Carbone" vs title target "Carbone Reservations \u2014 Drop Time &amp; Booking Intelligence". '
    'Including the intent keyword in the H1 strengthens relevance signals.', BODY))
story.append(PageBreak())

# ── 5. CONTENT QUALITY ────────────────────────────────────────────────────────
story.append(P("5. Content Quality  \u2014  68/100", H1))
story.append(HR())
cq_data = [
    ("Metric",                  "Value",           "Assessment"),
    ("Editorial notes",         "~140 / 192 pages","High-quality, insider-voice  \u2014  strong E-E-A-T signal"),
    ("Auto-generated pages",    "~52 pages",       "Functional but formulaic  \u2014  thin content risk over time"),
    ("How It Works",            "~2,000 words",    "Substantive editorial  \u2014  good topical authority signal"),
    ("Restaurant photos",       "0",               "No images anywhere  \u2014  missed CTR and image search opportunity"),
    ("Blog content",            "Placeholder only","Coming soon page  \u2014  no indexed content"),
    ("Author attribution",      "None",            "No bylines or author entity markup"),
    ("E-E-A-T overall",         "Moderate",        "Strong experience signals; weak authority and trust markers"),
]
cq_rows = []
for i, row in enumerate(cq_data):
    if i == 0:
        cq_rows.append([P(c, TH) for c in row])
    else:
        cq_rows.append([P(row[0], TD), P(row[1], TD), P(row[2], SECD)])
cq_tbl = Table(cq_rows, colWidths=[4*cm, 3.2*cm, 8.3*cm])
cq_tbl.setStyle(TableStyle([
    ("BACKGROUND",     (0,0),(-1, 0), CARD),
    ("ROWBACKGROUNDS", (0,1),(-1,-1), [DARK, CARD]),
    ("VALIGN",         (0,0),(-1,-1), "TOP"),
    ("LINEBELOW",      (0,0),(-1,-2), 0.3, BORDER),
    ("BOX",            (0,0),(-1,-1), 0.5, BORDER),
    ("LEFTPADDING",    (0,0),(-1,-1), 5),
    ("TOPPADDING",     (0,0),(-1,-1), 4),
    ("BOTTOMPADDING",  (0,0),(-1,-1), 4),
]))
story.append(cq_tbl)

# ── 6. SCHEMA ─────────────────────────────────────────────────────────────────
story.append(SP(12))
story.append(P("6. Schema / Structured Data  \u2014  48/100", H1))
story.append(HR())
story.append(P("JSON-LD @type:Restaurant present on all 194 restaurant pages. Homepage and /how-it-works have zero structured data.", BODY))
story.append(SP(6))
yn_c = {"YES":"#6ec9a0", "NO":"#c96e6e"}
schema_data = [
    ("Field",                            "Present", "Note"),
    ("name",                             "YES",     "Correct"),
    ("servesCuisine",                    "YES",     "Correct"),
    ("address (PostalAddress)",          "YES",     "streetAddress + postalCode from DB"),
    ("url",                              "YES",     "Correct"),
    ("description",                      "YES",     "Editorial notes or null"),
    ("priceRange",                       "NO",      "price_tier column exists  \u2014  one-line addition"),
    ("acceptsReservations",              "NO",      "Derivable from platform field"),
    ("image",                            "NO",      "No restaurant photos available"),
    ("BreadcrumbList",                   "NO",      "High ROI  \u2014  easy to add alongside Restaurant schema"),
    ("WebSite + Organization (homepage)","NO",      "Entirely missing  \u2014  SearchAction + entity identity"),
    ("FAQPage (/how-it-works)",          "NO",      "Five H2 sections map perfectly to FAQ question/answer pairs"),
]
sc_rows = []
for i, row in enumerate(schema_data):
    if i == 0:
        sc_rows.append([P(c, TH) for c in row])
    else:
        yn_color = yn_c.get(row[1], "#8a8a80")
        sc_rows.append([
            P(row[0], TD),
            P(f'<b><font color="{yn_color}">{row[1]}</font></b>', mk_style(f"YN{i}", fontSize=8, fontName="Helvetica-Bold")),
            P(row[2], SECD),
        ])
sc_tbl = Table(sc_rows, colWidths=[5*cm, 1.8*cm, 8.7*cm])
sc_tbl.setStyle(TableStyle([
    ("BACKGROUND",     (0,0),(-1, 0), CARD),
    ("ROWBACKGROUNDS", (0,1),(-1,-1), [DARK, CARD]),
    ("VALIGN",         (0,0),(-1,-1), "TOP"),
    ("LINEBELOW",      (0,0),(-1,-2), 0.3, BORDER),
    ("BOX",            (0,0),(-1,-1), 0.5, BORDER),
    ("LEFTPADDING",    (0,0),(-1,-1), 5),
    ("TOPPADDING",     (0,0),(-1,-1), 4),
    ("BOTTOMPADDING",  (0,0),(-1,-1), 4),
]))
story.append(sc_tbl)
story.append(PageBreak())

# ── 7. OG / SOCIAL ────────────────────────────────────────────────────────────
story.append(P("7. Open Graph / Social  \u2014  30/100", H1))
story.append(HR())
story.append(P('<font color="#c96e6e"><b>Critical: No OG images on any page.</b></font>  Every social share on '
    'Twitter/X, LinkedIn, iMessage, or Slack renders as a bare text card. '
    'This dramatically reduces click-through rates from social sharing.', BODY))
story.append(SP(6))
og_data = [
    ("Tag",            "Present", "Status / Issue"),
    ("og:title",       "YES",     "Correct on all pages"),
    ("og:description", "YES",     "Correct on all pages"),
    ("og:url",         "YES",     "Correct on restaurant pages"),
    ("og:type",        "YES",     "website everywhere  \u2014  should be article on restaurant pages"),
    ("og:image",       "NO",      "ABSENT on every page  \u2014  social shares render as blank text cards"),
    ("twitter:card",   "YES",     "summary  \u2014  should be summary_large_image"),
    ("twitter:image",  "NO",      "ABSENT on every page"),
]
og_rows = []
for i, row in enumerate(og_data):
    if i == 0:
        og_rows.append([P(c, TH) for c in row])
    else:
        yn_color = yn_c.get(row[1], "#8a8a80")
        og_rows.append([
            P(row[0], TD),
            P(f'<b><font color="{yn_color}">{row[1]}</font></b>', mk_style(f"OGY{i}", fontSize=8, fontName="Helvetica-Bold")),
            P(row[2], SECD),
        ])
og_tbl = Table(og_rows, colWidths=[3.5*cm, 1.8*cm, 10.2*cm])
og_tbl.setStyle(TableStyle([
    ("BACKGROUND",     (0,0),(-1, 0), CARD),
    ("ROWBACKGROUNDS", (0,1),(-1,-1), [DARK, CARD]),
    ("VALIGN",         (0,0),(-1,-1), "TOP"),
    ("LINEBELOW",      (0,0),(-1,-2), 0.3, BORDER),
    ("BOX",            (0,0),(-1,-1), 0.5, BORDER),
    ("LEFTPADDING",    (0,0),(-1,-1), 5),
    ("TOPPADDING",     (0,0),(-1,-1), 4),
    ("BOTTOMPADDING",  (0,0),(-1,-1), 4),
]))
story.append(og_tbl)
story.append(SP(6))
story.append(P(
    "Fix: Create app/opengraph-image.js (sitewide default) and app/restaurant/[slug]/opengraph-image.js "
    "using Next.js ImageResponse. Built-in, free, runs at Vercel Edge. Update twitter:card to summary_large_image.", SECD))

# ── 8. PERFORMANCE ────────────────────────────────────────────────────────────
story.append(SP(12))
story.append(P("8. Performance  \u2014  62/100", H1))
story.append(HR())
pstat_c = {"PASS":"#6ec9a0","FAIL":"#c96e6e","MARGINAL":"#e38f09","WARN":"#e38f09","N/A":"#8a8a80"}
perf_data = [
    ("Metric",              "Observed",          "Target",    "Status"),
    ("TTFB (single req.)",  "~250ms",            "< 200ms",   "MARGINAL"),
    ("HTML caching",        "MISS (all pages)",  "HIT",       "FAIL"),
    ("Font loading",        "next/font + WOFF2", "\u2014",    "PASS"),
    ("Images",              "None on site",      "\u2014",    "N/A"),
    ("Homepage HTML",       "~143 KB",           "< 100 KB",  "WARN"),
    ("Restaurant page HTML","~28 KB",            "< 50 KB",   "PASS"),
]
perf_rows = []
for i, row in enumerate(perf_data):
    if i == 0:
        perf_rows.append([P(c, TH) for c in row])
    else:
        sc = pstat_c.get(row[3], "#8a8a80")
        perf_rows.append([
            P(row[0], TD), P(row[1], TD), P(row[2], SECD),
            P(f'<font color="{sc}"><b>{row[3]}</b></font>', mk_style(f"PS{i}", fontSize=8, fontName="Helvetica-Bold")),
        ])
pf_tbl = Table(perf_rows, colWidths=[4.5*cm, 4*cm, 2.5*cm, 2.5*cm])
pf_tbl.setStyle(TableStyle([
    ("BACKGROUND",     (0,0),(-1, 0), CARD),
    ("ROWBACKGROUNDS", (0,1),(-1,-1), [DARK, CARD]),
    ("VALIGN",         (0,0),(-1,-1), "TOP"),
    ("LINEBELOW",      (0,0),(-1,-2), 0.3, BORDER),
    ("BOX",            (0,0),(-1,-1), 0.5, BORDER),
    ("LEFTPADDING",    (0,0),(-1,-1), 5),
    ("TOPPADDING",     (0,0),(-1,-1), 4),
    ("BOTTOMPADDING",  (0,0),(-1,-1), 4),
]))
story.append(pf_tbl)
story.append(SP(5))
story.append(P(
    "Root cause of cache miss: createSupabaseServer() reads cookies on every page, forcing Next.js "
    "dynamic rendering mode. Fix: export const revalidate = 3600 on restaurant pages (ISR); "
    "export const dynamic = 'force-static' on /how-it-works.", SECD))
story.append(PageBreak())

# ── 9. INTERNAL LINKING ───────────────────────────────────────────────────────
story.append(P("9. Internal Linking  \u2014  52/100", H1))
story.append(HR())
story.append(P(
    "What works: Neighborhood linking ('More in [Neighborhood]', 4 random restaurants per page), "
    "logo links to homepage sitewide, footer links to /terms and /privacy sitewide.", BODY))
story.append(SP(6))
story.append(P("What is missing:", H3))
il_gaps = [
    "No category/filter pages  \u2014  neighborhood and platform filters are client-side state. "
    "No /neighborhood/west-village or /platform/resy pages for Google to crawl.",
    "No cross-linking by difficulty or platform on restaurant pages",
    "/how-it-works has zero links to restaurant pages  \u2014  no link equity flowing to money pages",
    "No breadcrumbs in HTML",
    "Homepage has no text link to /how-it-works from the restaurant list area",
]
for gap in il_gaps:
    story.append(P(f"\u2022  {gap}", BULL))
    story.append(SP(3))

# ── 10. AI SEARCH READINESS ───────────────────────────────────────────────────
story.append(SP(8))
story.append(P("10. AI Search Readiness  \u2014  45/100", H1))
story.append(HR())
story.append(P(
    "AI search engines (Perplexity, ChatGPT with browsing, Google AI Overviews) extract and cite "
    "factual, specific, well-structured data. Scoopd's exact release times, platform data, and "
    "days-out windows are precisely the type of intelligence AI systems surface and cite.", BODY))
story.append(SP(6))
ai_stat_c = {"STRONG":"#6ec9a0","MODERATE":"#e38f09","MISSING":"#c96e6e"}
ai_data = [
    ("Signal",                   "Status",   "Recommendation"),
    ("Factual specific data",    "STRONG",   "Already present  \u2014  exact times, platform, days out"),
    ("Entity structure",         "MODERATE", "Present in editorial notes; inconsistent in auto-generated pages"),
    ("Author attribution",       "MISSING",  "Add bylines or Organization entity markup"),
    ("datePublished/Modified",   "MISSING",  "Add Article schema with dates to editorial pages"),
    ("FAQ schema",               "MISSING",  "Add FAQPage to /how-it-works  \u2014  high AI Overview eligibility"),
    ("BreadcrumbList",           "MISSING",  "Add to all restaurant pages  \u2014  hierarchical signal"),
    ("llms.txt",                 "MISSING",  "Create /llms.txt to signal AI crawler preferences"),
]
ai_rows = []
for i, row in enumerate(ai_data):
    if i == 0:
        ai_rows.append([P(c, TH) for c in row])
    else:
        sc = ai_stat_c.get(row[1], "#8a8a80")
        ai_rows.append([
            P(row[0], TD),
            P(f'<b><font color="{sc}">{row[1]}</font></b>', mk_style(f"AI{i}", fontSize=8, fontName="Helvetica-Bold")),
            P(row[2], SECD),
        ])
ai_tbl = Table(ai_rows, colWidths=[4.5*cm, 2.5*cm, 8.5*cm])
ai_tbl.setStyle(TableStyle([
    ("BACKGROUND",     (0,0),(-1, 0), CARD),
    ("ROWBACKGROUNDS", (0,1),(-1,-1), [DARK, CARD]),
    ("VALIGN",         (0,0),(-1,-1), "TOP"),
    ("LINEBELOW",      (0,0),(-1,-2), 0.3, BORDER),
    ("BOX",            (0,0),(-1,-1), 0.5, BORDER),
    ("LEFTPADDING",    (0,0),(-1,-1), 5),
    ("TOPPADDING",     (0,0),(-1,-1), 4),
    ("BOTTOMPADDING",  (0,0),(-1,-1), 4),
]))
story.append(ai_tbl)
story.append(PageBreak())

# ── 11. ACTION PLAN ───────────────────────────────────────────────────────────
story.append(P("11. Prioritized Action Plan", H1))
story.append(HR())

def action_block(heading, hcolor, rows, widths):
    story.append(P(f'<font color="{hcolor}">&#9632;</font>  {heading}', H2))
    tbl_rows = []
    for i, row in enumerate(rows):
        if i == 0:
            tbl_rows.append([P(c, TH) for c in row])
        else:
            tbl_rows.append([
                P(row[0], mk_style(f"AP0{i}{heading}", fontSize=8, fontName="Helvetica-Bold", textColor=WHITE)),
                P(row[1], BODY),
                P(row[2], SECD),
                P(row[3], mk_style(f"AP3{i}{heading}", fontSize=8, textColor=SEC)),
            ])
    t = Table(tbl_rows, colWidths=widths)
    t.setStyle(TableStyle([
        ("BACKGROUND",     (0,0),(-1, 0), CARD),
        ("ROWBACKGROUNDS", (0,1),(-1,-1), [DARK, CARD]),
        ("VALIGN",         (0,0),(-1,-1), "TOP"),
        ("LINEBELOW",      (0,0),(-1,-2), 0.3, BORDER),
        ("BOX",            (0,0),(-1,-1), 0.5, BORDER),
        ("LEFTPADDING",    (0,0),(-1,-1), 5),
        ("TOPPADDING",     (0,0),(-1,-1), 5),
        ("BOTTOMPADDING",  (0,0),(-1,-1), 5),
    ]))
    story.append(t)
    story.append(SP(10))

action_block("CRITICAL  \u2014  Fix Immediately", "#c96e6e", [
    ("#","Task","Location","Effort"),
    ("C1","Fix title duplication  \u2014  remove | Scoopd from generateMetadata title strings","app/restaurant/[slug]/page.js + app/drops/page.js","15 min"),
    ("C2","Add canonical URLs  \u2014  alternates.canonical in every metadata export","All page.js files","30 min"),
    ("C3","Create OG images  \u2014  Next.js ImageResponse for sitewide default + per-restaurant cards. Update twitter:card to summary_large_image.","app/opengraph-image.js + app/restaurant/[slug]/opengraph-image.js","2 hrs"),
    ("C4","Fix cache-control  \u2014  revalidate=3600 on restaurant pages, force-static on /how-it-works","app/restaurant/[slug]/page.js + app/how-it-works/page.js","2 hrs"),
    ("C5","Add homepage schema  \u2014  WebSite (SearchAction) + Organization JSON-LD","app/page.js","1 hr"),
], [0.8*cm, 7.5*cm, 4.2*cm, 1.5*cm])

action_block("HIGH  \u2014  Within 1 Week", "#e38f09", [
    ("#","Task","Location","Effort"),
    ("H1","Complete Restaurant JSON-LD  \u2014  add priceRange (price_tier), acceptsReservations, BreadcrumbList","app/restaurant/[slug]/page.js","30 min"),
    ("H2","Add FAQPage schema to /how-it-works  \u2014  map five H2 sections to Q&amp;A pairs","app/how-it-works/page.js","30 min"),
    ("H3","Remove /signup from sitemap + add noindex","app/signup/page.js + app/sitemap.js","10 min"),
    ("H4","Add H2 semantic headings to restaurant pages  \u2014  Booking Intelligence, About, More In","app/restaurant/[slug]/page.js","1 hr"),
    ("H5","Align restaurant H1 with target keyword  \u2014  change to [Restaurant Name] Reservations","app/restaurant/[slug]/page.js","5 min"),
], [0.8*cm, 7.5*cm, 4.2*cm, 1.5*cm])

action_block("MEDIUM  \u2014  Within 1 Month", "#c9b882", [
    ("#","Task","Detail","Effort"),
    ("M1","Create neighborhood + platform category pages","/neighborhood/[name] and /platform/[name]  \u2014  ~15-20 new indexable pages targeting 'Resy NYC restaurants', 'West Village drops'","4 hrs"),
    ("M2","Fix sitemap lastmod accuracy","Add last_updated_at to restaurants table; use real timestamps instead of build-time Date()","1 hr"),
    ("M3","Add Article schema with datePublished to /how-it-works","Signals content freshness to AI search systems","30 min"),
    ("M4","Cross-link by difficulty and platform","Add 'Other Very Hard restaurants' and 'More on Resy' sections alongside neighborhood linking","2 hrs"),
    ("M5","Create /llms.txt","Signal AI crawler preferences and site structure for Perplexity, ChatGPT","30 min"),
], [0.8*cm, 4.5*cm, 7.2*cm, 1.5*cm])

action_block("LOW  \u2014  Backlog", "#8a8a80", [
    ("#","Task","Detail","Effort"),
    ("L1","Restaurant photos","Even branded placeholders improve social CTR. Full photography unlocks Google Images traffic.","Ongoing"),
    ("L2","Blog content layer","'How to get a Carbone reservation', 'Best Resy restaurants NYC'  \u2014  high intent, each post links to 5-10 restaurant pages","Ongoing"),
    ("L3","How to get [restaurant] reservation keyword targeting","Add explicit 'How to Book' section to each restaurant page to capture high-intent queries","4 hrs"),
    ("L4","Submit sitemap to Bing Webmaster Tools","Bing powers ChatGPT web browsing  \u2014  5 min, no code changes required","5 min"),
    ("L5","Verify Google Search Console coverage","Check for Discovered but not indexed pages; dynamic rendering may cause coverage issues","Review"),
], [0.8*cm, 4.5*cm, 7.2*cm, 1.5*cm])

story.append(PageBreak())

# ── 12. IMPLEMENTATION ROADMAP ────────────────────────────────────────────────
story.append(P("12. Implementation Roadmap", H1))
story.append(HR())
pri_c = {"CRITICAL":"#c96e6e","HIGH":"#e38f09","MEDIUM":"#c9b882","LOW":"#8a8a80"}
imp_c = {"HIGH":"#6ec9a0","MEDIUM":"#e38f09","LOW":"#8a8a80"}
road = [
    ("Priority",  "Task",                                                  "Effort",  "Impact"),
    ("CRITICAL",  "Fix title duplication bug  \u2014  194 pages",          "15 min",  "HIGH"),
    ("CRITICAL",  "Add canonical URLs sitewide",                           "30 min",  "HIGH"),
    ("CRITICAL",  "Create OG images (Next.js ImageResponse)",              "2 hrs",   "HIGH"),
    ("CRITICAL",  "Fix cache-control / enable ISR",                        "2 hrs",   "HIGH"),
    ("CRITICAL",  "Add homepage + how-it-works schema",                    "1 hr",    "MEDIUM"),
    ("HIGH",      "Complete Restaurant JSON-LD (priceRange, BreadcrumbList)","30 min","MEDIUM"),
    ("HIGH",      "Add FAQPage schema to /how-it-works",                   "30 min",  "MEDIUM"),
    ("HIGH",      "Remove /signup from sitemap + noindex",                 "10 min",  "LOW"),
    ("HIGH",      "Add H2 headings + align H1 on restaurant pages",        "1 hr",    "MEDIUM"),
    ("MEDIUM",    "Create neighborhood + platform category pages",         "4 hrs",   "HIGH"),
    ("MEDIUM",    "Fix sitemap lastmod accuracy",                          "1 hr",    "LOW"),
    ("MEDIUM",    "Create /llms.txt",                                      "30 min",  "MEDIUM"),
    ("LOW",       "Blog content layer",                                    "Ongoing", "HIGH"),
    ("LOW",       "Restaurant photos",                                     "Ongoing", "HIGH"),
]
rd_rows = []
for i, row in enumerate(road):
    if i == 0:
        rd_rows.append([P(c, TH) for c in row])
    else:
        pc = pri_c.get(row[0], "#8a8a80")
        ic = imp_c.get(row[3], "#8a8a80")
        rd_rows.append([
            P(f'<font color="{pc}"><b>{row[0]}</b></font>', mk_style(f"RDP{i}", fontSize=8, fontName="Helvetica-Bold")),
            P(row[1], BODY),
            P(row[2], SECD),
            P(f'<font color="{ic}"><b>{row[3]}</b></font>', mk_style(f"RDI{i}", fontSize=8, fontName="Helvetica-Bold")),
        ])
rd_tbl = Table(rd_rows, colWidths=[2.2*cm, 9*cm, 2*cm, 2.3*cm])
rd_tbl.setStyle(TableStyle([
    ("BACKGROUND",     (0,0),(-1, 0), CARD),
    ("ROWBACKGROUNDS", (0,1),(-1,-1), [DARK, CARD]),
    ("VALIGN",         (0,0),(-1,-1), "TOP"),
    ("LINEBELOW",      (0,0),(-1,-2), 0.3, BORDER),
    ("BOX",            (0,0),(-1,-1), 0.5, BORDER),
    ("LEFTPADDING",    (0,0),(-1,-1), 5),
    ("TOPPADDING",     (0,0),(-1,-1), 4),
    ("BOTTOMPADDING",  (0,0),(-1,-1), 4),
]))
story.append(rd_tbl)
story.append(SP(20))
story.append(HR())
story.append(P("Scoopd SEO Audit  \u00b7  April 20, 2026  \u00b7  scoopd.nyc  \u00b7  Generated by Claude Code", CTR))

# ── BUILD ─────────────────────────────────────────────────────────────────────
doc.build(story, onFirstPage=on_cover, onLaterPages=on_page)
print(f"PDF written: {OUTPUT}")
