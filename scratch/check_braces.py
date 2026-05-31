with open("css/m.css", "r", encoding="utf-8") as f:
    content = f.read()

open_braces = content.count("{")
close_braces = content.count("}")

print("Open braces '{':", open_braces)
print("Close braces '}':", close_braces)

# Track braces balance
balance = 0
for idx, char in enumerate(content):
    if char == "{":
        balance += 1
    elif char == "}":
        balance -= 1
        if balance < 0:
            print(f"Error: unmatched closing brace '}}' at character index {idx} near context:")
            print(content[max(0, idx-50):min(len(content), idx+50)])
            print("-" * 40)

if balance > 0:
    print(f"Error: {balance} unclosed opening braces '{{'")
