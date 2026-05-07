import re
import logging

logger = logging.getLogger(__name__)

# =========================================================
# CONFIG
# =========================================================

MIN_FINANCIAL_THRESHOLD = 50.0

EMAIL_REGEX = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"


# =========================================================
# HELPERS
# =========================================================

def safe_float(value):
    """Safely convert values to float."""
    if value is None:
        return None
    try:
        if isinstance(value, (int, float)):
            return float(value)
        value = str(value).replace(",", "").strip()
        return float(value)
    except Exception:
        return None


def is_valid_email(email: str) -> bool:
    """Basic email validation."""
    if not email:
        return False
    return bool(re.match(EMAIL_REGEX, email))


# =========================================================
# TEXT-BASED DOCUMENT CHECKS
# These run against the raw OCR text to detect compliance
# indicators not captured in structured extraction.
# Safe: additive only, no schema changes.
# =========================================================

def check_gst(text: str) -> bool:
    """Detect GST number (15-char alphanumeric Indian GST format)."""
    if not text:
        return False
    # Standard Indian GST: 2-digit state code + 10-char PAN + 1Z + 1 check
    pattern = r'\b\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}\b'
    if re.search(pattern, text):
        return True
    # Fallback: keyword presence
    return bool(re.search(r'\bGST\s*(No|Number|Registration|Reg\.?)\s*[:\-]?\s*\w+', text, re.IGNORECASE))


def check_pan(text: str) -> bool:
    """Detect PAN number (10-char alphanumeric Indian PAN format)."""
    if not text:
        return False
    # Standard Indian PAN: AAAAA9999A
    pattern = r'\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b'
    if re.search(pattern, text):
        return True
    return bool(re.search(r'\bPAN\s*(No|Number|Card)?\s*[:\-]?\s*\w+', text, re.IGNORECASE))


def check_iso(text: str) -> bool:
    """Detect ISO certification mention."""
    if not text:
        return False
    return bool(re.search(r'\bISO\s*[\:\-]?\s*\d{4,5}', text, re.IGNORECASE)
                or re.search(r'\bISO\s+certified\b', text, re.IGNORECASE))


def check_experience(text: str) -> bool:
    """Detect work experience or similar work completion."""
    if not text:
        return False
    patterns = [
        r'\b(\d+)\s+years?\s+(of\s+)?experience\b',
        r'\bsimilar\s+work(s)?\b',
        r'\bwork\s+order\b',
        r'\bcompletion\s+certificate\b',
        r'\bperformance\s+certificate\b',
    ]
    return any(re.search(p, text, re.IGNORECASE) for p in patterns)


def check_turnover(text: str) -> bool:
    """Detect annual turnover figures."""
    if not text:
        return False
    patterns = [
        r'\bturnover\b',
        r'\bannual\s+turnover\b',
        r'\bnet\s+worth\b',
        r'\bbalance\s+sheet\b',
        r'\bfinancial\s+statement\b',
        r'(?:Rs\.?|INR|₹)\s*[\d,]+\s*(?:crore|lakh)',
    ]
    return any(re.search(p, text, re.IGNORECASE) for p in patterns)


def check_epf_esi(text: str) -> bool:
    """Detect EPF/ESI registration."""
    if not text:
        return False
    return bool(re.search(r'\b(EPF|EPFO|ESI|ESIC)\b', text, re.IGNORECASE))


# =========================================================
# RULE ENGINE
# =========================================================

