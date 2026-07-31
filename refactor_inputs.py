import os
import re

scenes_dir = 'src/scenes'

for filename in os.listdir(scenes_dir):
    if not filename.endswith('.ts'): continue
    filepath = os.path.join(scenes_dir, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'InputManager' not in content:
        content = re.sub(r'import Phaser from \'phaser\';', "import Phaser from 'phaser';\nimport { InputManager } from '../engine/InputManager';\nimport { AudioEngine } from '../engine/AudioEngine';", content, count=1)
        
        # Replace cursors = this.input.keyboard?.createCursorKeys();
        content = re.sub(r'const cursors = this\.input\.keyboard\?\.createCursorKeys\(\);', 'InputManager.update();', content)
        
        # Replace cursors?.up.isDown
        content = content.replace('cursors?.up.isDown', "InputManager.isDown('ArrowUp')")
        content = content.replace('cursors?.down.isDown', "InputManager.isDown('ArrowDown')")
        content = content.replace('cursors?.left.isDown', "InputManager.isDown('ArrowLeft')")
        content = content.replace('cursors?.right.isDown', "InputManager.isDown('ArrowRight')")
        content = content.replace('cursors?.space.isDown', "InputManager.isDown('Space')")
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Refactored {filename}')
