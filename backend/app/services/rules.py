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
    """
    Safely convert values to float.
    """

    if value is None:
        return None

    try:
        if isinstance(value, (int, float)):
            return float(value)

        value = (
            str(value)
            .replace(",", "")
            .strip()
        )

        return float(value)

    except Exception:
        return None


def is_valid_email(email: str) -> bool:
    """
    Basic email validation.
    """

    if not email:
        return False

    return bool(
        re.match(EMAIL_REGEX, email)
    )


# =========================================================
# RULE ENGINE
# =========================================================

def evaluate_tender(data: dict):
    """
    Rule-based tender evaluation layer.
    Used before AI scoring.

    Prototype version:
    - Financial threshold
    - Email validation
    - Company validation
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
        result["failed_rules"].append(
            "No structured data extracted"
        )

        return result

    # =====================================================
    # COMPANY VALIDATION
    # =====================================================

    company = data.get("company")

    if company and len(str(company).strip()) > 2:

        result["passed_rules"].append(
            "Company information present"
        )

        result["score_adjustments"]["compliance"] += 2

    else:
        result["failed_rules"].append(
            "Missing company information"
        )

        result["score_adjustments"]["compliance"] -= 5

    # =====================================================
    # FINANCIAL VALIDATION
    # =====================================================

    amount = (
        data.get("amount")
        or data.get("total")
    )

    financial_value = safe_float(amount)

    if financial_value is None:

        result["failed_rules"].append(
            "Invalid or missing financial data"
        )

        result["score_adjustments"]["financial"] -= 10

    else:
        if financial_value >= MIN_FINANCIAL_THRESHOLD:

            result["passed_rules"].append(
                (
                    "Financial threshold met "
                    f"({financial_value})"
                )
            )

            result["score_adjustments"]["financial"] += 5

        else:
            result["failed_rules"].append(
                (
                    "Financial value below threshold "
                    f"({financial_value})"
                )
            )

            result["score_adjustments"]["financial"] -= 10

    # =====================================================
    # EMAIL VALIDATION
    # =====================================================

    email = data.get("email")

    if email and is_valid_email(email):

        result["passed_rules"].append(
            "Valid email detected"
        )

        result["score_adjustments"]["compliance"] += 2

    else:
        result["failed_rules"].append(
            "Missing or invalid email"
        )

        result["score_adjustments"]["compliance"] -= 5

    # =====================================================
    # INVOICE VALIDATION
    # =====================================================

    invoice_no = data.get("invoice_no")

    if invoice_no:

        result["passed_rules"].append(
            "Invoice/reference number present"
        )

        result["score_adjustments"]["compliance"] += 1

    else:
        result["warnings"].append(
            "Invoice/reference number missing"
        )

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
        f"[RULES] Completed "
        f"(Status={result['status']})"
    )

    return result