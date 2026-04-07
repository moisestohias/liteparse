# Image Preservation

Extract and preserve embedded images from PDF documents. Images are saved to disk and referenced in output using markdown image syntax.

## Usage

### CLI

```bash
# Extract images to markdown text
node dist/src/index.js parse document.pdf --preserve-images -o output.md

# Extract images to JSON
node dist/src/index.js parse document.pdf --preserve-images --format json -o output.json
```

### Programmatic

```typescript
import { LiteParse } from "liteparse";

const parser = new LiteParse({ preserveImages: true });
const result = await parser.parse("document.pdf");
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `preserveImages` | boolean | `false` | Enable image extraction |

## Output

When enabled, LiteParse:

1. **Extracts images** from PDF operator list (embedded PNG, JPEG, RGBA)
2. **Saves to disk** in `images/` subdirectory relative to output file
3. **References in text** using markdown: `![](images/filename.png)`
4. **Includes metadata** in JSON output

### Text Output

```
--- Page 1 ---
![](images/page1_img_1_0.png)
Document title here
...

--- Page 2 ---
![](images/page2_img_2_0.png)
More content...
```

### JSON Output

```json
{
  "pages": [
    {
      "page": 1,
      "images": [
        {
          "id": "img_1_0",
          "x": 0,
          "y": 0,
          "width": 2480,
          "height": 413,
          "type": "png",
          "path": "images/page1_img_1_0.png"
        }
      ]
    }
  ]
}
```

## Image Format

- Images are converted to PNG format using Sharp
- Filename format: `page{N}_{image_id}.png`
- Saved relative to output file location

## Requirements

- `sharp` package (already a dependency)

## Notes

- Only embedded images are extracted (not rendered page screenshots)
- Images are deduplicated - same image used multiple times appears once
- Position coordinates are in PDF point coordinates