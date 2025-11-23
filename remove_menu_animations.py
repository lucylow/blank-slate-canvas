#!/usr/bin/env python3
import re

# Read the file
with open('src/pages/Index.tsx', 'r') as f:
    content = f.read()

# Remove AnimatePresence wrapper
content = content.replace(
    '          {/* Mobile Menu */}\n          <AnimatePresence>\n            {mobileMenuOpen && (',
    '          {/* Mobile Menu */}\n          {mobileMenuOpen && ('
)

# Remove closing AnimatePresence
content = content.replace(
    '            )}\n          </AnimatePresence>',
    '            )}'
)

# Replace motion.div backdrop
content = re.sub(
    r'                <motion\.div\s+initial=\{\{ opacity: 0 \}\}\s+animate=\{\{ opacity: 1 \}\}\s+exit=\{\{ opacity: 0 \}\}\s+transition=\{\{ duration: 0\.2 \}\}\s+className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"',
    '                <div\n                  className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"',
    content
)

# Replace motion.div menu container
content = re.sub(
    r'                <motion\.div\s+initial=\{\{ opacity: 0, y: -20, scale: 0\.95 \}\}\s+animate=\{\{ opacity: 1, y: 0, scale: 1 \}\}\s+exit=\{\{ opacity: 0, y: -20, scale: 0\.95 \}\}\s+transition=\{\{ duration: 0\.2, ease: "easeOut" \}\}\s+className="absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-2xl md:hidden z-50"',
    '                <div\n                  className="absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-2xl md:hidden z-50"',
    content
)

# Replace all motion.a with regular a tags (remove animation props)
content = re.sub(
    r'                    <motion\.a\s+initial=\{\{ opacity: 0, x: -20 \}\}\s+animate=\{\{ opacity: 1, x: 0 \}\}\s+transition=\{\{ delay: [\d.]+ \}\}\s+',
    '                    <a\n                      ',
    content
)
content = re.sub(
    r'                    </motion\.a>',
    '                    </a>',
    content
)

# Replace all motion.div with regular div tags (remove animation props)
content = re.sub(
    r'                    <motion\.div\s+initial=\{\{ opacity: 0, x: -20 \}\}\s+animate=\{\{ opacity: 1, x: 0 \}\}\s+transition=\{\{ delay: [\d.]+ \}\}\s*>',
    '                    <div>',
    content
)
content = re.sub(
    r'                    <motion\.div\s+initial=\{\{ opacity: 0, x: -20 \}\}\s+animate=\{\{ opacity: 1, x: 0 \}\}\s+transition=\{\{ delay: [\d.]+ \}\}\s+className=',
    '                    <div\n                      className=',
    content
)
content = re.sub(
    r'                    </motion\.div>',
    '                    </div>',
    content
)

# Write the file back
with open('src/pages/Index.tsx', 'w') as f:
    f.write(content)

print("Done! Removed all menu animations.")

