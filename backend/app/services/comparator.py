import logging

from app.services.config import get_config

logger = logging.getLogger(__name__)


# =========================================================
# HELPERS
# =========================================================

def safe_float(value):
    """
    Safe float conversion.
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


def clamp(value, minimum=0, maximum=100):
    return max(minimum, min(maximum, value))


# =========================================================
# SCORE CALCULATION
# =========================================================

def calculate_scores(job: dict):
    """
    Calculate weighted tender scores.
    """

    config = get_config()

    weights = config.get("weights", {})

    financial_rules = config.get(
        "financial_rules",
        {}
    )

    technical_rules = config.get(
        "technical_rules",
        {}
    )

    # =====================================================
    # EXTRACT DATA
    # =====================================================

    result = job.get("result", {})

    structured = (
        result.get("structured")
        or result.get("structured_data")
        or {}
    )

    evaluation_data = result.get(
        "evaluation",
        {}
    )

    evaluation_status = (
        evaluation_data.get("status")
        or evaluation_data.get("evaluation")
        or "REVIEW"
    )

    confidence = (
        evaluation_data.get("confidence")
        or 0
    )

    ai_score = (
        evaluation_data.get("score")
        or 0
    )

    rules = evaluation_data.get(
        "rules",
        {}
    )

    score_adjustments = rules.get(
        "score_adjustments",
        {}
    )

    # =====================================================
    # FINANCIAL SCORE
    # =====================================================

    financial_score = 0

    amount = (
        structured.get("amount")
        or structured.get("total")
    )

    amount = safe_float(amount)

    if amount is not None:

        if amount >= financial_rules.get(
            "high",
            100
        ):
            financial_score = 100

        elif amount >= financial_rules.get(
            "medium",
            50
        ):
            financial_score = 70

        else:
            financial_score = 40

    else:
        financial_score = 20

    # rule adjustments
    financial_score += (
        score_adjustments.get(
            "financial",
            0
        )
    )

    # =====================================================
    # TECHNICAL SCORE
    # =====================================================

    technical_score = 0

    if structured.get("company"):
        technical_score += technical_rules.get(
            "company",
            15
        )

    if structured.get("invoice_no"):
        technical_score += technical_rules.get(
            "invoice",
            15
        )

    if structured.get("email"):
        technical_score += technical_rules.get(
            "email",
            10
        )

    # confidence contribution
    technical_score += int(
        confidence * technical_rules.get(
            "confidence",
            0.2
        )
    )

    # AI contribution
    technical_score += int(ai_score * 0.2)

    # rule adjustments
    technical_score += (
        score_adjustments.get(
            "technical",
            0
        )
    )

    # =====================================================
    # COMPLIANCE SCORE
    # =====================================================

    compliance_score = 50

    compliance_score += (
        score_adjustments.get(
            "compliance",
            0
        )
    )

    # =====================================================
    # NORMALIZATION
    # =====================================================

    financial_score = clamp(financial_score)

    technical_score = clamp(technical_score)

    compliance_score = clamp(compliance_score)

    # =====================================================
    # FINAL WEIGHTED SCORE
    # =====================================================

    final_score = (
        (
            financial_score *
            weights.get("financial", 0.4)
        ) +

        (
            technical_score *
            weights.get("technical", 0.4)
        ) +

        (
            compliance_score *
            weights.get("compliance", 0.2)
        )
    )

    final_score = round(final_score, 2)

    logger.info(
        f"[COMPARATOR] "
        f"Job={job.get('job_id')} "
        f"Score={final_score}"
    )

    return {
        "job_id": job.get("job_id"),

        "evaluation": evaluation_status,

        "financial_score": financial_score,

        "technical_score": technical_score,

        "compliance_score": compliance_score,

        "confidence": confidence,

        "ai_score": ai_score,

        "final_score": final_score
    }


# =========================================================
# RANKING ENGINE
# =========================================================

def rank_tenders(jobs: list):
    """
    Rank tender submissions.
    """

    if not jobs:
        return []

    scored_jobs = []

    for job in jobs:

        try:
            scored = calculate_scores(job)

            scored_jobs.append(scored)

        except Exception as e:
            logger.error(
                f"[COMPARATOR] "
                f"Failed scoring job: {str(e)}"
            )

    ranked = sorted(
        scored_jobs,

        key=lambda x: (
            x["final_score"],
            x["technical_score"],
            x["financial_score"]
        ),

        reverse=True
    )

    # =====================================================
    # ASSIGN RANKS
    # =====================================================

    for index, item in enumerate(ranked):
        item["rank"] = index + 1

    logger.info(
        f"[COMPARATOR] Ranked "
        f"{len(ranked)} tenders"
    )

    return ranked