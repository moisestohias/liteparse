use pdfium_render::prelude::*;
use serde::Serialize;

#[derive(Debug, Serialize)]
struct TextItem {
    text: String,
    x: f32,
    y: f32,
    width: f32,
    height: f32,
    font_name: Option<String>,
    font_size: Option<f32>,
}

#[derive(Debug, Serialize)]
struct Page {
    page_number: usize,
    page_width: f32,
    page_height: f32,
    text_items: Vec<TextItem>,
}

pub fn extract(pdf_path: &str, page_num: Option<u32>) -> Result<(), Box<dyn std::error::Error>> {
    // Initialize PDFium
    let pdfium = Pdfium::new(
        Pdfium::bind_to_statically_linked_library().unwrap()
    );

    // Load the PDF document
    let document = pdfium.load_pdf_from_file(pdf_path, None)?;

    // iterate over pages to extract text
    for (page_index, page) in document.pages().iter().enumerate() {
        if let Some(target_page) = page_num {
            if page_index as u32 + 1 != target_page {
                continue;
            }
        }

        let mut text_items = Vec::new();
        let mut cur_item = TextItem {
            text: String::new(),
            x: 0.0,
            y: 0.0,
            width: 0.0,
            height: 0.0,
            font_name: None,
            font_size: None,
        };

        for object in page.objects().iter() {
            if let Some(object) = object.as_text_object() {
                text_items.push(TextItem {
                    text: object.text().to_string(),
                    x: object.bounds().unwrap().x1.value,
                    y: object.bounds().unwrap().y1.value,
                    width: object.width().unwrap().value,
                    height: object.height().unwrap().value,
                    font_name: Some(object.font().family().to_string()),
                    font_size: Some(object.unscaled_font_size().value)
                });
            }
        }

        let page_data = Page {
            page_number: page_index + 1,
            page_width: page.width().value,
            page_height: page.height().value,
            text_items,
        };

        // Print the page data as a JSON-line object
        println!("{}", serde_json::to_string(&page_data)?);
    }

    Ok(())
}
