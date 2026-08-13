// PDF fallback renderer via pdf.js in a locked-down WebView.
//
// Used when native react-native-pdf fails (older RN versions, unusual PDF
// shapes, or per-platform quirks). Loads pdf.js 3.11.174 from a CDN cascade
// so a single CDN being slow/blocked/unreachable doesn't break the preview.
//
// SECURITY:
// - WebView origin is locked down to the inline document + the three pinned
//   pdf.js CDN origins via onShouldStartLoadWithRequest.
// - Inline HTML gets baseUrl 'https://localhost/' so Android assigns a secure
//   origin (without it, opaque-origin silently blocks external scripts).
// - Base64 payload is sanitised before being injected into the inline <script>.
// - allowFileAccess + allowFileAccessFromFileURLs + allowUniversalAccessFromFileURLs
//   all OFF; domStorage OFF; mixedContentMode 'never'.
//
// LONG-TERM FIX (defer to v1.x): bundle pdf.js locally via expo-asset and load
// it from the file scheme — removes CDN trust. If we stay on CDNs, add SRI
// hashes to the injected <script> tags. We deliberately do NOT fabricate SRI
// hashes — incorrect ones silently break loading.
//
// Ported from POC: src/components/pdf/PdfJsWebView.js
// DIRECT PORT — TS types only.

import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

const ALLOWED_SCRIPT_ORIGINS = [
  'https://cdnjs.cloudflare.com/',
  'https://cdn.jsdelivr.net/',
  'https://unpkg.com/',
];

const PDFJS_SOURCES = [
  {
    lib: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    worker: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
  },
  {
    lib: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/pdf.min.js',
    worker: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/pdf.worker.min.js',
  },
  {
    lib: 'https://unpkg.com/pdfjs-dist@3.11.174/legacy/build/pdf.min.js',
    worker: 'https://unpkg.com/pdfjs-dist@3.11.174/legacy/build/pdf.worker.min.js',
  },
];

function getBase64Payload(pdfDataUri: string | undefined): string {
  if (!pdfDataUri) return '';
  const [, base64Payload] = pdfDataUri.split(',');
  const raw = base64Payload || pdfDataUri;
  // Strip anything outside the base64 alphabet so the value can't break out
  // of the inline <script> string it is injected into.
  return raw.replace(/[^A-Za-z0-9+/=]/g, '');
}

