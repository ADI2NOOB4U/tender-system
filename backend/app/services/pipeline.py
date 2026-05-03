def run_pipeline(file_path):
    text = extract_text(file_path)
    structured = extract_invoice_data(text)
    evaluation = evaluate_tender(structured)

    return {
        "raw_text": text,
        "structured": structured,
        "evaluation": evaluation
    }
result = run_pipeline(file_path)