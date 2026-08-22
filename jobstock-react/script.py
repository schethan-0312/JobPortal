import os

src_dir = r'c:\Users\kisho\OneDrive\Desktop\jpr\JobPortal\jobstock-react\src'
blank = '\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=\"'
patterns = ['\"/assets/img/l-1.png\"', '\"/assets/img/l-4.png\"', '\"/assets/img/user-5.png\"']

count = 0
for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            original = content
            for p in patterns:
                content = content.replace(p, blank)
            if content != original:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)
                count += 1
                print(f'Updated {path}')
print(f'Total updated files: {count}')
