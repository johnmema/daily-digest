const coverPalette=['#f1e9df','#e6edf1','#eee6ed','#e6ece0','#f2e5de','#e1ece8','#ece8f2','#f1edda']
export function coverBackground(id:string){let hash=2166136261;for(const char of id)hash=Math.imul(hash^char.charCodeAt(0),16777619);return coverPalette[(hash>>>0)%coverPalette.length]}
