def process_document(job_id: str, file_path: str):
    try:
        # 🔹 STEP 1: OCR
        raw_text = f"Dummy OCR text for {file_path}"

        # 🔹 STEP 2: Extraction (replace with OpenAI later)
        extracted_data = {
            "company": "Test Company",
            "amount": 10000
        }

        # 🔹 STEP 3: Evaluation
        evaluation = {
            "score": 85,
            "status": "qualified"
        }

        # 🔹 STEP 4: Explanation
        explanation = "This tender meets required criteria."

        return {
            "raw_text": raw_text,
            "extracted_data": extracted_data,
            "evaluation": evaluation,
            "explanation": explanation
        }

    except Exception as e:
        return {
            "error": str(e)
        }