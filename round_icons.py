from PIL import Image, ImageDraw

def add_corners(im, rad):
    circle = Image.new('L', (rad * 2, rad * 2), 0)
    draw = ImageDraw.Draw(circle)
    draw.ellipse((0, 0, rad * 2 - 1, rad * 2 - 1), fill=255)
    
    alpha = Image.new('L', im.size, 255)
    w, h = im.size
    
    alpha.paste(circle.crop((0, 0, rad, rad)), (0, 0))
    alpha.paste(circle.crop((0, rad, rad, rad * 2)), (0, h - rad))
    alpha.paste(circle.crop((rad, 0, rad * 2, rad)), (w - rad, 0))
    alpha.paste(circle.crop((rad, rad, rad * 2, rad * 2)), (w - rad, h - rad))
    
    im.putalpha(alpha)
    return im

for size in [192, 512]:
    try:
        filename = f"public/pwa-icon-v5-{size}x{size}.png"
        img = Image.open(filename).convert("RGBA")
        
        # Calculate radius (e.g. 20% of image size for a nice rounded square)
        radius = int(size * 0.2)
        
        # We need to make sure the background outside the mask is fully transparent
        # The existing image might be a solid square.
        rounded_img = add_corners(img, radius)
        
        rounded_img.save(filename)
        print(f"Rounded {filename} with radius {radius}")
    except Exception as e:
        print(f"Error processing {size}: {e}")