function createPdfHtml(pdfDataUri: string | undefined): string {
  const base64Payload = getBase64Payload(pdfDataUri);
  const sources = JSON.stringify(PDFJS_SOURCES);

  return `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=4, user-scalable=yes" />
    <style>
      html, body { background: #ffffff; margin: 0; min-height: 100%; padding: 0; }
      #viewer { box-sizing: border-box; padding: 0; width: 100%; }
      canvas { background: #ffffff; display: block; margin: 0 auto 12px; max-width: 100%; }
      #status { color: #637083; font: 600 14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 28px 16px; text-align: center; }
    </style>
  </head>
  <body>
    <div id="status">Loading resume...</div>
    <div id="viewer"></div>
    <script>
      var pdfBase64 = "${base64Payload}";
      var pdfJsSources = ${sources};
      var statusNode = document.getElementById("status");
      var viewerNode = document.getElementById("viewer");

      function postMessage(type, payload) {
        if (!window.ReactNativeWebView) return;
        window.ReactNativeWebView.postMessage(JSON.stringify(Object.assign({ type: type }, payload || {})));
      }
      function fail(message) {
        statusNode.textContent = message;
        postMessage("error", { message: message });
      }
      function base64ToBytes(base64) {
        var raw = window.atob(base64);
        var bytes = new Uint8Array(raw.length);
        for (var i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
        return bytes;
      }
      function loadScript(url) {
        return new Promise(function (resolve, reject) {
          var s = document.createElement("script");
          s.src = url;
          s.onload = function () { resolve(); };
          s.onerror = function () { reject(new Error("Failed to load " + url)); };
          document.head.appendChild(s);
        });
      }
      async function ensurePdfJs() {
        for (var i = 0; i < pdfJsSources.length; i++) {
          try {
            await loadScript(pdfJsSources[i].lib);
            if (window.pdfjsLib) return pdfJsSources[i].worker;
          } catch (e) { /* try next CDN */ }
        }
        return null;
      }
      async function renderPage(pdf, pageNumber) {
        var page = await pdf.getPage(pageNumber);
        var unscaled = page.getViewport({ scale: 1 });
        var availableWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0) - 24;
        var scale = Math.max(0.1, availableWidth / unscaled.width);
        var viewport = page.getViewport({ scale: scale });
        var outputScale = window.devicePixelRatio || 1;
        var canvas = document.createElement("canvas");
        var ctx = canvas.getContext("2d");
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = Math.floor(viewport.width) + "px";
        canvas.style.height = Math.floor(viewport.height) + "px";
        ctx.setTransform(outputScale, 0, 0, outputScale, 0, 0);
        viewerNode.appendChild(canvas);
        await page.render({ canvasContext: ctx, viewport: viewport }).promise;
      }
      async function renderPdf() {
        try {
          if (!pdfBase64) { fail("Resume preview data is empty."); return; }
          var workerSrc = await ensurePdfJs();
          if (!window.pdfjsLib) {
            fail("Could not load the PDF engine. Please check the device's internet connection and try again.");
            return;
          }
          if (workerSrc) window.pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
          var pdf = await window.pdfjsLib.getDocument({ data: base64ToBytes(pdfBase64) }).promise;
          statusNode.style.display = "none";
          for (var p = 1; p <= pdf.numPages; p++) await renderPage(pdf, p);
          postMessage("loaded", { pages: pdf.numPages });
        } catch (error) {
          fail(error && error.message ? error.message : "Unable to render resume preview.");
        }
      }
      window.addEventListener("load", renderPdf);
    </script>
  </body>
</html>`;
}

interface WebViewFallbackProps {
  pdfDataUri: string;
  onError?: (message: string) => void;
  onLoad?: (pages: number) => void;
}

interface WebViewMessage {
  type: 'loaded' | 'error';
  pages?: number;
  message?: string;
}

export default function WebViewFallback({ pdfDataUri, onError, onLoad }: WebViewFallbackProps) {
  const html = useMemo(() => createPdfHtml(pdfDataUri), [pdfDataUri]);

  function handleShouldStartLoadWithRequest(request: { url?: string }): boolean {
    const url = request.url ?? '';
    if (
      url.startsWith('about:') ||
      url.startsWith('data:') ||
      url.startsWith('https://localhost/')
    ) {
      return true;
    }
    return ALLOWED_SCRIPT_ORIGINS.some((origin) => url.startsWith(origin));
  }

  function handleMessage(event: WebViewMessageEvent) {
    try {
      const message = JSON.parse(event.nativeEvent.data) as WebViewMessage;
      if (message.type === 'loaded') onLoad?.(message.pages ?? 0);
      if (message.type === 'error') onError?.(message.message ?? 'Unable to render resume preview.');
    } catch {
      // ignore non-JSON messages
    }
  }

  return (
    <View style={styles.container}>
      <WebView
        allowFileAccess={false}
        allowFileAccessFromFileURLs={false}
        allowUniversalAccessFromFileURLs={false}
        domStorageEnabled={false}
        javaScriptEnabled
        mixedContentMode="never"
        onError={(event) =>
          onError?.(event.nativeEvent?.description ?? 'Unable to load resume preview.')
        }
        onMessage={handleMessage}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        originWhitelist={['https://*']}
        setSupportMultipleWindows={false}
        source={{ html, baseUrl: 'https://localhost/' }}
        style={styles.webView}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#ffffff', flex: 1 },
  webView: { backgroundColor: '#ffffff', flex: 1 },
});
