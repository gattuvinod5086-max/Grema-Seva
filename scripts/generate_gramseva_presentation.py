#!/usr/bin/env python3
"""Generate world-class GramSeva executive PowerPoint presentation."""

from __future__ import annotations

import math
import subprocess
from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Inches, Pt

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "docs" / "GramSeva_Executive_Presentation.pptx"
NOTES_OUT = ROOT / "docs" / "GramSeva_Speaker_Notes.md"
SHOTS = ROOT / "docs" / "presentation-screenshots"
ASSETS = ROOT / "docs" / "assets"

# Brand palette
MAROON = RGBColor(0x67, 0x00, 0x1A)
MAROON_L = RGBColor(0x8A, 0x15, 0x38)
GOLD = RGBColor(0xCC, 0xB2, 0x52)
GREEN = RGBColor(0x00, 0x8A, 0x3B)
GREEN_OK = RGBColor(0x16, 0x80, 0x3A)
BG = RGBColor(0xFA, 0xF9, 0xF6)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
TEXT = RGBColor(0x1F, 0x29, 0x37)
MUTED = RGBColor(0x64, 0x74, 0x8B)
BORDER = RGBColor(0xE5, 0xE7, 0xEB)
RED = RGBColor(0xC6, 0x28, 0x28)
AMBER = RGBColor(0xC9, 0x8A, 0x00)
BLUE = RGBColor(0x25, 0x63, 0xEB)

SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)
FONT = "Plus Jakarta Sans"
FONT_SERIF = "Instrument Serif"

DISCLAIMER = "GramSeva prototype · Not an official Telangana Government product · Demo data labelled where shown"

notes_doc: list[str] = []


def rgb(hex6: str) -> RGBColor:
    return RGBColor(int(hex6[0:2], 16), int(hex6[2:4], 16), int(hex6[4:6], 16))


def set_bg(slide, color=BG):
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = color


def no_line(shape):
    shape.line.fill.background()


def set_font(p, *, size=18, bold=False, color=TEXT, italic=False, name=FONT):
    p.font.size = Pt(size)
    p.font.bold = bold
    p.font.italic = italic
    p.font.color.rgb = color
    p.font.name = name


def note(slide, n: int, title: str, body: str, caveat: str = ""):
    full = f"SLIDE {n} — {title}\n\n{body}"
    if caveat:
        full += f"\n\nCAVEAT: {caveat}"
    slide.notes_slide.notes_text_frame.text = full
    notes_doc.append(f"\n## Slide {n} — {title}\n\n{body}\n")
    if caveat:
        notes_doc.append(f"\n**Caveat:** {caveat}\n")


def add_accent_bar(slide):
    bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(0.07), SLIDE_H)
    bar.fill.solid()
    bar.fill.fore_color.rgb = MAROON
    no_line(bar)


def add_footer(slide, text: str = DISCLAIMER):
    box = slide.shapes.add_textbox(Inches(0.55), Inches(7.08), Inches(12.2), Inches(0.32))
    p = box.text_frame.paragraphs[0]
    p.text = text
    set_font(p, size=8, color=MUTED)


def add_slide_num(slide, n: int, total: int = 25):
    box = slide.shapes.add_textbox(Inches(12.5), Inches(7.08), Inches(0.7), Inches(0.32))
    p = box.text_frame.paragraphs[0]
    p.text = f"{n}/{total}"
    set_font(p, size=8, color=MUTED)
    p.alignment = PP_ALIGN.RIGHT


def add_headline(slide, text: str, sub: str | None = None, *, y=0.42, serif=False):
    tb = slide.shapes.add_textbox(Inches(0.65), Inches(y), Inches(12.0), Inches(1.2))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = text
    set_font(p, size=34 if len(text) < 60 else 30, bold=True, color=MAROON, name=FONT_SERIF if serif else FONT)
    if sub:
        p2 = tf.add_paragraph()
        p2.text = sub
        set_font(p2, size=18, color=MUTED)
        p2.space_before = Pt(6)


def add_label(slide, text: str, x: float, y: float, color=AMBER):
    box = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(2.5), Inches(0.3))
    p = box.text_frame.paragraphs[0]
    p.text = text.upper()
    set_font(p, size=9, bold=True, color=color)


def add_card(slide, x, y, w, h, title: str | None = None, body: str | None = None,
             border=MAROON, fill=WHITE, title_color=MAROON, body_size=14):
    sh = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
    sh.fill.solid()
    sh.fill.fore_color.rgb = fill
    sh.line.color.rgb = border
    sh.line.width = Pt(1.25)
    if title or body:
        tf = sh.text_frame
        tf.word_wrap = True
        tf.margin_left = Pt(10)
        tf.margin_top = Pt(8)
        if title:
            tf.paragraphs[0].text = title
            set_font(tf.paragraphs[0], size=13, bold=True, color=title_color)
        if body:
            p = tf.add_paragraph() if title else tf.paragraphs[0]
            p.text = body
            set_font(p, size=body_size, color=TEXT)
    return sh


