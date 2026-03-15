import React, { useRef, useState, useEffect } from 'react';
import { PenTool, Trash2, Check, X, Type, Upload } from 'lucide-react';
import type { Language } from '../../../types';

interface SignatureModalProps {
  language: Language;
  documentTitle: string;
  signerName: string;
  onSign: (signatureDataUrl: string, signedAt: string) => void;
  onClose: () => void;
}

type SignMode = 'draw' | 'type' | 'upload';

const FONT_STYLES = [
  { label: 'Signature 1', font: 'cursive', style: 'italic' },
  { label: 'Signature 2', font: 'Georgia, serif', style: 'italic' },
  { label: 'Signature 3', font: '"Brush Script MT", cursive', style: 'normal' },
];

const SignatureModal: React.FC<SignatureModalProps> = ({
  language, documentTitle, signerName, onSign, onClose
}) => {
  const isAr = language === 'ar';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<SignMode>('draw');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [typedName, setTypedName] = useState(signerName);
  const [selectedFont, setSelectedFont] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (mode === 'draw') clearCanvas();
  }, [mode]);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    setIsDrawing(true);
    lastPos.current = getPos(e, canvas);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current!.x, lastPos.current!.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastPos.current = pos;
    setHasDrawn(true);
  };

  const stopDraw = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const getSignatureDataUrl = (): string => {
    if (mode === 'draw') {
      return canvasRef.current?.toDataURL('image/png') ?? '';
    }
    if (mode === 'type') {
      const canvas = document.createElement('canvas');
      canvas.width = 500; canvas.height = 120;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${FONT_STYLES[selectedFont].style} 52px ${FONT_STYLES[selectedFont].font}`;
      ctx.fillStyle = '#1e293b';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(typedName, 250, 60);
      return canvas.toDataURL('image/png');
    }
    return '';
  };

  const handleConfirm = () => {
    if (!agreed) return;
    const dataUrl = getSignatureDataUrl();
    if (!dataUrl) return;
    onSign(dataUrl, new Date().toISOString());
  };

  const canConfirm = agreed && (
    (mode === 'draw' && hasDrawn) ||
    (mode === 'type' && typedName.trim().length > 0)
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl"
        onClick={e => e.stopPropagation()}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b dark:border-slate-800">
          <div className="flex items-center gap-2">
            <PenTool size={20} className="text-legal-gold" />
            <div>
              <h2 className="font-bold text-lg">{isAr ? 'التوقيع الإلكتروني' : 'Signature électronique'}</h2>
              <p className="text-xs text-slate-500 truncate max-w-xs">{documentTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Mode tabs */}
          <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {(['draw', 'type'] as SignMode[]).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === m ? 'bg-white dark:bg-slate-700 shadow text-legal-gold' : 'text-slate-500'
                }`}
              >
                {m === 'draw' ? <PenTool size={14} /> : <Type size={14} />}
                {m === 'draw' ? (isAr ? 'رسم' : 'Dessiner') : (isAr ? 'كتابة' : 'Taper')}
              </button>
            ))}
          </div>

          {/* Draw mode */}
          {mode === 'draw' && (
            <div className="space-y-2">
              <p className="text-xs text-slate-500">{isAr ? 'ارسم توقيعك أدناه:' : 'Dessinez votre signature ci-dessous :'}</p>
              <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden bg-white">
                <canvas
                  ref={canvasRef}
                  width={460}
                  height={140}
                  className="w-full touch-none cursor-crosshair"
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={stopDraw}
                  onMouseLeave={stopDraw}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={stopDraw}
                />
                {!hasDrawn && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-slate-300 text-sm">{isAr ? 'وقّع هنا...' : 'Signez ici...'}</p>
                  </div>
                )}
              </div>
              <button onClick={clearCanvas} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500 transition-colors">
                <Trash2 size={12} />
                {isAr ? 'مسح' : 'Effacer'}
              </button>
            </div>
          )}

          {/* Type mode */}
          {mode === 'type' && (
            <div className="space-y-3">
              <input
                type="text"
                value={typedName}
                onChange={e => setTypedName(e.target.value)}
                placeholder={isAr ? 'اكتب اسمك...' : 'Tapez votre nom...'}
                className="w-full px-4 py-2 border dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-legal-gold outline-none"
              />
              <div className="grid grid-cols-3 gap-2">
                {FONT_STYLES.map((f, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedFont(i)}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      selectedFont === i ? 'border-legal-gold bg-legal-gold/5' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span style={{ fontFamily: f.font, fontStyle: f.style as any, fontSize: '18px' }}>
                      {typedName || 'Signature'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Legal agreement */}
          <label className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-legal-gold rounded"
            />
            <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {isAr
                ? 'أقر بأن هذا التوقيع الإلكتروني يعادل توقيعي اليدوي وأنني أوافق على محتوى هذه الوثيقة.'
                : 'Je certifie que cette signature électronique équivaut à ma signature manuscrite et que j\'approuve le contenu de ce document.'}
            </span>
          </label>

          {/* Signer info */}
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>{isAr ? 'الموقّع:' : 'Signataire :'} <strong className="text-slate-600 dark:text-slate-300">{signerName}</strong></span>
            <span>{new Date().toLocaleDateString(isAr ? 'ar-DZ' : 'fr-DZ')}</span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 border dark:border-slate-700 rounded-xl font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              {isAr ? 'إلغاء' : 'Annuler'}
            </button>
            <button
              onClick={handleConfirm}
              disabled={!canConfirm}
              className="flex-1 px-4 py-2.5 bg-legal-gold text-white rounded-xl font-bold text-sm hover:bg-legal-gold/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Check size={16} />
              {isAr ? 'تأكيد التوقيع' : 'Confirmer la signature'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignatureModal;
