import os
import re

scenes_dir = r'D:\Antigravity_Projects\retro-game-replicas\src\scenes'

for filename in os.listdir(scenes_dir):
    if not filename.endswith('.ts'):
        continue
    filepath = os.path.join(scenes_dir, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    
    # Remove old declarations of cursors
    content = re.sub(r'private\s+cursors[^;]*;\n?', '', content)
    
    # Remove cursor assignments
    content = re.sub(r'(this\.)?cursors\s*=\s*this\.input\.keyboard[^;]+;\n?', '', content)
    content = re.sub(r'const\s+cursors\s*=\s*this\.input\.keyboard[^;]+;\n?', '', content)

    # Replace usages
    content = re.sub(r'(this\.)?cursors\??\.left\.isDown', "InputManager.isDown('ArrowLeft')", content)
    content = re.sub(r'(this\.)?cursors\??\.right\.isDown', "InputManager.isDown('ArrowRight')", content)
    content = re.sub(r'(this\.)?cursors\??\.up\.isDown', "InputManager.isDown('ArrowUp')", content)
    content = re.sub(r'(this\.)?cursors\??\.down\.isDown', "InputManager.isDown('ArrowDown')", content)
    content = re.sub(r'(this\.)?cursors\??\.space\.isDown', "InputManager.isDown('Space')", content)

    # Some games might use W S A D keys directly if they set them up
    
    # Remove unused time in PongScene update
    if filename == 'PongScene.ts':
        content = content.replace('update(time: number, delta: number)', 'update(_time: number, delta: number)')

    # Check for unused InputManager / AudioEngine
    # We will remove them if they are not used anywhere else in the file.
    if 'InputManager.' not in content:
        content = re.sub(r"import \{ InputManager \} from '\.\./engine/InputManager';\n?", "", content)
    
    if 'AudioEngine.' not in content:
        content = re.sub(r"import \{ AudioEngine \} from '\.\./engine/AudioEngine';\n?", "", content)

    if original_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filename}")
