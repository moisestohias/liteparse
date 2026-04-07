# liteparse Preserving Images

There's **no option to preserve images** in the output. LiteParse's text output only extracts text content — images are not embedded, saved, or referenced.

The image handling is only used internally for OCR (text extraction from embedded images), not for preserving them in output.

**Current behavior:**
- Images are rendered and passed to OCR for text extraction
- Extracted text becomes part of the document text
- Images themselves are discarded
