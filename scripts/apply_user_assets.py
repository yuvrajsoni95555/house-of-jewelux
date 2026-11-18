import json
import re

# 1. Update data/products.json
products_path = r"c:\houseofjewelux\data\products.json"
with open(products_path, 'r', encoding='utf-8') as f:
    products = json.load(f)

for p in products:
    pid = p.get('id')
    if pid == "HJ-BRH-001":
        p['image'] = "images/user_falcon_brooch_white.jpg"
        p['hoverImage'] = "images/user_falcon_brooch_emerald.jpg"
        p['gallery'] = [
            "images/user_falcon_brooch_white.jpg",
            "images/user_falcon_brooch_emerald.jpg",
            "images/authentic_brooch_flower.jpg",
            "images/authentic_atelier_craft.jpg"
        ]
        p['imageStatus'] = "Verified Physical Client Reference - Zero AI Imagery"
        p['imageVerification'] = "Client-Supplied Verified Reference Photography (Royal Falcon Polki Brooch Spec HJ-BRH-001)"
    elif pid == "HJ-NCK-004":
        p['image'] = "images/user_balaji_temple_pendant.jpg"
        p['hoverImage'] = "images/authentic_temple_heritage.jpg"
        p['gallery'] = [
            "images/user_balaji_temple_pendant.jpg",
            "images/authentic_temple_heritage.jpg",
            "images/authentic_necklace_hero.jpg"
        ]
        p['imageStatus'] = "Verified Physical Client Reference - Zero AI Imagery"
        p['imageVerification'] = "Client-Supplied Verified Reference Photography (Lord Venkateswara Sacred Nakshi Pendant Spec HJ-NCK-004)"
    elif pid == "HJ-BRH-004":
        p['image'] = "images/user_jaguar_emerald_brooch.jpg"
        p['hoverImage'] = "images/user_ganesha_leaf_brooch.jpg"
        p['gallery'] = [
            "images/user_jaguar_emerald_brooch.jpg",
            "images/user_ganesha_leaf_brooch.jpg",
            "images/user_elephant_brooch.jpg"
        ]
        p['imageStatus'] = "Verified Physical Client Reference - Zero AI Imagery"
        p['imageVerification'] = "Client-Supplied Verified Reference Photography (Diamond Jaguars on Octagonal Emerald Spec HJ-BRH-004)"
    elif pid == "HJ-BRH-007":
        p['image'] = "images/user_elephant_brooch.jpg"
        p['hoverImage'] = "images/user_ganesha_leaf_brooch.jpg"
        p['gallery'] = [
            "images/user_elephant_brooch.jpg",
            "images/user_ganesha_leaf_brooch.jpg"
        ]
        p['imageStatus'] = "Verified Physical Client Reference - Zero AI Imagery"
        p['imageVerification'] = "Client-Supplied Verified Reference Photography (Royal Elephant Polki & Emerald Brooch Spec HJ-BRH-007)"
    elif pid == "HJ-BRH-009":
        p['image'] = "images/user_swan_diamond_brooch.jpg"
        p['hoverImage'] = "images/user_falcon_brooch_white.jpg"
        p['gallery'] = [
            "images/user_swan_diamond_brooch.jpg",
            "images/user_falcon_brooch_white.jpg"
        ]
        p['imageStatus'] = "Verified Physical Client Reference - Zero AI Imagery"
        p['imageVerification'] = "Client-Supplied Verified Reference Photography (Dual Swan Diamond & Morganite Brooch Spec HJ-BRH-009)"

with open(products_path, 'w', encoding='utf-8') as f:
    json.dump(products, f, indent=2)
print("Updated products.json with client-supplied verified pieces!")

# 2. Update app.js
app_path = r"c:\houseofjewelux\app.js"
with open(app_path, 'r', encoding='utf-8') as f:
    app_text = f.read()

# Replace Hero Banner background with user_flagship_hero_model.jpg
app_text = app_text.replace(
    'src="images/authentic_hero_editorial.jpg"',
    'src="images/user_flagship_hero_model.jpg"'
)

# Update Category Circles to use client's exact pieces
app_text = app_text.replace(
    'src="images/authentic_brooch_flower.jpg" alt="Brooches & Pins"',
    'src="images/user_falcon_brooch_white.jpg" alt="Brooches & Pins"'
)
app_text = app_text.replace(
    'src="images/authentic_temple_heritage.jpg" alt="Temple Nakshi"',
    'src="images/user_balaji_temple_pendant.jpg" alt="Temple Nakshi"'
)

# In collection page for brooches:
app_text = app_text.replace(
    'heroImg = "images/authentic_brooch_flower.jpg";',
    'heroImg = "images/user_jaguar_emerald_brooch.jpg";'
)

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(app_text)
print("Updated app.js with client-supplied hero model and category assets!")
