from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = ROOT / "outputs" / "us-localization-2026-08-18"
OUTPUT = OUTPUT_DIR / "uniqore-speech-analysis-demo-report.pdf"

PAGE_W, PAGE_H = A4
MARGIN_X = 18 * mm
MARGIN_TOP = 18 * mm
MARGIN_BOTTOM = 18 * mm
PURPLE = colors.HexColor("#6D5EF8")
PURPLE_SOFT = colors.HexColor("#EFECFF")
INK = colors.HexColor("#11131A")
INK_2 = colors.HexColor("#4B5168")
INK_3 = colors.HexColor("#878DA3")
LINE = colors.HexColor("#DEE2EE")
HEADER_BG = colors.HexColor("#F1F3F8")
RED_SOFT = colors.HexColor("#FDECEF")
RED = colors.HexColor("#D92F55")
GREEN_SOFT = colors.HexColor("#E6F7EF")
AMBER_SOFT = colors.HexColor("#FFF3D8")


def register_fonts():
    regular_candidates = [
        Path("/System/Library/Fonts/Supplemental/Arial.ttf"),
        Path("/System/Library/Fonts/Supplemental/Arial Unicode.ttf"),
    ]
    bold_candidates = [
        Path("/System/Library/Fonts/Supplemental/Arial Bold.ttf"),
    ]
    regular = next((p for p in regular_candidates if p.exists()), None)
    bold = next((p for p in bold_candidates if p.exists()), None)
    if regular and bold:
        pdfmetrics.registerFont(TTFont("UniqoreSans", str(regular)))
        pdfmetrics.registerFont(TTFont("UniqoreSans-Bold", str(bold)))
        return "UniqoreSans", "UniqoreSans-Bold"
    return "Helvetica", "Helvetica-Bold"


FONT, FONT_BOLD = register_fonts()
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="Brand", fontName=FONT_BOLD, fontSize=8, leading=10, textColor=PURPLE, spaceAfter=6))
styles.add(ParagraphStyle(name="TitleX", fontName=FONT_BOLD, fontSize=28, leading=32, textColor=INK, spaceAfter=7))
styles.add(ParagraphStyle(name="Subtitle", fontName=FONT, fontSize=10, leading=15, textColor=INK_2, spaceAfter=8))
styles.add(ParagraphStyle(name="SectionX", fontName=FONT_BOLD, fontSize=15, leading=19, textColor=INK, spaceBefore=10, spaceAfter=8))
styles.add(ParagraphStyle(name="BandTitle", fontName=FONT_BOLD, fontSize=18, leading=21, textColor=colors.white))
styles.add(ParagraphStyle(name="BandSub", fontName=FONT, fontSize=9.2, leading=12, textColor=colors.white))
styles.add(ParagraphStyle(name="BodyX", fontName=FONT, fontSize=9.2, leading=13, textColor=INK_2))
styles.add(ParagraphStyle(name="BodySmall", fontName=FONT, fontSize=8.2, leading=11, textColor=INK_2))
styles.add(ParagraphStyle(name="BodyBold", fontName=FONT_BOLD, fontSize=9.2, leading=13, textColor=INK))
styles.add(ParagraphStyle(name="Tiny", fontName=FONT, fontSize=7.5, leading=10, textColor=INK_3))
styles.add(ParagraphStyle(name="Kpi", fontName=FONT_BOLD, fontSize=30, leading=32, textColor=RED))


def P(value, style="BodySmall"):
    if value is None:
        return ""
    return Paragraph(str(value), styles[style])


def band(title, subtitle):
    table = Table([[Paragraph(title, styles["BandTitle"])], [Paragraph(subtitle, styles["BandSub"])]], colWidths=[PAGE_W - 2 * MARGIN_X])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PURPLE),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, 0), 9),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 3),
        ("TOPPADDING", (0, 1), (-1, 1), 2),
        ("BOTTOMPADDING", (0, 1), (-1, 1), 9),
    ]))
    return table


def styled_table(data, widths, row_fills=None, header=True, font_size=7.6):
    prepared = []
    for r, row in enumerate(data):
        prepared.append([P(cell, "BodyBold" if header and r == 0 else "BodySmall") for cell in row])
    table = Table(prepared, colWidths=widths, repeatRows=1 if header else 0, hAlign="LEFT")
    commands = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("FONTNAME", (0, 0), (-1, -1), FONT),
        ("FONTSIZE", (0, 0), (-1, -1), font_size),
        ("TEXTCOLOR", (0, 0), (-1, -1), INK_2),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LINEBELOW", (0, 0), (-1, -1), 0.55, LINE),
    ]
    if header:
        commands += [
            ("BACKGROUND", (0, 0), (-1, 0), HEADER_BG),
            ("TEXTCOLOR", (0, 0), (-1, 0), INK),
        ]
    if row_fills:
        for row, fill in row_fills.items():
            commands.append(("BACKGROUND", (0, row), (-1, row), fill))
    table.setStyle(TableStyle(commands))
    return table


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.6)
    canvas.line(MARGIN_X, 13 * mm, PAGE_W - MARGIN_X, 13 * mm)
    canvas.setFont(FONT, 7.5)
    canvas.setFillColor(INK_3)
    canvas.drawString(MARGIN_X, 8.5 * mm, "Built in Uniqore · uniqore.ai")
    canvas.drawRightString(PAGE_W - MARGIN_X, 8.5 * mm, str(doc.page))
    canvas.restoreState()


OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
doc = BaseDocTemplate(
    str(OUTPUT),
    pagesize=A4,
    leftMargin=MARGIN_X,
    rightMargin=MARGIN_X,
    topMargin=MARGIN_TOP,
    bottomMargin=MARGIN_BOTTOM,
    title="Sales Conversation Review — Demo Data",
    author="Uniqore",
    subject="Sales Conversation Intelligence for HubSpot",
)
frame = Frame(MARGIN_X, MARGIN_BOTTOM, PAGE_W - 2 * MARGIN_X, PAGE_H - MARGIN_TOP - MARGIN_BOTTOM, id="body")
doc.addPageTemplates([PageTemplate(id="report", frames=[frame], onPage=footer)])

story = []
story += [
    Paragraph("READY-TO-RUN AUTOMATION · SALES CONVERSATION INTELLIGENCE", styles["Brand"]),
    Paragraph("Sales Conversation Review", styles["TitleX"]),
    Paragraph("Sales · Current month · Jul 1–31, 2026", styles["Subtitle"]),
    Paragraph("Uniqore reviewed HubSpot customer emails, messages, notes, and available call recordings across 40 selected deals.", styles["Subtitle"]),
    Spacer(1, 6 * mm),
]
kpi = Table([
    [Paragraph("21/40", styles["Kpi"]), Paragraph("<b>The team lets prospects leave without a dated next step.</b><br/>This pattern appears across multiple reps and channels. Start your next sales meeting with deals 1288 and 1201: the same price objection, two different outcomes.", styles["BodyX"])],
], colWidths=[42 * mm, 128 * mm])
kpi.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), RED_SOFT),
    ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#F2B8C4")),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("LEFTPADDING", (0, 0), (-1, -1), 12),
    ("RIGHTPADDING", (0, 0), (-1, -1), 12),
    ("TOPPADDING", (0, 0), (-1, -1), 12),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
]))
story += [kpi, Spacer(1, 7 * mm), Paragraph("What was analyzed", styles["SectionX"])]
coverage = [
    ["Source material", "Found", "Analyzed", "Notes"],
    ["Deals", "40", "40", "Every selected deal in the period"],
    ["HubSpot notes", "96", "96", "Reviewed in full"],
    ["HubSpot emails", "12", "12", "Reviewed in full"],
    ["Customer messages", "54", "54", "Messages recorded in HubSpot"],
    ["Calls", "118", "118", "Call existence, date, and duration included"],
    ["Call recordings", "18", "14", "4 excluded under the stated demo limits"],
]
story += [styled_table(coverage, [46 * mm, 25 * mm, 32 * mm, 67 * mm]), Spacer(1, 5 * mm), Paragraph("Call content is analyzed only when a recording exists and audio processing is separately approved. Without a recording, a call remains a HubSpot activity but is not used as evidence for a conversation finding.", styles["Tiny"]), PageBreak()]

story += [band("Rep scorecards and coaching plans", "Every score links to closed deals; no score is assigned when the sample is too small"), Spacer(1, 5 * mm)]
reps = [
    ["Sales rep", "Score", "Strength", "Primary growth area", "First action"],
    ["Maya", "84 / 100", "Reframes price around customer ROI", "Securing the next step", "Set a follow-up date before ending every call"],
    ["Jordan", "77 / 100", "Consistent discovery", "Follow-through after a proposal", "Schedule a check-in within 24 hours of sending a proposal"],
    ["Alex", "63 / 100", "Explains the product clearly", "First-response speed", "Respond to new inbound leads within 30 minutes"],
    ["Sam", "51 / 100", "Re-engages after a rejection", "Pricing and next steps", "After a price objection, quantify ROI and secure a follow-up date"],
    ["Taylor", "No score", "Insufficient data", "A larger sample is needed", "Accumulate at least 4 closed deals before assigning a score"],
]
story += [styled_table(reps, [24 * mm, 22 * mm, 42 * mm, 39 * mm, 43 * mm], row_fills={1: GREEN_SOFT, 4: RED_SOFT, 5: HEADER_BG}), Spacer(1, 8 * mm), Paragraph("Sam’s first coaching plan", styles["SectionX"])]
coaching = [
    ["1 · Reframe the price objection with business value"],
    ["Deal 1288 ended at the price objection. Maya heard the same objection in deal 1201 and moved it to closed won.<br/><br/><font color='#878DA3'>Deals 1288 · 1201</font>"],
    ["2 · End every call with a dated next step"],
    ["Deals 1197 and 1233 ended without a commitment because no specific follow-up date was named.<br/><br/><font color='#878DA3'>Deals 1197 · 1233</font>"],
]
coach_table = Table([[P(row[0], "BodyBold" if i % 2 == 0 else "BodyX")] for i, row in enumerate(coaching)], colWidths=[170 * mm])
coach_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), HEADER_BG),
    ("LINEBEFORE", (0, 0), (0, -1), 2, PURPLE),
    ("LEFTPADDING", (0, 0), (-1, -1), 10),
    ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ("TOPPADDING", (0, 0), (-1, -1), 7),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
]))
story += [coach_table, PageBreak()]

