import React, { useState } from 'react';

function TrafficLights({ onClose, onToggleSize }: { onClose: () => void; onToggleSize: () => void }) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 border border-red-700/30 transition-colors cursor-pointer"
      />
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="w-3 h-3 rounded-full bg-amber-400 hover:bg-amber-500 border border-amber-600/30 transition-colors cursor-pointer"
      />
      <button
        type="button"
        onClick={onToggleSize}
        aria-label="Alternar tamanho"
        className="w-3 h-3 rounded-full bg-emerald-500 hover:bg-emerald-600 border border-emerald-700/30 transition-colors cursor-pointer"
      />
    </div>
  );
}

export default function Modal({
  onClose,
  title,
  subtitle,
  headerRight,
  maxWidth = 'max-w-5xl',
  children,
}: {
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerRight?: React.ReactNode;
  maxWidth?: string;
  children: React.ReactNode;
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm z-50 flex items-start justify-center p-4 md:p-8 overflow-auto">
      <div
        className={`tactile-raised bg-[#f4f5f8] w-full shadow-2xl flex flex-col p-6 gap-4 transition-all ${
          isFullscreen ? 'max-w-full min-h-[calc(100vh-4rem)]' : maxWidth
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200 gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <TrafficLights onClose={onClose} onToggleSize={() => setIsFullscreen(f => !f)} />
            {(title || subtitle) && (
              <div className="min-w-0">
                {title && <h2 className="text-zinc-900 font-display font-bold truncate text-base">{title}</h2>}
                {subtitle && <p className="text-zinc-500 text-xs font-mono truncate">{subtitle}</p>}
              </div>
            )}
          </div>
          {headerRight && <div className="flex items-center gap-2 shrink-0">{headerRight}</div>}
        </div>

        {children}
      </div>
    </div>
  );
}