def evaluate_tender(data: dict, raw_text: str = ""):
    """
    Rule-based tender evaluation layer.
    Runs after structured extraction + before AI scoring.

    Improvements (safe, additive):
    - Added GST/PAN/ISO/experience/turnover detection from raw text
    - More professional rule language
    - raw_text param is optional (backward compatible)
    """

    result = {
        "status": "REVIEW",
        "passed_rules": [],
        "failed_rules": [],
        "warnings": [],
        "score_adjustments": {
            "technical": 0,
            "financial": 0,
            "compliance": 0
        }
    }

    if not data:
        result["failed_rules"].append("No structured data extracted from document")
        return result

    # =====================================================
    # COMPANY VALIDATION
    # =====================================================

    company = data.get("company")

    if company and len(str(company).strip()) > 2:
        result["passed_rules"].append("Bidder entity name identified")
        result["score_adjustments"]["compliance"] += 2
    else:
        result["failed_rules"].append("Bidder company information absent or incomplete")
        result["score_adjustments"]["compliance"] -= 5

    # =====================================================
    # FINANCIAL VALIDATION
    # =====================================================

    amount = data.get("amount") or data.get("total")
    financial_value = safe_float(amount)

    if financial_value is None:
        result["failed_rules"].append("Financial bid value not detected")
        result["score_adjustments"]["financial"] -= 10
    else:
        if financial_value >= MIN_FINANCIAL_THRESHOLD:
            result["passed_rules"].append(
                f"Financial bid value meets minimum threshold (₹{financial_value:,.0f})"
            )
            result["score_adjustments"]["financial"] += 5
        else:
            result["failed_rules"].append(
                f"Financial bid value below minimum threshold (₹{financial_value:,.0f})"
            )
            result["score_adjustments"]["financial"] -= 10

    # =====================================================
    # EMAIL VALIDATION
    # =====================================================

    email = data.get("email")

    if email and is_valid_email(email):
        result["passed_rules"].append("Valid contact email address present")
        result["score_adjustments"]["compliance"] += 2
    else:
        result["failed_rules"].append("Contact email address missing or invalid")
        result["score_adjustments"]["compliance"] -= 5

    # =====================================================
    # REFERENCE NUMBER
    # =====================================================

    invoice_no = data.get("invoice_no")

    if invoice_no:
        result["passed_rules"].append("Tender/invoice reference number present")
        result["score_adjustments"]["compliance"] += 1
    else:
        result["warnings"].append("Tender reference number not detected")

    # =====================================================
    # TEXT-BASED COMPLIANCE CHECKS (raw OCR text)
    # These are additive — only fire if raw_text provided.
    # Backward compatible: raw_text defaults to "".
    # =====================================================

    if raw_text:

        # GST
        if check_gst(raw_text):
            result["passed_rules"].append("GST registration number verified")
            result["score_adjustments"]["compliance"] += 3
        else:
            result["warnings"].append("GST registration number not detected")

        # PAN
        if check_pan(raw_text):
            result["passed_rules"].append("PAN details present in document")
            result["score_adjustments"]["compliance"] += 2
        else:
            result["warnings"].append("PAN details not detected")

        # ISO
        if check_iso(raw_text):
            result["passed_rules"].append("ISO certification declared by bidder")
            result["score_adjustments"]["compliance"] += 3
        else:
            result["warnings"].append("ISO certification not mentioned")

        # Experience
        if check_experience(raw_text):
            result["passed_rules"].append("Prior work experience documented")
            result["score_adjustments"]["technical"] += 4
        else:
            result["warnings"].append("Work experience evidence not detected")

        # Turnover
        if check_turnover(raw_text):
            result["passed_rules"].append("Annual turnover/financial capacity evidenced")
            result["score_adjustments"]["financial"] += 4
        else:
            result["warnings"].append("Annual turnover details not detected")

        # EPF/ESI
        if check_epf_esi(raw_text):
            result["passed_rules"].append("EPF/ESI statutory compliance verified")
            result["score_adjustments"]["compliance"] += 2
        else:
            result["warnings"].append("EPF/ESI registration not detected")

    # =====================================================
    # FINAL STATUS
    # =====================================================

    failed_count = len(result["failed_rules"])

    if failed_count == 0:
        result["status"] = "PASS"
    elif failed_count <= 2:
        result["status"] = "REVIEW"
    else:
        result["status"] = "FAIL"

    logger.info(
        f"[RULES] Evaluation complete — status={result['status']}, "
        f"passed={len(result['passed_rules'])}, "
        f"failed={failed_count}, "
        f"warnings={len(result['warnings'])}"
    )

    return result