def add_flow(slide, labels: list[str], y: float, *, box_w=1.35, gap=0.14, h=0.62,
             fill=WHITE, border=MAROON, size=11, arrow="→"):
    x = 0.65
    for i, label in enumerate(labels):
        add_card(slide, x, y, box_w, h, title=label.replace("\n", " "), border=border if i in (0, len(labels)-1) else GOLD, fill=fill)
        x += box_w + gap
        if i < len(labels) - 1:
            arr = slide.shapes.add_textbox(Inches(x - gap + 0.01), Inches(y + 0.12), Inches(0.18), Inches(0.35))
            arr.text_frame.paragraphs[0].text = arrow
            set_font(arr.text_frame.paragraphs[0], size=14, color=MAROON if i == 0 else GOLD)


def add_kpi(slide, x, y, label: str, value: str = "—", border=GOLD, demo=True):
    add_card(slide, x, y, 2.15, 1.05, title=label, body=value if not demo else "DEMO", border=border, body_size=22)
    if demo:
        add_label(slide, "Illustrative", x + 0.1, y + 0.78, AMBER)


def add_image(slide, path: Path, x, y, w, h, label: str | None = "Working prototype"):
    if path.exists():
        slide.shapes.add_picture(str(path), Inches(x), Inches(y), width=Inches(w), height=Inches(h))
    else:
        add_card(slide, x, y, w, h, title="Prototype UI", body="Run scripts/capture_screenshots.mjs\nfor real screenshots", border=BORDER, fill=RGBColor(0xF3, 0xF4, 0xF6))
    if label:
        add_label(slide, label, x, y - 0.28, GREEN)


def add_phone_mockup(slide, img: Path, x=8.2, y=1.35, w=4.2, h=5.4):
    frame = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x - 0.12), Inches(y - 0.12), Inches(w + 0.24), Inches(h + 0.24))
    frame.fill.solid()
    frame.fill.fore_color.rgb = TEXT
    no_line(frame)
    notch = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x + w/2 - 0.35), Inches(y - 0.04), Inches(0.7), Inches(0.12))
    notch.fill.solid()
    notch.fill.fore_color.rgb = RGBColor(0x37, 0x41, 0x51)
    no_line(notch)
    inner = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
    inner.fill.solid()
    inner.fill.fore_color.rgb = WHITE
    no_line(inner)
    add_image(slide, img, x + 0.05, y + 0.05, w - 0.1, h - 0.1)


def shot(name: str) -> Path:
    return SHOTS / f"{name}.png"


