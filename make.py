#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""ساخت بسته‌ی نهایی «تخته هندسه» برای ویندوز ۷"""
import os, re, shutil, zipfile, base64

SRC = '/home/z/my-project/scripts/geoapp/src'
BUILD = '/home/z/my-project/scripts/geoapp/build'
OUT = '/home/z/my-project/download/HendeseBoard'
ZIP = '/home/z/my-project/download/Takhte-Hendese.zip'

JS_ORDER = ['core.js','board.js','tarsim.js','thales.js','tashaboh.js','istidlal.js','pdfview.js','main.js']

FONTS = [  # (font-weight, filename)
    ('400','Vazirmatn-Regular.woff2'),
    ('700','Vazirmatn-Bold.woff2'),
]

def read(p):
    with open(p, encoding='utf-8') as f: return f.read()

def font_css():
    """ساخت @font-face با جاسازی base64 — کاملاً آفلاین، بدون فایل کناری"""
    faces=[]
    for weight, fname in FONTS:
        p=os.path.join(BUILD,'fonts',fname)
        if not os.path.exists(p):
            print('WARN: font not found:', p); continue
        b64=base64.b64encode(open(p,'rb').read()).decode('ascii')
        faces.append(
            "@font-face{font-family:'Vazirmatn';font-style:normal;font-weight:%s;"
            "font-display:swap;src:url(data:font/woff2;base64,%s) format('woff2');}"
            % (weight, b64))
    return '\n'.join(faces)

