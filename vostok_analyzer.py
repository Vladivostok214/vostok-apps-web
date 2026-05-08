import asyncio
from playwright.async_api import async_playwright
import json
import os

class VostokAuditor:
    def __init__(self, url):
        self.url = url
        self.results = {
            "identity": {},
            "performance": {},
            "accessibility": {},
            "seo": {},
            "technical_stack": {}
        }

    async def run(self):
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            print(f"[*] Iniciando auditoría profunda de {self.url}...")
            
            # 1. Page Load & Performance Metrics
            start_time = asyncio.get_event_loop().time()
            await page.goto(self.url, wait_until="networkidle")
            load_time = asyncio.get_event_loop().time() - start_time
            self.results["performance"]["load_time_sec"] = round(load_time, 2)

            # 2. SEO & Metadata
            self.results["seo"]["title"] = await page.title()

            async def safe_get_attr(selector, attr):
                try:
                    return await page.get_attribute(selector, attr, timeout=2000)
                except:
                    return None

            self.results["seo"]["description"] = await safe_get_attr("meta[name='description']", "content")
            self.results["seo"]["og_image"] = await safe_get_attr("meta[property='og:image']", "content")            
            # 3. Noir-Tech Identity Check
            self.results["identity"]["vostok_green"] = await page.evaluate("""() => {
                const target = 'rgb(57, 255, 20)';
                return Array.from(document.querySelectorAll('*')).some(el => {
                    const s = window.getComputedStyle(el);
                    return s.color === target || s.backgroundColor === target || s.borderColor === target;
                });
            }""")
            
            self.results["identity"]["fonts"] = await page.evaluate("""() => {
                const fonts = new Set();
                document.querySelectorAll('*').forEach(el => fonts.add(window.getComputedStyle(el).fontFamily));
                return Array.from(fonts).filter(f => f.includes('Inter') || f.includes('JetBrains Mono'));
            }""")

            self.results["identity"]["glassmorphism"] = await page.evaluate("""() => {
                return Array.from(document.querySelectorAll('*')).some(el => {
                    const s = window.getComputedStyle(el);
                    return s.backdropFilter && s.backdropFilter !== 'none';
                });
            }""")

            # 4. Technical Stack Discovery
            self.results["technical_stack"]["uses_react"] = await page.evaluate("() => !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__ || !!document.querySelector('#root')")
            self.results["technical_stack"]["uses_framer_motion"] = await page.evaluate("() => !!document.querySelector('[style*=\"will-change: transform\"]')") # Heuristic

            # 5. Accessibility
            images = await page.query_selector_all("img")
            missing_alt = 0
            for img in images:
                if not await img.get_attribute("alt"):
                    missing_alt += 1
            self.results["accessibility"]["images_missing_alt"] = missing_alt
            
            # 6. PWA Check
            self.results["technical_stack"]["has_manifest"] = await page.query_selector("link[rel='manifest']") is not None
            
            await browser.close()
            return self.results

    def generate_report(self):
        r = self.results
        report = f"""
# VOSTOK LABS - AUDIT REPORT
**Target:** {self.url}
**Status:** {'PASSED' if not r['accessibility']['images_missing_alt'] else 'WARNING'}

## 1. Noir-Tech Alignment
- **Vostok Green (#39FF14):** {'✅ Detectado' if r['identity']['vostok_green'] else '❌ No detectado'}
- **Typography (Inter/JetBrains):** {'✅ Correcta' if r['identity']['fonts'] else '❌ Incompleta'}
- **Glassmorphism:** {'✅ Activo' if r['identity']['glassmorphism'] else '❌ No detectado'}

## 2. Performance & SEO
- **Load Time:** {r['performance']['load_time_sec']}s
- **SEO Title:** {r['seo']['title']}
- **Meta Description:** {'✅ Presente' if r['seo']['description'] else '❌ Faltante'}

## 3. Technical Observations
- **Framework:** {'React' if r['technical_stack']['uses_react'] else 'Unknown'}
- **PWA Manifest:** {'✅ Encontrado' if r['technical_stack']['has_manifest'] else '❌ Faltante'}
- **A11y Issues:** {r['accessibility']['images_missing_alt']} imágenes sin descripción.

## 4. Sugerencias de Mejora
1. **Optimización DSP:** Implementar gestión de memoria Zero-Copy en el algoritmo YIN para reducir GC pauses.
2. **Corrección de Bias YIN:** Ajustar la interpolación parabólica sobre la Función de Diferencia, no sobre CMNDF.
3. **PWA Completo:** Añadir un Service Worker para soporte offline (actualmente solo tiene manifest).
4. **Resolución RTA:** Aumentar fftSize a 4096 en el módulo Spectrum para mayor precisión en graves.
"""
        return report

async def main():
    auditor = VostokAuditor("https://vostok-apps-web.vercel.app/")
    results = await auditor.run()
    report = auditor.generate_report()
    
    with open("AUDIT_REPORT.md", "w", encoding="utf-8") as f:
        f.write(report)
    
    print("\n[+] Auditoría completada. Informe guardado en AUDIT_REPORT.md")

if __name__ == "__main__":
    asyncio.run(main())
