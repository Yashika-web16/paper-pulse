import React, { useState, useCallback } from 'react';
import { Upload, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'application/pdf' || file.type.startsWith('image/'))) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative group cursor-pointer transition-all duration-300 ${
          isDragging ? 'scale-105' : 'scale-100'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className={`
          p-12 rounded-3xl border-4 border-dashed transition-all duration-500
          ${isDragging 
            ? 'border-neon-green bg-neon-green/10 shadow-[0_0_30px_rgba(0,255,0,0.2)]' 
            : 'border-white/20 bg-white/5 hover:border-neon-blue/50 hover:bg-neon-blue/5'
          }
          flex flex-col items-center justify-center gap-6
        `}>
          {isLoading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-16 h-16 text-neon-green animate-spin" />
              <p className="text-xl font-display font-bold animate-pulse">Analyzing Paper...</p>
              <p className="text-white/50 text-sm">Our AI is reading through the lines</p>
            </div>
          ) : (
            <>
              <div className="relative">
                <div className="absolute -inset-4 bg-neon-blue/20 blur-2xl rounded-full group-hover:bg-neon-green/20 transition-colors" />
                <div className="relative flex gap-4">
                  <FileText className="w-12 h-12 text-neon-blue group-hover:text-neon-green transition-colors" />
                  <ImageIcon className="w-12 h-12 text-neon-pink group-hover:text-neon-green transition-colors" />
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="text-3xl font-display font-black mb-2 tracking-tight">
                  DROP YOUR <span className="text-neon-green">PAPER</span> HERE
                </h3>
                <p className="text-white/60 font-medium">
                  PDF or JPEG • We'll handle the rest
                </p>
              </div>

              <div className="mt-8 relative z-[100]">
                <button 
                  type="button"
                  className="px-12 py-5 bg-[#00FF00] text-black font-black uppercase tracking-[0.3em] border-4 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[5px] hover:translate-y-[5px] hover:shadow-none transition-all active:scale-95 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                    if (input) input.click();
                  }}
                >
                  Browse Files
                </button>
              </div>
            </>
          )}
        </div>

        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
          onChange={handleFileInput}
          accept=".pdf,image/*"
          disabled={isLoading}
        />
      </motion.div>
      
      <div className="mt-8 grid grid-cols-3 gap-4 text-center">
        {['AI Summary', 'Interactive Charts', 'Process Flows'].map((feature) => (
          <div key={feature} className="p-4 glass rounded-xl text-xs font-bold uppercase tracking-widest text-white/40">
            {feature}
          </div>
        ))}
      </div>
    </div>
  );
};
