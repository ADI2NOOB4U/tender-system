from app.services.config import get_config


def calculate_scores(job):
    config = get_config()

    weights = config["weights"]
    fin_rules = config["financial_rules"]
    tech_rules = config["technical_rules"]

    result = job.get("result", {})
    data = result.get("structured_data", {})
    evaluation = result.get("evaluation", "REVIEW")
    confidence = result.get("confidence") or 0

    # 🔥 FINANCIAL SCORE
    try:
        total = float(data.get("total", "0").replace(",", "."))
        if total >= fin_rules["high"]:
            financial_score = 100
        elif total >= fin_rules["medium"]:
            financial_score = 70
        else:
            financial_score = 30
    except:
        financial_score = 20

    # 🔥 TECHNICAL SCORE
    technical_score = 0

    if data.get("invoice_no"):
        technical_score += tech_rules["invoice"]

    if data.get("email"):
        technical_score += tech_rules["email"]

    technical_score += int(confidence * tech_rules["confidence"])

    financial_score = min(financial_score, 100)
    technical_score = min(technical_score, 100)

    final_score = (
        financial_score * weights["financial"] +
        technical_score * weights["technical"]
    )

    return {
        "job_id": job.get("job_id"),
        "evaluation": evaluation,
        "financial_score": financial_score,
        "technical_score": technical_score,
        "final_score": round(final_score, 2)
    }


def rank_tenders(jobs: list):
    scored = [calculate_scores(job) for job in jobs]
    ranked = sorted(scored, key=lambda x: x["final_score"], reverse=True)

    for i, item in enumerate(ranked):
        item["rank"] = i + 1

    return ranked