def main():
    tpl = read(os.path.join(SRC,'template.html'))
    css = read(os.path.join(SRC,'style.css'))
    js_parts = [read(os.path.join(SRC,f)) for f in JS_ORDER]
    js = '\n\n'.join(js_parts)

    html = tpl.replace('__FONTS__', font_css()).replace('__CSS__', css).replace('__JS__', js)
    assert '__CSS__' not in html and '__JS__' not in html and '__FONTS__' not in html, 'placeholder left!'
    assert "data:font/woff2;base64" in html, 'font-face missing!'

    if os.path.exists(OUT):
        shutil.rmtree(OUT)
    os.makedirs(os.path.join(OUT,'pdfjs'), exist_ok=True)

    with open(os.path.join(OUT,'index.html'),'w',encoding='utf-8') as f:
        f.write(html)
    shutil.copy(os.path.join(BUILD,'pdf.min.js'), os.path.join(OUT,'pdfjs','pdf.min.js'))
    shutil.copy(os.path.join(BUILD,'pdf.worker.min.js'), os.path.join(OUT,'pdfjs','pdf.worker.min.js'))
    shutil.copy(os.path.join(SRC,'book_data.js'), os.path.join(OUT,'book_data.js'))

    # فایل JS یکپارچه برای بررسی سینتکس با node
    with open(os.path.join(BUILD,'concat.js'),'w',encoding='utf-8') as f:
        f.write(js)

    start_bat = r'''@echo off
rem Takhte Hendese - portable launcher for Windows 7
setlocal
set "PAGE=%~dp0index.html"
set "URL=file:///%PAGE:\=/%"

set "CH1=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
set "CH2=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
set "CH3=%LocalAppData%\Google\Chrome\Application\chrome.exe"
set "ED1=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
set "ED2=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
set "FF1=%ProgramFiles%\Mozilla Firefox\firefox.exe"
set "FF2=%ProgramFiles(x86)%\Mozilla Firefox\firefox.exe"

if exist "%CH1%" (
  start "" "%CH1%" --kiosk --new-window "%URL%"
  goto :eof
)
if exist "%CH2%" (
  start "" "%CH2%" --kiosk --new-window "%URL%"
  goto :eof
)
if exist "%CH3%" (
  start "" "%CH3%" --kiosk --new-window "%URL%"
  goto :eof
)
if exist "%ED1%" (
  start "" "%ED1%" --kiosk --new-window "%URL%"
  goto :eof
)
if exist "%ED2%" (
  start "" "%ED2%" --kiosk --new-window "%URL%"
  goto :eof
)
if exist "%FF1%" (
  start "" "%FF1%" -kiosk "%PAGE%"
  goto :eof
)
if exist "%FF2%" (
  start "" "%FF2%" -kiosk "%PAGE%"
  goto :eof
)
start "" "%PAGE%"
'''
    with open(os.path.join(OUT,'Start.bat'),'w',encoding='ascii') as f:
        f.write(start_bat)

    readme = '''تخته هندسه — نسخه پرتابل برای ویندوز ۷
========================================

راه اندازی (دو روش):
۱) روی Start.bat دو بار کلیک کنید — برنامه در حالت تمام‌صفحه با کروم/فایرفاکس/اج باز می‌شود.
۲) یا فایل index.html را با مرورگر باز کنید.

نکته مهم: همیشه کل پوشه را با هم کپی کنید (index.html + پوشه pdfjs)؛ فایل‌های pdfjs موتور نمایش PDF هستند.

بخش‌های برنامه:
- ترسیم‌ها: هفت ترسیم گام‌به‌گام با پرگار و خط‌کش (عمودمنصف، نیمساز، عمود، موازی، تقسیم پاره‌خط، رسم مثلث).
  نقطه‌های پررنگ شکل را می‌توانید با ماوس جابه‌جا کنید و همه‌چیز زنده به‌روز می‌شود.
  با «مرحله بعد/قبلی» یا کلیدهای جهت یا کلیکر (PageUp/PageDown) مراحل را عوض کنید.
  «پخش خودکار» مراحل را یکی‌یکی نشان می‌دهد.
- تالس: سه خط موازی و دو قطع‌کننده؛ نسبت‌ها زنده نشان داده می‌شوند. خط‌ها را با ماوس بالا/پایین ببرید.
  در حالت «عکس تالس» نقطه‌های M و D را روی اضلاع بکشید تا موازی شدن را ببینید.
- تشابه: دو مثلث با رأس‌های قابل کشیدن؛ زاویه‌ها، نسبت ضلع‌ها و حالت تشابه (ز‌ز / ض‌ز‌ض / ض‌ض‌ض) خودکار تشخیص داده می‌شود.
- تخته: قلم، هایلایت، خط، فلش، دایره، متن با پالت نمادها (∠ △ ∥ ⊥ ≅ ∼ √ ° ...)،
  علامت ضلع (روی خط کلیک کنید ۱ تا ۳ خط تیره می‌خورد)، علامت زاویه و قائمه (روی رأس دو خط کلیک کنید)، واگرد.
  پاک‌کن: با کشیدن ماوس روی هر خط یا شکل، کل آن پاک می‌شود؛ با Ctrl+Z برمی‌گردد.
- استدلال: جدول «گزاره | دلیل» با فهرست دلایل آماده کتاب؛ چاپ یا ذخیره متن.
  دکمه «کارت قضیه‌ها» صورت قضیه تالس، عکس تالس و حالت‌های تشابه را نشان می‌دهد.
- PDF: فایل فصل را باز کنید؛ صفحه‌گردی با کلیکر، زوم، قلم و هایلایت روی متن، معکوس رنگ برای پروژکتور،
  «صفحه سفید حل تمرین» و ذخیره تصویر صفحه.

میان‌برها:
F تمام‌صفحه — N حالت شب — S اسپات‌لایت — L لیزر — T تایمر — M ذره‌بین — ? راهنما — Esc خروج
PageUp/PageDown (کلیکر): مرحله بعد/قبلی ترسیم یا صفحه بعد/قبلی PDF
Ctrl+Z / Ctrl+Y در تخته: واگرد / بازانجام

ذخیره‌سازی: هرچه می‌کشید و می‌نویسید در همان مرورگر و همان کامپیوتر خودکار ذخیره می‌شود
(localStorage). اگر کامپیوتر را عوض می‌کنید، ذخیره‌ها منتقل نمی‌شوند.

سازگاری: ویندوز ۷ + Chrome/Edge نسخه ۱۰۹ یا Firefox نسخه ۱۱۵ به بعد. بدون نیاز به اینترنت.
'''
    with open(os.path.join(OUT,'README.txt'),'w',encoding='utf-8-sig') as f:
        f.write(readme)

    # زیپ
    if os.path.exists(ZIP):
        os.remove(ZIP)
    with zipfile.ZipFile(ZIP,'w',zipfile.ZIP_DEFLATED) as z:
        for root,_,files in os.walk(OUT):
            for fn in sorted(files):
                fp=os.path.join(root,fn)
                z.write(fp, os.path.relpath(fp, OUT))

    size=os.path.getsize(ZIP)
    print('OK  index.html =', os.path.getsize(os.path.join(OUT,'index.html')), 'bytes')
    print('OK  zip =', ZIP, size, 'bytes')

if __name__=='__main__':
    main()
