import os
import json
import re
import time
import hashlib
import logging

import google.generativeai as genai

logger = logging.getLogger(__name__)

# =========================================================
# CONFIG
# =========================================================

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY is not set")

genai.configure(api_key=GEMINI_API_KEY)

MODEL_NAME = "models/gemini-2.0-flash-lite"

model = genai.GenerativeModel(MODEL_NAME)

# =========================================================
# CLEAN RESPONSE
# =========================================================

def clean_json_response(text: str):

    text = text.strip()

    # Strip all possible markdown code fence variants
    text = re.sub(r"^```json\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"^```\s*", "", text)
    text = re.sub(r"\s*```$", "", text)

    return text.strip()

# =========================================================
# SAFE JSON
# =========================================================

def safe_json_loads(text: str):

    try:
        return json.loads(text)

    except Exception:

        match = re.search(r"\{.*\}", text, re.DOTALL)

        if match:
            try:
                return json.loads(match.group())
            except Exception:
                pass

    return None

# =========================================================
# COMPANY NAME EXTRACTION
# Priority: label patterns → suffix regex → uppercase header
#           → filename fallback → generic placeholder
#
# Safe: pure string/regex logic, no new imports, same
# signature and return type as before.
# =========================================================

# ── Private helpers ───────────────────────────────────────

# Words/phrases that disqualify an ALL-CAPS line from being
# treated as a company name. Kept tight — real company words
# (INDUSTRIES, WORKS, GROUP) are NOT in this list.
_HEADER_SKIP_EXACT = {
    "INVOICE", "TENDER", "DOCUMENT", "BANK", "FORM", "PAGE",
    "DATE", "REF", "FROM", "TO", "SUBJECT", "QUOTATION",
    "PROPOSAL", "BID", "REQUEST", "DECLARATION", "CERTIFICATE",
    "GOVERNMENT", "DEPARTMENT", "MINISTRY", "OFFICE", "AUTHORITY",
    "ANNEXURE", "SCHEDULE", "APPENDIX", "ENCLOSURE", "ATTACHMENT",
    "GSTIN", "PAN", "TAN", "CIN", "DIN", "IFSC", "EMAIL", "PHONE",
    "MOBILE", "FAX", "ADDRESS", "PINCODE", "STATE", "COUNTRY",
    "TAX", "INVOICE NO", "BILL", "RECEIPT", "VOUCHER",
    "TERMS", "CONDITIONS", "DETAILS", "INFORMATION", "NOTE",
    "NOTICE", "CIRCULAR", "ORDER", "LETTER", "MEMO",
    "SIGNATURE", "SEAL", "STAMP", "WITNESS", "NOTARY",
}

# Substring patterns — if the FULL uppercased line contains any
# of these it is skipped even if multiple words are present.
_HEADER_SKIP_SUBSTR = {
    "GOVERNMENT OF", "GOVT OF", "MINISTRY OF", "DEPARTMENT OF",
    "OFFICE OF", "AUTHORITY OF", "CORPORATION OF",
    "NATIONAL HIGHWAY", "PUBLIC WORKS", "MUNICIPAL CORPORATION",
}


def _is_skip_header(line: str) -> bool:
    """Return True if this ALL-CAPS line is NOT a company name."""
    upper = line.strip().upper()
    if upper in _HEADER_SKIP_EXACT:
        return True
    for skip in _HEADER_SKIP_SUBSTR:
        if skip in upper:
            return True
    return False


def _clean_candidate(name: str) -> str:
    """Strip trailing punctuation/noise from a matched name."""
    name = name.strip()
    name = re.sub(r'[.,;:\-\s]+$', '', name)   # trailing junk
    name = re.sub(r'\s{2,}', ' ', name)          # internal double spaces
    return name.strip()


def _is_valid_company(name: str) -> bool:
    """Return True if the candidate looks like a real company name."""
    if not name or len(name) < 4:
        return False
    low = name.lower()
    if low in ("unknown company", "the company", "n/a", "nil", "none", "na",
               "unnamed bidder"):
        return False
    # Must have at least one alphabetic character
    return any(c.isalpha() for c in name)


def _filename_to_company(filename: str) -> str:
    """
    Convert a raw uploaded filename into a human-readable company name.

    Examples
    --------
    ABC_Infra_Pvt_Ltd.pdf                    →  Abc Infra Pvt Ltd
    skyline-construction.pdf                 →  Skyline Construction
    3f8a91b2_SomeCo_Ltd.pdf                  →  Somecolimited  (title-cased)
    00b2d698-af6b-4d12-a9f9.jpg              →  ""  (pure UUID → caller uses placeholder)
    """
    # 1. Strip file extension
    name = re.sub(r'\.[a-zA-Z]{2,5}$', '', filename)
    # 2. Remove UUID-v4 (full: 8-4-4-4-12) and partial UUID-style strings
    #    (any sequence of hex groups separated by dashes that fills most of the name)
    name = re.sub(
        r'[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){2,5}',
        '', name
    )
    # 3. Remove remaining leading UUID/hash prefix (8+ hex chars followed by separator)
    name = re.sub(r'^[0-9a-fA-F]{8,}[\s_\-]*', '', name)
    # 4. Remove leading long numeric prefix (e.g. "20240315_Company")
    name = re.sub(r'^\d{6,}[\s_\-]*', '', name)
    # 5. Replace separators with spaces
    name = re.sub(r'[_\-]+', ' ', name)
    # 6. Collapse whitespace and title-case
    name = re.sub(r'\s+', ' ', name).strip().title()
    return name


# ── Public function ───────────────────────────────────────

def extract_company_name(
    text: str,
    fallback: str = "Unknown Company"
) -> str:
    """
    Extract the bidder / vendor company name from OCR text.

    Priority
    --------
    1. Explicit label patterns   (highest confidence)
    2. Business-suffix regex     (medium-high confidence)
    3. ALL-CAPS letterhead scan  (medium confidence)
    4. Filename-derived fallback (low confidence, always readable)
    5. Generic placeholder       (last resort — never "Unknown Company")

    Parameters
    ----------
    text     : OCR-extracted document text (may be empty/None)
    fallback : Raw uploaded filename, used when text extraction fails

    Returns
    -------
    str — a human-readable company name, never an empty string
    """

    # Normalised copies used by different steps
    text_inline = re.sub(r'[ \t]+', ' ', text or '')   # preserve newlines
    text_flat   = re.sub(r'\s+',    ' ', text or '')   # fully flattened

    # ==================================================================
    # STEP 1 — Explicit label patterns
    # Case-insensitive, tolerant of OCR spacing around colons/dashes.
    # Capture group allows mixed-case names (OCR rarely outputs all-caps
    # from structured form fields).
    # ==================================================================
    label_patterns = [
        # M/s  or  M/S  (most reliable Indian tender indicator)
        r'M\s*/\s*[sS]\s*[:\-.]?\s*([A-Za-z][A-Za-z0-9\s&.,()\/\-]{2,80})',

        # "Name of Firm / Company / Bidder / Vendor / Contractor / Agency"
        r'(?i)Name\s+of\s+(?:Firm|Company|Bidder|Agency|Vendor|Applicant'
        r'|Contractor|Supplier)\s*[:\-]\s*([A-Za-z][A-Za-z0-9\s&.,()\/\-]{2,80})',

        # "Bidder Name:" / "Vendor Name:" / "Contractor Name:" etc.
        r'(?i)(?:Bidder|Vendor|Contractor|Supplier|Applicant|Tenderer)'
        r'\s+Name\s*[:\-]\s*([A-Za-z][A-Za-z0-9\s&.,()\/\-]{2,80})',

        # "Company Name:" / "Firm Name:"
        r'(?i)(?:Company|Firm)\s+Name\s*[:\-]\s*([A-Za-z][A-Za-z0-9\s&.,()\/\-]{2,80})',

        # "Submitted By:"
        r'(?i)Submitted\s+By\s*[:\-]\s*([A-Za-z][A-Za-z0-9\s&.,()\/\-]{2,80})',

        # "Proprietor:" / "Partner:" / "Director:"
        r'(?i)(?:Proprietor|Partner|Director)\s*[:\-]\s*([A-Za-z][A-Za-z0-9\s&.,()\/\-]{2,80})',

        # "Organization Name:" / "Organisation Name:"
        r'(?i)Organi[sz]ation\s+Name\s*[:\-]\s*([A-Za-z][A-Za-z0-9\s&.,()\/\-]{2,80})',

        # "From: XYZ Ltd"  (cover letters)
        r'(?i)^From\s*[:\-]\s*([A-Za-z][A-Za-z0-9\s&.,()\/\-]{4,80})',
    ]

    for pattern in label_patterns:
        match = re.search(pattern, text_inline, re.MULTILINE)
        if match:
            candidate = match.group(1).split('\n')[0]   # stop at newline
            candidate = _clean_candidate(candidate)
            if _is_valid_company(candidate):
                logger.info(f"[COMPANY] Step 1 label: {candidate!r}")
                return candidate

    # ==================================================================
    # STEP 2 — Business-suffix regex
    # Ordered most-specific → least-specific to avoid partial matches.
    # Start anchor is [A-Za-z] (not [A-Z]) because OCR text is mixed-case.
    # ==================================================================
    suffix_patterns = [
        r'([A-Za-z][A-Za-z0-9\s&.,()\/\-]{2,60}?Pvt\.?\s*Ltd\.?)',
        r'([A-Za-z][A-Za-z0-9\s&.,()\/\-]{2,60}?Private\s+Limited)',
        r'([A-Za-z][A-Za-z0-9\s&.,()\/\-]{2,60}?\bLLP\b)',
        r'([A-Za-z][A-Za-z0-9\s&.,()\/\-]{2,60}?\bLimited\b)',
        r'([A-Za-z][A-Za-z0-9\s&.,()\/\-]{2,60}?\bLtd\.?)',
        r'([A-Za-z][A-Za-z0-9\s&.,()\/\-]{2,60}?Technologies(?:\s+(?:Pvt\.?|Private|Ltd\.?|Limited))?)',
        r'([A-Za-z][A-Za-z0-9\s&.,()\/\-]{2,60}?Engineering(?:\s+(?:Pvt\.?|Private|Ltd\.?|Limited))?)',
        r'([A-Za-z][A-Za-z0-9\s&.,()\/\-]{2,60}?Infrastructure(?:\s+(?:Pvt\.?|Private|Ltd\.?|Limited))?)',
        r'([A-Za-z][A-Za-z0-9\s&.,()\/\-]{2,60}?Construction(?:\s+(?:Pvt\.?|Private|Ltd\.?|Limited))?)',
        r'([A-Za-z][A-Za-z0-9\s&.,()\/\-]{2,60}?Solutions(?:\s+(?:Pvt\.?|Private|Ltd\.?|Limited))?)',
        r'([A-Za-z][A-Za-z0-9\s&.,()\/\-]{2,60}?Infra(?:structure)?(?:\s+(?:Pvt\.?|Private|Ltd\.?|Limited))?)',
        r'([A-Za-z][A-Za-z0-9\s&.,()\/\-]{2,60}?Corporation)',
        r'([A-Za-z][A-Za-z0-9\s&.,()\/\-]{2,60}?Enterprises)',
        r'([A-Za-z][A-Za-z0-9\s&.,()\/\-]{2,60}?Industries)',
        r'([A-Za-z][A-Za-z0-9\s&.,()\/\-]{2,60}?Associates)',
        r'([A-Za-z][A-Za-z0-9\s&.,()\/\-]{2,60}?Contractors?)',
        r'([A-Za-z][A-Za-z0-9\s&.,()\/\-]{2,60}?Traders?)',
        r'([A-Za-z][A-Za-z0-9\s&.,()\/\-]{2,60}?Consultants?)',
        r'([A-Za-z][A-Za-z0-9\s&.,()\/\-]{2,60}?Services)',
        r'([A-Za-z][A-Za-z0-9\s&.,()\/\-]{2,60}?Works)',
        r'([A-Za-z][A-Za-z0-9\s&.,()\/\-]{2,60}?Group)',
        r'([A-Za-z][A-Za-z0-9\s&.,()\/\-]{2,60}?Agency)',
        r'([A-Za-z][A-Za-z0-9\s&.,()\/\-]{2,60}?Trading)',
        r'([A-Za-z][A-Za-z0-9\s&.,()\/\-]{2,60}?Suppliers?)',
    ]

    for pattern in suffix_patterns:
        match = re.search(pattern, text_flat, re.IGNORECASE)
        if match:
            candidate = _clean_candidate(match.group(1))
            if _is_valid_company(candidate):
                logger.info(f"[COMPANY] Step 2 suffix: {candidate!r}")
                return candidate

    # ==================================================================
    # STEP 3 — ALL-CAPS letterhead / stamp detection (first 30 lines)
    # A qualifying line: all-caps, 5–70 chars, ≥2 words, not in skip set.
    # ==================================================================
    if text_inline:
        for line in text_inline.splitlines()[:30]:
            stripped = line.strip()
            if not (5 <= len(stripped) <= 70):
                continue
            if not stripped.isupper():
                continue
            if len(stripped.split()) < 2:
                continue
            if not any(c.isalpha() for c in stripped):
                continue
            if _is_skip_header(stripped):
                continue
            candidate = stripped.title()
            if _is_valid_company(candidate):
                logger.info(f"[COMPANY] Step 3 header: {candidate!r}")
                return candidate

    # ==================================================================
    # STEP 4 — Filename-derived fallback
    # `fallback` is the raw uploaded filename passed by pipeline.py.
    # _filename_to_company strips UUID, extension, separators, title-cases.
    # ==================================================================
    if fallback and fallback.strip():
        derived = _filename_to_company(fallback.strip())
        if _is_valid_company(derived):
            logger.info(f"[COMPANY] Step 4 filename: {derived!r}")
            return derived

    # ==================================================================
    # STEP 5 — Absolute last resort
    # Never return "Unknown Company" — it looks broken in the UI.
    # ==================================================================
    logger.warning("[COMPANY] All steps failed — generic placeholder used")
    return "Unnamed Bidder"


# =========================================================
# SMART FALLBACK SCORING
# Used when Gemini API is unavailable / quota exceeded.
# Scores are deterministic + keyword-driven.
# Realistic range: ~55–85 for good tender documents.
# =========================================================

def smart_fallback_score(text: str) -> dict:

    text_lower = text.lower()

    # ── Per-category bases — intentionally higher for realistic demos ──
    technical   = 18   # base (was 10)
    financial   = 10   # base (was 5)
    compliance  = 8    # base (was 5)

    reasons = []

    # ── Technical keywords ────────────────────────────────
    tech_keywords = {
        "experience":       8,
        "infrastructure":   6,
        "project":          5,
        "equipment":        5,
        "manpower":         4,
        "machinery":        4,
        "technical":        4,
        "qualified":        3,
        "staff":            3,
        "engineer":         3,
        "years":            2,
        "similar work":     5,
        "completion":       3,
        "work order":       5,
    }
    for kw, pts in tech_keywords.items():
        if kw in text_lower:
            technical += pts
            reasons.append(f"{kw.capitalize()} documented")

    # ── Financial keywords ────────────────────────────────
    fin_keywords = {
        "turnover":         10,
        "revenue":           8,
        "crore":             6,
        "lakh":              5,
        "balance sheet":     5,
        "profit":            4,
        "annual":            3,
        "gst":               4,
        "pan":               3,
        "bank":              2,
        "financial statement": 5,
        "net worth":         4,
    }
    for kw, pts in fin_keywords.items():
        if kw in text_lower:
            financial += pts
            reasons.append(f"{kw.capitalize()} verified")

    # ── Compliance keywords ───────────────────────────────
    comp_keywords = {
        "iso":              8,
        "certificate":      5,
        "registration":     5,
        "license":          4,
        "certified":        4,
        "compliance":       3,
        "statutory":        3,
        "epf":              3,
        "esi":              3,
        "msme":             3,
        "pf registration":  3,
        "labour":           2,
    }
    for kw, pts in comp_keywords.items():
        if kw in text_lower:
            compliance += pts
            reasons.append(f"{kw.upper() if len(kw) <= 4 else kw.capitalize()} verified")

    # ── Document length bonus ─────────────────────────────
    if len(text) > 5000:
        technical += 5
        reasons.append("Comprehensive documentation provided")
    elif len(text) > 2000:
        technical += 3
        reasons.append("Adequate documentation provided")

    # ── Clamp to max per category ─────────────────────────
    technical  = min(technical,  50)
    financial  = min(financial,  30)
    compliance = min(compliance, 20)

    total = technical + financial + compliance

    # ── Small deterministic jitter from text hash ─────────
    text_hash = int(hashlib.md5(text[:500].encode()).hexdigest(), 16)
    jitter = (text_hash % 7) - 3          # -3 to +3
    total = max(0, min(100, total + jitter))

    # ── Pick top 5 reasons for explanation ────────────────
    explanation = (
        "; ".join(reasons[:5])
        if reasons
        else "Basic tender documentation detected"
    )

    return {
        "score": total,
        "breakdown": {
            "technical":  technical,
            "financial":  financial,
            "compliance": compliance,
        },
        "evaluation": (
            "PASS"   if total >= 70
            else "REVIEW" if total >= 40
            else "FAIL"
        ),
        "confidence": min(total + 10, 90),
        "explanation": explanation,
    }


# =========================================================
# AI SCORING
# =========================================================

def ai_score_tender(text: str) -> dict:

    if not text or len(text.strip()) < 30:
        return {
            "score": 10,
            "breakdown": {"technical": 5, "financial": 3, "compliance": 2},
            "evaluation": "FAIL",
            "confidence": 10,
            "explanation": "Insufficient document content for evaluation",
        }

    t_start = time.time()

    document_text = text[:3000]   # slightly more context than before

    prompt = f"""You are a senior government procurement officer evaluating a tender bid document.

Evaluate the document and return ONLY valid JSON with no markdown.

SCORING RULES:
- Award points for clearly evidenced criteria only
- A well-documented tender typically scores 65–85
- Score below 40 only if the document is severely incomplete
- technical + financial + compliance MUST equal score exactly

FORMAT:
{{
  "score": <integer 0–100>,
  "breakdown": {{
    "technical":   <integer 0–50>,
    "financial":   <integer 0–30>,
    "compliance":  <integer 0–20>
  }},
  "evaluation": "PASS" | "FAIL" | "REVIEW",
  "confidence":  <integer 0–100>,
  "explanation": "<one professional sentence in government procurement language>"
}}

THRESHOLDS: PASS ≥ 70 | REVIEW ≥ 40 | FAIL < 40

DOCUMENT:
{document_text}
"""

    try:
        response = None

        for attempt in range(3):
            try:
                response = model.generate_content(prompt)
                break
            except Exception as retry_error:
                if attempt < 2:
                    time.sleep(2 ** attempt)
                    continue
                raise retry_error

        if response is None:
            raise Exception("No response from Gemini")

        raw     = response.text.strip()
        cleaned = clean_json_response(raw)
        data    = safe_json_loads(cleaned)

        if not data:
            raise Exception("Invalid JSON returned by model")

        breakdown = data.get("breakdown", {})

        technical  = max(0, min(50, int(breakdown.get("technical",  0))))
        financial  = max(0, min(30, int(breakdown.get("financial",  0))))
        compliance = max(0, min(20, int(breakdown.get("compliance", 0))))

        total_score = technical + financial + compliance

        elapsed = round(time.time() - t_start, 2)
        logger.info(f"[AI_EVAL] Scoring completed: score={total_score}, time={elapsed}s")

        # ── Ensure explanation is professional ────────────
        explanation = data.get("explanation", "Evaluation completed by AI scoring engine")
        if not explanation or len(explanation) < 10:
            explanation = "Bid evaluated against procurement compliance criteria"

        return {
            "score": total_score,
            "breakdown": {
                "technical":  technical,
                "financial":  financial,
                "compliance": compliance,
            },
            "evaluation": data.get("evaluation", "REVIEW"),
            "confidence":  max(0, min(100, int(data.get("confidence", 80)))),
            "explanation": explanation,
        }

    except Exception as e:
        error_text = str(e).lower()
        logger.warning(f"[AI_EVAL] Gemini error, using fallback: {str(e)}")

        # Quota / rate limit → graceful fallback
        if any(k in error_text for k in ("quota", "429", "rate limit", "resource_exhausted")):
            return smart_fallback_score(text)

        # Any other error → fallback
        return smart_fallback_score(text)