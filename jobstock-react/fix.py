import re

with open('src/app/employer-submit-job/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove "Mark as Featured Job"
featured_regex = re.compile(r'<div className="col-xl-12 col-lg-12 col-md-12 pt-2">.*?Mark as Featured Job.*?</div>\s*</div>\s*</div>', re.DOTALL)
content = featured_regex.sub('', content)

# 2. Add setStatus("OPEN"); to reset
reset_block_regex = re.compile(r'setPublishDate\(""\);\s*setIsFeatured\(false\);')
content = reset_block_regex.sub('setPublishDate("");\n      setIsFeatured(false);\n      setStatus("OPEN");', content)

# 3. Add to API payload (already has status but we also want to remove isFeatured to be clean - wait, if I keep isFeatured(false) it does no harm, let\'s just leave it since it is part of dto)

with open('src/app/employer-submit-job/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("done")
