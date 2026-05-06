import os
import logging
import traceback

import pytesseract

from PIL import (
    Image,
    ImageFilter,
    ImageOps
)

# =========================================================
# OPTIONAL PDF SUPPORT
# =========================================================

try:
    from pdf2image import convert_from_path

    PDF_SUPPORT = True

except Exception:
    PDF_SUPPORT = False


logger = logging.getLogger(__name__)

# =========================================================
# TESSERACT CONFIG
# =========================================================

pytesseract.pytesseract.tesseract_cmd = os.getenv(
    "TESSERACT_PATH",
    "tesseract"
)

# =========================================================
# OCR CONFIG
# =========================================================

SUPPORTED_IMAGE_TYPES = {
    ".png",
    ".jpg",
    ".jpeg"
}

SUPPORTED_PDF_TYPES = {
    ".pdf"
}

OCR_CONFIG = r"--oem 3 --psm 6"


# =========================================================
# IMAGE PREPROCESSING
# =========================================================

def preprocess_image(image: Image.Image) -> Image.Image:
    """
    Improve OCR accuracy using preprocessing.
    """

    try:
        # grayscale
        image = image.convert("L")

        # auto contrast
        image = ImageOps.autocontrast(image)

        # sharpen
        image = image.filter(
            ImageFilter.SHARPEN
        )

        # threshold
        image = image.point(
            lambda x: 0 if x < 150 else 255,
            "1"
        )

        return image

    except Exception as e:
        logger.error(
            f"[OCR] Image preprocessing failed: {str(e)}"
        )

        return image


# =========================================================
# OCR FROM IMAGE
# =========================================================

def extract_text_from_image(
    image: Image.Image
) -> str:
    """
    Extract OCR text from PIL image.
    """

    try:
        processed = preprocess_image(image)

        text = pytesseract.image_to_string(
            processed,
            config=OCR_CONFIG
        )

        cleaned = text.strip()

        logger.info(
            f"[OCR] Extracted "
            f"{len(cleaned)} characters"
        )

        return cleaned

    except Exception as e:
        logger.error(
            f"[OCR] Image OCR failed: {str(e)}"
        )

        logger.error(traceback.format_exc())

        return ""


# =========================================================
# OCR FROM PDF
# =========================================================

def extract_text_from_pdf(
    file_path: str
) -> str:
    """
    Convert PDF pages to images and run OCR.
    """

    if not PDF_SUPPORT:
        raise Exception(
            "PDF support not installed. "
            "Install pdf2image + poppler."
        )

    try:
        images = convert_from_path(
            file_path,
            dpi=300
        )

        all_text = []

        for index, image in enumerate(images):
            logger.info(
                f"[OCR] Processing PDF page {index + 1}"
            )

            page_text = extract_text_from_image(
                image
            )

            if page_text:
                all_text.append(page_text)

        combined = "\n\n".join(all_text)

        logger.info(
            f"[OCR] PDF extraction complete "
            f"({len(combined)} chars)"
        )

        return combined.strip()

    except Exception as e:
        logger.error(
            f"[OCR] PDF OCR failed: {str(e)}"
        )

        logger.error(traceback.format_exc())

        raise


# =========================================================
# MAIN OCR ENTRY
# =========================================================

def extract_text(file_path: str) -> str:
    """
    Main OCR extraction pipeline.
    Supports:
    - PDF
    - PNG
    - JPG
    - JPEG
    """

    if not os.path.exists(file_path):
        logger.error(
            f"[OCR] File not found: {file_path}"
        )

        return ""

    extension = os.path.splitext(
        file_path
    )[1].lower()

    try:
        logger.info(
            f"[OCR] Starting extraction: {file_path}"
        )

        # =====================================================
        # PDF
        # =====================================================

        if extension in SUPPORTED_PDF_TYPES:
            return extract_text_from_pdf(
                file_path
            )

        # =====================================================
        # IMAGE
        # =====================================================

        elif extension in SUPPORTED_IMAGE_TYPES:

            image = Image.open(file_path)

            return extract_text_from_image(
                image
            )

        # =====================================================
        # UNSUPPORTED
        # =====================================================

        else:
            logger.warning(
                f"[OCR] Unsupported file type: "
                f"{extension}"
            )

            return ""

    except Exception as e:
        logger.error(
            f"[OCR] Extraction failed: {str(e)}"
        )

        logger.error(traceback.format_exc())

        return ""