story += [band("Deal-level action plan", "What to do today, what to reinforce this week, and what to measure next month"), Spacer(1, 5 * mm)]
actions = [
    ["Horizon", "Owner", "Action", "Why", "Deals", "How to verify"],
    ["Today", "Sam", "Reopen the conversation and quantify ROI", "Deal 1288 ended at “too expensive”", "1288", "A dated follow-up appears in HubSpot"],
    ["Today", "Sam", "Secure a specific follow-up date", "Two calls ended with no commitment", "1197 · 1233", "An agreed date and owner are recorded"],
    ["Today", "Alex", "Respond to inbound leads within 30 minutes", "Median response is above the team norm", "1307 · 1310", "First response is 30 minutes or less"],
    ["This week", "Jordan", "Add a check-in after every proposal", "Deals stall after proposals are sent", "1302 · 1309", "Follow-up occurs within 24 hours"],
    ["This week", "Team", "Use Maya’s response to a price objection", "The same objection led to a win", "1201", "Approach appears in 3 new conversations"],
    ["This month", "Sam", "Practice pricing and next steps on real calls", "The two weakest criteria are 4/8 and 2/8", "1288 · 1197 · 1233", "Both criteria improve next month"],
    ["This month", "Sales leader", "Measure the new team habit", "The gap appeared in 21 of 40 deals", "Entire team", "Deals without a date decline by one third"],
]
story += [styled_table(actions, [20 * mm, 21 * mm, 39 * mm, 37 * mm, 25 * mm, 28 * mm], row_fills={1: RED_SOFT, 2: RED_SOFT, 3: RED_SOFT, 4: AMBER_SOFT, 5: AMBER_SOFT, 6: PURPLE_SOFT, 7: PURPLE_SOFT}, font_size=7.2), PageBreak()]

story += [band("Supporting deals", "Examples from HubSpot customer conversations and call recordings"), Spacer(1, 5 * mm)]
evidence = [
    ["Deal", "Outcome", "Source", "Conversation / fact", "Finding", "Action"],
    ["1201 · Maya", "Closed won", "Recording + written conversation", "“Let’s run the numbers at your volume.”", "Moved from price to customer ROI", "Use as a team example"],
    ["1288 · Sam", "Closed lost", "Call recording", "“Think it over and let me know.”", "Objection unanswered; no follow-up date", "Reframe price and schedule the next contact"],
    ["1197 · Sam", "Closed lost", "Call recording", "Ended without a specific date", "The prospect does not know what happens next", "Set the date and owner"],
    ["1233 · Sam", "Closed lost", "Call recording", "“I’ll follow up with you later.”", "The rep handed control back to the prospect", "Offer two follow-up times"],
    ["1302 · Jordan", "Open", "Written conversation", "Proposal sent; no follow-up for 3 days", "The deal stalled after the proposal", "Follow up today"],
    ["1310 · Alex", "Stalled", "HubSpot call · 12 sec", "The recording contains ringing", "There is no conversation to score", "Make another contact attempt"],
]
story += [styled_table(evidence, [26 * mm, 24 * mm, 31 * mm, 34 * mm, 31 * mm, 24 * mm], row_fills={1: GREEN_SOFT, 2: RED_SOFT, 3: RED_SOFT, 4: RED_SOFT, 5: PURPLE_SOFT, 6: AMBER_SOFT}, font_size=7.2), Spacer(1, 7 * mm)]
quote = Table([[Paragraph("<b>Winning language already inside your team</b><br/><br/>“Let’s run the numbers at your volume. If the ROI is not there, we will know.”<br/><br/><font color='#878DA3'>Maya · deal 1201 · closed won</font>", styles["BodyX"]) ]], colWidths=[170 * mm])
quote.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), GREEN_SOFT),
    ("LINEBEFORE", (0, 0), (0, 0), 2.4, colors.HexColor("#169B62")),
    ("LEFTPADDING", (0, 0), (-1, -1), 12),
    ("RIGHTPADDING", (0, 0), (-1, -1), 12),
    ("TOPPADDING", (0, 0), (-1, -1), 10),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
]))
story.append(quote)

doc.build(story)
print(OUTPUT)
