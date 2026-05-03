def evaluate_tender(data: dict):
    result = {
        "status": "review",
        "reasons": []
    }

    # Example rules (you will improve later)

    # Rule 1: Invoice total (simulate turnover)
    try:
        total = float(data.get("total", "0").replace(",", "."))
        if total >= 50:
            result["status"] = "pass"
        else:
            result["status"] = "fail"
            result["reasons"].append("Turnover below required threshold")
    except:
        result["status"] = "review"
        result["reasons"].append("Invalid financial data")

    # Rule 2: Email check (basic validation)
    if not data.get("email"):
        result["reasons"].append("Missing email")

    return result
