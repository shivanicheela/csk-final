// protections.ts
// Enhanced watermark + comprehensive front-end security

export function initProtections(userEmail: string = 'user@example.com', label = 'CSK - Civil Services Kendra'){
  try{
    // Create enhanced watermark with user info and timestamp
    const timestamp = new Date().toLocaleString('en-IN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const watermarkText = `${label} | ${userEmail} | ${timestamp}`;
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'><defs><pattern id='watermark' x='0' y='0' width='400' height='300' patternUnits='userSpaceOnUse'><text x='200' y='150' fill='rgba(220, 38, 38, 0.08)' font-family='Arial, sans-serif' font-size='24' font-weight='bold' text-anchor='middle' dominant-baseline='middle' transform='rotate(-35 200 150)'>${escapeXml(watermarkText)}</text></pattern></defs><rect width='100%' height='100%' fill='url(#watermark)'/></svg>`;
    const encoded = encodeURIComponent(svg);

    // Create persistent watermark overlay
    let el = document.getElementById('csk-watermark');
    if(!el){
      el = document.createElement('div');
      el.id = 'csk-watermark';
      el.className = 'watermark-overlay';
      document.body.appendChild(el);
    }
    (el as HTMLElement).style.backgroundImage = `url("data:image/svg+xml;charset=utf-8,${encoded}")`;
    (el as HTMLElement).style.backgroundSize = '400px 300px';
    (el as HTMLElement).style.backgroundRepeat = 'repeat';
    (el as HTMLElement).style.backgroundAttachment = 'fixed';
    (el as HTMLElement).style.pointerEvents = 'none';
    (el as HTMLElement).style.position = 'fixed';
    (el as HTMLElement).style.top = '0';
    (el as HTMLElement).style.left = '0';
    (el as HTMLElement).style.width = '100%';
    (el as HTMLElement).style.height = '100%';
    (el as HTMLElement).style.zIndex = '1000';
    (el as HTMLElement).style.mixBlendMode = 'multiply';

    // Also add to document root for additional protection
    addWatermarkToElement(document.documentElement, watermarkText);

    // disable right-click
    window.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // disable some hotkeys
    window.addEventListener('keydown', (e) => {
      if(e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'i') || (e.ctrlKey && e.key.toLowerCase() === 's') || (e.ctrlKey && e.key.toLowerCase() === 'p') || (e.ctrlKey && e.key.toLowerCase() === 'u')){
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);

    // Disable copy for content inside protected areas
    blockCopyPaste();
    
    // Disable drag and drop
    blockDragDrop();
    
    // Block direct download links
    blockDownloads();
    
    // Monitor for screen recording attempts
    detectScreenRecording();
    
    // Prevent developer console from accessing sensitive data
    protectConsole(userEmail);
    
  }catch(err){
    console.warn('initProtections failed', err);
  }
}

// Add watermark to specific elements
function addWatermarkToElement(el: HTMLElement, watermarkText: string) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'><defs><pattern id='water-${Date.now()}' x='0' y='0' width='400' height='300' patternUnits='userSpaceOnUse'><text x='200' y='150' fill='rgba(220, 38, 38, 0.08)' font-family='Arial, sans-serif' font-size='20' font-weight='bold' text-anchor='middle' dominant-baseline='middle' transform='rotate(-35 200 150)'>${escapeXml(watermarkText)}</text></pattern></defs><rect width='100%' height='100%' fill='url(#water-${Date.now()})'/></svg>`;
  const encoded = encodeURIComponent(svg);
  el.style.backgroundImage = `url("data:image/svg+xml;charset=utf-8,${encoded}")`;
  el.style.backgroundAttachment = 'fixed';
}

function escapeXml(unsafe: string){
  return unsafe.replace(/[<>&"']/g, (c)=>{
    switch(c){
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '"': return '&quot;';
      case "'": return '&#039;';
      default: return c;
    }
  });
}

// Block copy-paste functionality
function blockCopyPaste(){
  document.addEventListener('copy', (e) => {
    e.preventDefault();
    showNotification('📋 Copying content is not allowed');
  });
  
  document.addEventListener('cut', (e) => {
    e.preventDefault();
    showNotification('✂️ Cutting content is not allowed');
  });
  
  document.addEventListener('paste', (e) => {
    e.preventDefault();
    showNotification('📌 Pasting content is not allowed');
  });
}

// Protect console from access
function protectConsole(userEmail: string){
  const originalLog = console.log;
  const originalWarn = console.warn;
  const logAttempts: any[] = [];
  
  // Log console access attempts
  console.log = function(...args: any[]){
    logAttempts.push({
      timestamp: new Date(),
      email: userEmail,
      attempt: args
    });
    
    // Still allow some logging for debugging but with restrictions
    if(originalLog && logAttempts.length <= 5){
      originalLog.apply(console, args);
    } else if(logAttempts.length > 5){
      // After 5 attempts, show warning
      originalWarn.call(console, '⚠️ Too many console access attempts detected');
    }
  };
  
  // Disable console access via keyboard shortcut
  const preventConsoleShortcuts = (e: KeyboardEvent) => {
    // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
    if(e.key === 'F12' || 
       (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) ||
       (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j')) ||
       (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c'))){
      e.preventDefault();
      e.stopPropagation();
    }
  };
  
  document.addEventListener('keydown', preventConsoleShortcuts, true);
}

// Block drag and drop
function blockDragDrop(){
  document.addEventListener('dragstart', (e) => {
    if((e.target as HTMLElement)?.closest('.protected-content')){
      e.preventDefault();
      showNotification('🚫 Dragging content is not allowed');
    }
  });
  
  document.addEventListener('drop', (e) => {
    e.preventDefault();
    showNotification('🚫 Dropping files is not allowed');
  });
  
  document.addEventListener('dragover', (e) => {
    e.preventDefault();
  });
}

// Block download links
function blockDownloads(){
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const href = target instanceof HTMLAnchorElement ? target.getAttribute('href') : null;
    
    if(href && (href.endsWith('.pdf') || href.endsWith('.zip') || href.endsWith('.docx') || href.includes('download'))){
      e.preventDefault();
      showNotification('⬇️ Downloads are not permitted for protected content');
    }
  }, true);
}

// Detect screen recording via permissions API (limited support)
function detectScreenRecording(){
  // This uses the permissions API which is supported in some browsers
  if(navigator.permissions && navigator.permissions.query){
    navigator.permissions.query({ name: 'display-capture' as any }).then((result) => {
      if(result.state === 'granted'){
        console.warn('Screen capture permission detected');
      }
    }).catch(() => {
      // API not available
    });
  }
  
  // Monitor visible video/canvas elements which might indicate screen recording
  const observer = new MutationObserver(() => {
    const videos = document.querySelectorAll('video');
    const canvases = document.querySelectorAll('canvas');
    
    if(videos.length > 1 || canvases.length > 1){
      // Could be screen recording tools
      console.warn('Multiple media elements detected');
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
  });
}

// Show notification toast
function showNotification(message: string){
  const id = `toast-${Date.now()}`;
  const toast = document.createElement('div');
  toast.id = id;
  toast.className = 'csk-protection-toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #ff6b6b;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-weight: bold;
    z-index: 9999;
    animation: slideIn 0.3s ease-out;
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