def build(prs: Presentation, blank):
    total = 26  # 25 + appendix

    # ── SLIDE 1 COVER ──
    s = prs.slides.add_slide(blank)
    set_bg(s, BG)
    motif = ASSETS / "telangana-motif.svg"
    if motif.exists():
        try:
            s.shapes.add_picture(str(motif), Inches(9.5), Inches(0.8), width=Inches(3.2))
        except Exception:
            pass
    band = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, Inches(6.72), SLIDE_W, Inches(0.78))
    band.fill.solid()
    band.fill.fore_color.rgb = MAROON
    no_line(band)
    tb = s.shapes.add_textbox(Inches(0.75), Inches(1.6), Inches(8.5), Inches(2.2))
    tf = tb.text_frame
    tf.paragraphs[0].text = "GRAMSEVA"
    set_font(tf.paragraphs[0], size=56, bold=True, color=MAROON, name=FONT_SERIF)
    p = tf.add_paragraph()
    p.text = "Digital Village Governance Platform for Telangana"
    set_font(p, size=24, color=TEXT)
    p = tf.add_paragraph()
    p.text = "Connecting citizens, Panchayats and administration through one digital experience."
    set_font(p, size=17, color=MUTED)
    add_flow(s, ["Citizen", "Panchayat", "Mandal", "District", "State"], 5.15, box_w=2.0, gap=0.22)
    add_label(s, "Prototype concept", 0.75, 6.45, GOLD)
    add_footer(s)
    note(s, 1, "Cover",
         "Open with GramSeva as a proposed digital village governance platform. Emphasise one digital layer connecting citizen to state. Do NOT claim official endorsement.",
         "Not an official Telangana Government application.")

    # ── SLIDE 2 HUMAN PROBLEM ──
    s = prs.slides.add_slide(blank)
    set_bg(s)
    add_accent_bar(s)
    add_headline(s, "Village problems are simple to describe — but often complex to follow through.")
    add_flow(s, ["Problem", "Phone", "Office", "Paper", "Follow-up", "Uncertainty"], 2.15, box_w=1.75, h=0.75)
    add_card(s, 0.65, 3.35, 11.8, 1.1, body="Opportunity: create a clear digital path from reporting to resolution.", border=GREEN, fill=RGBColor(0xF0, 0xFD, 0xF4))
    add_card(s, 8.5, 1.55, 4.0, 3.5, title="Today", body="Phone\nOffice visit\nPaper forms\nMessages\nInformal channels", border=BORDER)
    add_footer(s)
    add_slide_num(s, 2, total)
    note(s, 2, "Human Problem", "Frame as opportunity. Do not criticise existing systems.", "Not blaming government departments.")

    # ── SLIDE 3 BIG IDEA ──
    s = prs.slides.add_slide(blank)
    set_bg(s)
    add_accent_bar(s)
    add_headline(s, "GramSeva creates one digital layer around village governance.")
    cx, cy = 6.65, 3.85
    center = s.shapes.add_shape(MSO_SHAPE.OVAL, Inches(cx - 1.1), Inches(cy - 1.1), Inches(2.2), Inches(2.2))
    center.fill.solid()
    center.fill.fore_color.rgb = MAROON
    center.line.color.rgb = GOLD
    center.line.width = Pt(2.5)
    center.text_frame.paragraphs[0].text = "GramSeva"
    set_font(center.text_frame.paragraphs[0], size=20, bold=True, color=WHITE)
    center.text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER
    modules = ["Grievances", "Panchayat", "Welfare", "Emergency", "News", "AI", "Citizen Services", "Village Analytics"]
    for i, m in enumerate(modules):
        ang = i * (2 * math.pi / len(modules)) - math.pi / 2
        mx = cx + 3.6 * math.cos(ang) - 0.95
        my = cy + 2.2 * math.sin(ang) - 0.28
        add_card(s, mx, my, 1.9, 0.56, title=m, border=GREEN, title_color=TEXT)
    add_footer(s)
    add_slide_num(s, 3, total)
    note(s, 3, "Big Idea", "One platform concept with modular services. All shown are prototype capabilities.")

    # ── SLIDE 4 HERO WORKFLOW ──
    s = prs.slides.add_slide(blank)
    set_bg(s)
    add_accent_bar(s)
    add_headline(s, "From a citizen's voice to a measurable resolution.")
    steps = [
        ("Citizen", ""), ("Report", "Voice / Text / Photo"), ("Understand", "Category + Priority"),
        ("Route", "Village + Dept"), ("Assign", "Responsible official"), ("Resolve", "Evidence"),
        ("Confirm", "Citizen feedback"), ("Measure", "Village analytics"),
    ]
    x = 0.45
    for title, sub in steps:
        add_card(s, x, 2.05, 1.42, 1.15, title=title, body=sub, border=MAROON, body_size=9)
        x += 1.55
    add_footer(s)
    add_slide_num(s, 4, total)
    note(s, 4, "Hero Workflow", "This is the core product story. Walk left to right in under 60 seconds.")

    # ── SLIDE 5 PRODUCT ──
    s = prs.slides.add_slide(blank)
    set_bg(s)
    add_accent_bar(s)
    add_headline(s, "One citizen. One village context. One simple experience.")
    actions = ["Report a problem", "Track my issue", "Emergency help", "Welfare schemes", "Village news", "Ask Vikas Sahayak"]
    y = 1.55
    for a in actions:
        add_card(s, 0.65, y, 4.8, 0.58, title=a, border=BORDER, title_color=TEXT)
        y += 0.68
    add_phone_mockup(s, shot("01-home-mobile"))
    add_footer(s)
    add_slide_num(s, 5, total)
    note(s, 5, "Product", "Show real prototype UI. Demo data only.", "Screenshots are working prototype, not production deployment.")

    # ── SLIDE 6 TELUGU + AI ──
    s = prs.slides.add_slide(blank)
    set_bg(s)
    add_accent_bar(s)
    add_headline(s, "Digital governance should speak the citizen's language.")
    add_card(s, 0.65, 1.65, 11.8, 0.85, title="Telugu voice / text", body='"మా వీధిలో మూడు రోజులుగా తాగునీరు రావడం లేదు"', border=GOLD, title_color=MAROON)
    add_flow(s, ["AI-assisted understanding", "Water · High Priority", "Ward / Village routing"], 2.85, box_w=3.5, h=0.72)
    add_label(s, "AI-assisted prototype", 0.65, 3.85, AMBER)
    add_card(s, 0.65, 4.15, 11.8, 0.65, body="Do not claim production AI accuracy. Prototype requires API configuration.", border=AMBER, fill=RGBColor(0xFF, 0xFB, 0xEB))
    add_footer(s)
    add_slide_num(s, 6, total)
    note(s, 6, "Telugu + AI", "Accessibility is the message.", "AI-assisted prototype — not production NLP deployment.")

    # ── SLIDE 7 OFFICIAL VIEW ──
    s = prs.slides.add_slide(blank)
    set_bg(s)
    add_accent_bar(s)
    add_headline(s, "Officials see what needs attention — at a glance.")
    kpis = ["Open", "In Progress", "Resolved", "SLA Risk", "Critical"]
    x = 0.65
    for k in kpis:
        add_kpi(s, x, 1.55, k, border=RED if k in ("SLA Risk", "Critical") else MAROON)
        x += 2.25
    add_image(s, shot("07-official-dashboard"), 0.65, 2.85, 7.5, 3.55)
    add_card(s, 8.45, 2.85, 4.1, 3.55, title="Priority queue (DEMO)", body="Water · Ward 4 · 18h · At risk\nRoads · Ward 2 · 6h · In progress\nSanitation · Ward 7 · 2d · SLA breach", border=BORDER, body_size=12)
    add_footer(s)
    add_slide_num(s, 7, total)
    note(s, 7, "Official View", "Consolidated visibility for panchayat and admin roles.", "KPI numbers are illustrative demo data.")

    # ── SLIDE 8 ACCOUNTABILITY ──
    s = prs.slides.add_slide(blank)
    set_bg(s)
    add_accent_bar(s)
    add_headline(s, "Every issue has a visible owner, status and next step.")
    stages = ["Submitted", "Acknowledged", "Assigned", "In Progress", "Evidence", "Resolved", "Citizen Confirmed"]
    x = 0.45
    for i, st in enumerate(stages):
        col = GREEN if i >= 5 else (AMBER if i >= 3 else MAROON)
        add_card(s, x, 2.0, 1.55, 0.72, title=st, border=col)
        x += 1.68
    add_card(s, 0.65, 3.15, 11.8, 1.0, body="Actor · Role · Timestamp · Action · Previous state → New state", border=BORDER)
    add_image(s, shot("03-issues-mobile"), 9.2, 4.35, 3.2, 2.35, label="Prototype screen")
    add_footer(s)
    add_slide_num(s, 8, total)
    note(s, 8, "Accountability", "Audit trail is a governance differentiator.", "Timeline implemented in prototype.")

    # ── SLIDE 9 ESCALATION ──
    s = prs.slides.add_slide(blank)
    set_bg(s)
    add_accent_bar(s)
    add_headline(s, "When action is delayed, the workflow can escalate.", sub="Proposed configurable workflow — not official Telangana policy")
    levels = ["Ward", "Panchayat", "Mandal", "District"]
    y = 2.0
    for i, lv in enumerate(levels):
        add_card(s, 5.2, y, 2.8, 0.72, title=lv, border=RED if i >= 2 else AMBER)
        if i < len(levels) - 1:
            arr = s.shapes.add_textbox(Inches(6.35), Inches(y + 0.82), Inches(0.5), Inches(0.35))
            arr.text_frame.paragraphs[0].text = "↓ Escalate"
            set_font(arr.text_frame.paragraphs[0], size=11, color=RED if i >= 1 else AMBER)
        y += 1.05
    add_card(s, 0.65, 2.0, 4.0, 3.5, title="SLA signals", body="Within SLA\nApproaching deadline\nSLA breached\n→ Next level notified", border=GOLD)
    add_footer(s)
    add_slide_num(s, 9, total)
    note(s, 9, "Escalation", "Configurable rules for pilot evaluation.", "Not claimed as official government policy.")

    # ── SLIDE 10 CITIZEN CONFIRMATION ──
    s = prs.slides.add_slide(blank)
    set_bg(s)
    add_accent_bar(s)
    add_headline(s, "Resolved by the system is not the same as resolved for the citizen.")
    add_card(s, 1.5, 2.0, 4.2, 1.2, title="OFFICIAL", body='"Marked Resolved"', border=MAROON)
    add_card(s, 7.5, 2.0, 4.2, 1.2, title="CITIZEN", body='"Was your problem actually resolved?"', border=GREEN)
    arr = s.shapes.add_textbox(Inches(5.9), Inches(2.35), Inches(1.0), Inches(0.4))
    arr.text_frame.paragraphs[0].text = "→"
    set_font(arr.text_frame.paragraphs[0], size=28, color=GOLD)
    add_flow(s, ["YES → Closed", "NO → Reopen", "Escalate", "Continue"], 3.75, box_w=2.5, h=0.65)
    add_footer(s)
    add_slide_num(s, 10, total)
    note(s, 10, "Citizen Confirmation", "Major governance differentiator. Implemented in prototype.")

    # ── SLIDE 11 VILLAGE OUTCOMES ──
    s = prs.slides.add_slide(blank)
    set_bg(s)
    add_accent_bar(s)
    add_headline(s, "The goal is not more complaints. The goal is better villages.")
    add_card(s, 0.65, 1.55, 4.0, 2.0, title="Village Development Score", body="82 / 100\n↑ 7% vs prior period", border=GREEN, title_color=MAROON, body_size=28)
    add_label(s, "Illustrative demo data", 0.65, 3.65, AMBER)
    cats = [("Water", 91), ("Roads", 82), ("Sanitation", 84), ("Electricity", 93), ("Welfare", 76), ("Resolution", 80)]
    x, y = 5.0, 1.65
    for i, (c, v) in enumerate(cats):
        add_card(s, x + (i % 3) * 2.5, y + (i // 3) * 0.85, 2.2, 0.65, title=f"{c}: {v}", border=GOLD, title_color=TEXT)
    add_image(s, shot("08-analytics"), 5.0, 3.55, 7.5, 2.85)
    add_footer(s)
    add_slide_num(s, 11, total)
    note(s, 11, "Village Outcomes", "Long-term vision: measure improvement.", "All numbers are DEMO — not Telangana statistics.")

    # ── SLIDE 12 TELANGANA SCALE ──
    s = prs.slides.add_slide(blank)
    set_bg(s)
    add_accent_bar(s)
    add_headline(s, "One model can connect the state from village to district.")
    levels = [("TELANGANA", "State performance"), ("DISTRICT", "Trends"), ("MANDAL", "Pending issues"),
              ("VILLAGE", "Development score"), ("WARD", "Complaints"), ("ISSUE", "Individual case")]
    y = 1.45
    for name, desc in levels:
        add_card(s, 4.8, y, 3.5, 0.62, title=name, border=MAROON, title_color=MAROON)
        dt = s.shapes.add_textbox(Inches(8.5), Inches(y + 0.12), Inches(3.5), Inches(0.4))
        dt.text_frame.paragraphs[0].text = desc
        set_font(dt.text_frame.paragraphs[0], size=13, color=MUTED)
        if y < 5.0:
            arr = s.shapes.add_textbox(Inches(6.35), Inches(y + 0.68), Inches(0.4), Inches(0.3))
            arr.text_frame.paragraphs[0].text = "↓"
            set_font(arr.text_frame.paragraphs[0], size=16, color=GOLD)
        y += 0.82
    if motif.exists():
        try:
            s.shapes.add_picture(str(motif), Inches(0.65), Inches(1.5), width=Inches(3.5))
        except Exception:
            pass
    add_footer(s)
    add_slide_num(s, 12, total)
    note(s, 12, "Telangana Scale", "Geography hierarchy implemented in prototype.", "Telangana Admin map in full-stack mode.")

    # ── SLIDE 13 EMERGENCY ──
    s = prs.slides.add_slide(blank)
    set_bg(s)
    add_accent_bar(s)
    add_headline(s, "When something is urgent, help should be one tap away.")
    urgent = ["Police", "Ambulance", "Fire", "Hospital"]
    x = 0.65
    for u in urgent:
        add_card(s, x, 1.55, 2.7, 0.95, title=u, border=RED, title_color=RED)
        x += 2.95
    local = ["Water", "Electricity", "Panchayat"]
    x = 0.65
    for u in local:
        add_card(s, x, 2.75, 2.7, 0.75, title=u, border=GOLD)
        x += 2.95
    add_phone_mockup(s, shot("04-emergency-mobile"), 8.3, 1.45, 4.0, 5.1)
    add_card(s, 0.65, 3.85, 7.2, 0.85, body="Location: District · Mandal · Village\nProduction requires verified official directories", border=BORDER)
    add_footer(s)
    add_slide_num(s, 13, total)
    note(s, 13, "Emergency", "Module implemented. Demo contacts in local mode.", "Do not use unverified numbers in production.")

    # ── SLIDE 14 NEWS ──
    s = prs.slides.add_slide(blank)
    set_bg(s)
    add_accent_bar(s)
    add_headline(s, "Give every village a trusted information channel.")
    add_card(s, 0.65, 1.55, 5.8, 4.5, title="GRAMSEVA ANNOUNCEMENTS", body="Official village & panchayat information\nWelfare camps · Emergency alerts", border=MAROON)
    add_card(s, 6.85, 1.55, 5.8, 4.5, title="TELANGANA LIVE NEWS (External)", body="External news with source attribution\nNOT government communication", border=BLUE, title_color=BLUE)
    add_image(s, shot("10-news"), 0.65, 4.0, 5.5, 1.8, label=None)
    add_footer(s)
    add_slide_num(s, 14, total)
    note(s, 14, "News", "Clearly separate official vs external content.")

    # ── SLIDE 15 WELFARE ──
    s = prs.slides.add_slide(blank)
    set_bg(s)
    add_accent_bar(s)
    add_headline(s, "Finding a scheme should be easier than finding a website.")
    add_label(s, "Current prototype", 0.65, 1.45, GREEN)
    add_card(s, 0.65, 1.75, 5.5, 1.0, body="Citizens browse Telangana welfare scheme information", border=GREEN)
    add_label(s, "Future direction", 0.65, 3.0, AMBER)
    add_flow(s, ["Citizen", "Profile", "Schemes", "Documents", "Apply", "Guidance"], 3.35, box_w=1.75, h=0.65)
    add_image(s, shot("09-welfare"), 6.8, 1.55, 5.8, 4.5)
    add_footer(s)
    add_slide_num(s, 15, total)
    note(s, 15, "Welfare", "Hub exists. Eligibility engine is future.", "Do not claim eligibility engine is live.")

    # ── SLIDE 16 VIKAS SAHAYAK ──
    s = prs.slides.add_slide(blank)
    set_bg(s)
    add_accent_bar(s)
    add_headline(s, "An AI assistant for village-level questions.", sub="Vikas Sahayak · వికాస్ సహాయక్")
    qs = ['"Report a water problem"', '"What schemes may apply to me?"', '"Where is my nearest PHC?"', '"Show my pending complaints"']
    y = 1.55
    for q in qs:
        add_card(s, 0.65, y, 5.2, 0.55, title=q, border=BORDER, title_color=TEXT, body_size=12)
        y += 0.62
    add_phone_mockup(s, shot("05-vikas-mobile"), 8.0, 1.35, 4.2, 5.4)
    add_card(s, 0.65, 5.0, 11.8, 0.55, body="AI assists citizens; it does not replace official decision-making.", border=MUTED, fill=RGBColor(0xF8, 0xFA, 0xFC))
    add_footer(s)
    add_slide_num(s, 16, total)
    note(s, 16, "Vikas Sahayak", "Prototype requires API key.", "Assistant, not decision-maker.")

    # ── SLIDE 17 ECOSYSTEM ──
    s = prs.slides.add_slide(blank)
    set_bg(s)
    add_accent_bar(s)
    add_headline(s, "One platform. Multiple citizen needs.")
    center = s.shapes.add_shape(MSO_SHAPE.OVAL, Inches(5.55), Inches(2.85), Inches(2.0), Inches(2.0))
    center.fill.solid()
    center.fill.fore_color.rgb = MAROON
    center.text_frame.paragraphs[0].text = "GRAMSEVA"
    set_font(center.text_frame.paragraphs[0], size=16, bold=True, color=WHITE)
    center.text_frame.paragraphs[0].alignment = PP_ALIGN.CENTER
    wheel = ["Grievances", "Panchayat", "Welfare", "Emergency", "News", "AI", "Analytics", "Citizen Services"]
    for i, w in enumerate(wheel):
        ang = i * (2 * math.pi / len(wheel)) - math.pi / 2
        mx = 6.55 + 3.5 * math.cos(ang) - 0.85
        my = 3.85 + 2.0 * math.sin(ang) - 0.25
        add_card(s, mx, my, 1.7, 0.5, title=w, border=GOLD, title_color=TEXT)
    add_footer(s)
    add_slide_num(s, 17, total)
    note(s, 17, "Ecosystem", "Breadth of modules in one concept.")

    # ── SLIDE 18 TECHNOLOGY ──
    s = prs.slides.add_slide(blank)
    set_bg(s)
    add_accent_bar(s)
    add_headline(s, "Cloud-native architecture designed for modular growth.")
    layers = ["Citizen / Official", "GramSeva Application", "API", "Cloud Platform", "Database + File Storage"]
    y = 1.55
    for lv in layers:
        add_card(s, 4.2, y, 4.8, 0.72, title=lv, border=MAROON if y == 1.55 else GOLD, title_color=MAROON if y == 1.55 else TEXT)
        if y < 4.5:
            arr = s.shapes.add_textbox(Inches(6.35), Inches(y + 0.78), Inches(0.4), Inches(0.3))
            arr.text_frame.paragraphs[0].text = "↓"
            set_font(arr.text_frame.paragraphs[0], size=14, color=GOLD)
        y += 0.95
    add_card(s, 0.65, 1.55, 3.2, 4.5, title="Stack", body="React · TypeScript\nHono · Cloudflare Workers\nD1 · R2\nOAuth · Zod", border=BORDER, body_size=13)
    add_footer(s)
    add_slide_num(s, 18, total)
    note(s, 18, "Technology", "One technical slide only. Credible but not developer-focused.")

    # ── SLIDE 19 TRUST ──
    s = prs.slides.add_slide(blank)
    set_bg(s)
    add_accent_bar(s)
    add_headline(s, "Digital governance requires trust as much as technology.")
    pillars = ["Role-based access", "Audit trail", "Data validation", "Privacy", "Verified information", "Secure authentication"]
    x, y = 0.65, 1.55
    for i, p in enumerate(pillars):
        add_card(s, x + (i % 3) * 4.0, y + (i // 3) * 1.15, 3.6, 0.85, title=p, border=GREEN, title_color=MAROON)
    add_card(s, 0.65, 4.15, 11.8, 0.7, body="Production deployment would require formal security, privacy and governance review.", border=BORDER)
    add_footer(s)
    add_slide_num(s, 19, total)
    note(s, 19, "Trust", "Six pillars. No paragraphs on slide.")

    # ── SLIDE 20 SCALE ──
    s = prs.slides.add_slide(blank)
    set_bg(s)
    add_accent_bar(s)
    add_headline(s, "Start with one village. Scale only after proving the model.")
    add_flow(s, ["Village", "Mandal", "District", "State"], 2.2, box_w=2.5, h=0.85, arrow="→")
    add_card(s, 0.65, 3.5, 11.8, 0.9, body="Location model supports District · Mandal · Village · Ward\nFormal load testing not yet completed", border=BORDER)
    add_footer(s)
    add_slide_num(s, 20, total)
    note(s, 20, "Scale", "Design intent — not claimed as tested at state scale.")

    # ── SLIDE 21 PILOT ──
    s = prs.slides.add_slide(blank)
    set_bg(s)
    add_accent_bar(s)
    add_headline(s, "A focused pilot can turn the prototype into measurable evidence.")
    phases = [
        ("PHASE 1", "1–3 villages", "Validate adoption · workflow · SLA · emergency · welfare"),
        ("PHASE 2", "Selected mandal", "Measure resolution time · satisfaction · workload · usage"),
        ("PHASE 3", "District evaluation", "Assess scalability · integration · governance · security"),
        ("PHASE 4", "State consideration", "Only after rigorous evaluation"),
    ]
    y = 1.45
    for title, scope, validate in phases:
        add_card(s, 0.65, y, 12.0, 1.05, title=f"{title} — {scope}", body=validate, border=GOLD, title_color=MAROON)
        y += 1.2
    add_footer(s)
    add_slide_num(s, 21, total)
    note(s, 21, "Pilot", "Most important ask slide. NOT immediate statewide deployment.")

    # ── SLIDE 22 KPIs ──
    s = prs.slides.add_slide(blank)
    set_bg(s)
    add_accent_bar(s)
    add_headline(s, "Measure outcomes, not activity.", sub="Proposed pilot KPIs — no fabricated numbers")
    kpis = ["Citizen adoption", "Acknowledgement time", "Resolution time", "SLA compliance",
            "Citizen-confirmed resolution", "Repeat complaints", "Satisfaction", "Welfare engagement"]
    x, y = 0.65, 1.65
    for i, k in enumerate(kpis):
        add_card(s, x + (i % 4) * 3.05, y + (i // 4) * 0.85, 2.85, 0.65, title=k, border=GREEN, title_color=TEXT)
    add_footer(s)
    add_slide_num(s, 22, total)
    note(s, 22, "KPIs", "Baseline established during Phase 1 pilot.")

    # ── SLIDE 23 STATUS ──
    s = prs.slides.add_slide(blank)
    set_bg(s)
    add_accent_bar(s)
    add_headline(s, "What works today — and what requires partnership.")
    cols = [
        ("WORKING PROTOTYPE", GREEN, ["Grievances", "Telangana geography", "Welfare hub", "AI assistant", "Official dashboard", "SLA / timeline", "Emergency", "News", "Analytics", "Cloud architecture"]),
        ("PRE-PRODUCTION", AMBER, ["Verified emergency data", "AI validation", "Bilingual completeness", "Security review", "Production data setup", "Mobile packaging"]),
        ("FUTURE / INTEGRATION", BLUE, ["Govt grievance integration", "Department APIs", "Official data sources", "Notifications", "Live disaster feeds"]),
    ]
    x = 0.55
    for title, color, items in cols:
        sh = add_card(s, x, 1.45, 4.05, 5.2, title=title, border=color, title_color=color)
        tf = sh.text_frame
        for item in items:
            p = tf.add_paragraph()
            p.text = f"• {item}"
            set_font(p, size=11, color=TEXT)
        x += 4.2
    add_footer(s)
    add_slide_num(s, 23, total)
    note(s, 23, "Current Status", "Be honest. Do not overstate.", "Prototype vs production clearly separated.")

    # ── SLIDE 24 WHY ──
    s = prs.slides.add_slide(blank)
    set_bg(s)
    add_accent_bar(s)
    add_headline(s, "Why GramSeva?", serif=True)
    points = [
        "Telangana-first village context",
        "Citizen-first digital experience",
        "End-to-end grievance accountability",
        "Village-level visibility and analytics",
        "Designed for future integration",
    ]
    y = 1.65
    for i, pt in enumerate(points, 1):
        tb = s.shapes.add_textbox(Inches(0.85), Inches(y), Inches(11.5), Inches(0.65))
        p = tb.text_frame.paragraphs[0]
        p.text = f"{i}.  {pt}"
        set_font(p, size=22, color=TEXT)
        y += 0.85
    add_footer(s)
    add_slide_num(s, 24, total)
    note(s, 24, "Why GramSeva", "Five concise differentiators.")

    # ── SLIDE 25 CLOSING ──
    s = prs.slides.add_slide(blank)
    set_bg(s, MAROON)
    tb = s.shapes.add_textbox(Inches(0.75), Inches(1.2), Inches(11.5), Inches(3.5))
    tf = tb.text_frame
    tf.paragraphs[0].text = "GRAMSEVA"
    set_font(tf.paragraphs[0], size=52, bold=True, color=WHITE, name=FONT_SERIF)
    p = tf.add_paragraph()
    p.text = '"Every village has problems.\nThe opportunity is to make every problem visible, actionable and measurable."'
    set_font(p, size=22, color=WHITE)
    p.space_before = Pt(20)
    add_flow(s, ["Citizen", "Panchayat", "Mandal", "District", "State"], 4.85, box_w=2.0, gap=0.22, fill=RGBColor(0x55, 0x00, 0x15), border=GOLD)
    tag = s.shapes.add_textbox(Inches(0.75), Inches(6.0), Inches(11.5), Inches(0.5))
    tag.text_frame.paragraphs[0].text = '"Report. Resolve. Inform. Empower."'
    set_font(tag.text_frame.paragraphs[0], size=18, italic=True, color=GOLD)
    add_label(s, "Prototype / demonstration concept", 0.75, 6.55, GOLD)
    add_footer(s, "GramSeva — proposed digital village governance platform for Telangana")
    add_slide_num(s, 25, total)
    note(s, 25, "Closing", "Vision statement. Invite pilot discussion.", "Reiterate prototype status.")

    # ── SLIDE 26 APPENDIX — EXECUTIVE SUMMARY ──
    s = prs.slides.add_slide(blank)
    set_bg(s)
    add_accent_bar(s)
    add_headline(s, "Executive Summary", sub="Appendix — one-page overview")
    rows = [
        ("WHAT", "Digital village governance platform for Telangana"),
        ("WHY", "Improve citizen access, grievance visibility and village-level coordination"),
        ("HOW", "Citizen + Panchayat + administrative workflow in one experience"),
        ("CURRENT", "Working prototype with grievances, welfare, emergency, AI, analytics"),
        ("NEXT", "Focused pilot in 1–3 villages with measurable KPIs"),
        ("FUTURE", "Integration with authorized government systems after validation"),
    ]
    y = 1.55
    for label, val in rows:
        add_card(s, 0.65, y, 2.0, 0.72, title=label, border=MAROON, title_color=MAROON)
        add_card(s, 2.85, y, 9.6, 0.72, title=val, border=BORDER, title_color=TEXT)
        y += 0.85
    add_footer(s)
    add_slide_num(s, 26, total)
    note(s, 26, "Executive Summary", "Leave-behind overview for officials.", "Appendix slide — optional for presentation.")


def main():
    global notes_doc
    notes_doc = [
        "# GramSeva Executive Presentation — Speaker Notes\n\n",
        "**Audience:** Senior Telangana Government officials, IAS officers, policymakers.\n\n",
        "**Tone:** Premium public-sector digital transformation. Prototype — not official product.\n\n",
        "---\n",
    ]

    prs = Presentation()
    prs.slide_width = SLIDE_W
    prs.slide_height = SLIDE_H
    blank = prs.slide_layouts[6]

    build(prs, blank)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    tmp = OUT.with_suffix(".tmp.pptx")
    prs.save(str(tmp))
    tmp.replace(OUT)
    subprocess.run(["xattr", "-cr", str(OUT)], check=False)

    with open(NOTES_OUT, "w", encoding="utf-8") as f:
        f.writelines(notes_doc)
        f.write("\n---\n\n## Do NOT Claim\n\n")
        f.write("- Official Telangana Government product or endorsement\n")
        f.write("- Live government system integration (unless verified)\n")
        f.write("- Fake statistics, user counts, or deployment results\n")
        f.write("- Government partnerships or approvals\n")
        f.write("- Production-grade AI accuracy without validation\n")

    shots_found = sum(1 for p in SHOTS.glob("*.png") if p.exists()) if SHOTS.exists() else 0
    print(f"Created: {OUT}")
    print(f"Speaker notes: {NOTES_OUT}")
    print(f"Slides: {len(prs.slides)} (25 main + 1 appendix)")
    print(f"Screenshots used: {shots_found} (capture: npm run dev && .pptx-venv/bin/python scripts/capture_screenshots.py)")


if __name__ == "__main__":
    main()
