import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Printer, 
  Maximize2, 
  Minimize2, 
  FileText, 
  Sparkles, 
  ShieldCheck, 
  KeyRound, 
  Layers, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  Cpu, 
  Database, 
  Lock, 
  Presentation,
  Share2
} from 'lucide-react';
import { PRESENTATION_SLIDES, PresentationSlide } from '../data/presentationSlides';
import { generatePresentationPdf } from '../utils/generatePresentationPdf';

interface ProjectPresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectPresentationModal: React.FC<ProjectPresentationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);

  const currentSlide: PresentationSlide = PRESENTATION_SLIDES[currentSlideIndex];
  const totalSlides = PRESENTATION_SLIDES.length;

  // Keyboard navigation (Arrow keys + Esc)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        e.preventDefault();
        setCurrentSlideIndex(prev => (prev < totalSlides - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentSlideIndex(prev => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, totalSlides, isFullscreen, onClose]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentSlideIndex < totalSlides - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
    }
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    setPdfSuccess(false);
    try {
      await generatePresentationPdf(true);
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className={`w-full flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-all duration-300 ${
          isFullscreen 
            ? 'fixed inset-0 !rounded-none !border-0 z-50 h-screen max-w-none' 
            : 'max-w-6xl max-h-[94vh] h-[860px]'
        }`}
        style={{
          background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
          borderColor: 'rgba(44, 83, 100, 0.65)',
        }}
      >
        {/* Top Control Bar */}
        <div className="px-4 sm:px-6 py-3 border-b flex items-center justify-between gap-3 bg-black/40 backdrop-blur-md" style={{ borderColor: 'rgba(44, 83, 100, 0.4)' }}>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-cyan-950/60 border border-cyan-500/40 text-cyan-300">
              <Presentation className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm sm:text-base text-white tracking-tight">
                  BioScan.AI <span className="text-cyan-400 font-normal">Project Presentation Deck</span>
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] mono font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-400/30">
                  Slide {currentSlideIndex + 1} of {totalSlides}
                </span>
              </div>
              <span className="text-[11px] mono text-slate-400 hidden sm:block">
                Trustworthy Corporate &bull; 128-D Biometric Vectors &bull; Zero-Trust Access Control
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Toggle Speaker Notes */}
            <button
              onClick={() => setShowSpeakerNotes(!showSpeakerNotes)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center space-x-1.5 transition-all ${
                showSpeakerNotes
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                  : 'bg-black/30 border-slate-700/60 text-slate-300 hover:text-white'
              }`}
              title="Toggle verbatim presenter speech notes"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Speaker Notes</span>
            </button>

            {/* Download PDF Button */}
            <button
              id="btn-download-ppt-pdf"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold border flex items-center space-x-1.5 transition-all shadow-md bg-cyan-500 hover:bg-cyan-400 text-slate-950"
              title="Download 12-page landscape presentation deck as PDF"
            >
              <Download className={`w-3.5 h-3.5 ${isGeneratingPdf ? 'animate-bounce' : ''}`} />
              <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download as PDF'}</span>
            </button>

            {/* Print */}
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg border border-slate-700/60 bg-black/30 text-slate-300 hover:text-white transition-colors hidden sm:inline-flex"
              title="Print slide deck / Save to PDF"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg border border-slate-700/60 bg-black/30 text-slate-300 hover:text-white transition-colors"
              title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-slate-700/60 bg-black/30 text-slate-300 hover:text-white hover:bg-red-500/20 hover:border-red-500/40 transition-colors"
              title="Close Presentation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PDF Download Confirmation Banner */}
        {pdfSuccess && (
          <div className="bg-emerald-950/80 border-b border-emerald-500/40 px-4 py-2 flex items-center justify-between text-xs text-emerald-300 animate-in fade-in duration-200">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>
                <strong>Success!</strong> Presentation PDF has been downloaded as <code>BioScan_AI_Enterprise_Project_Presentation.pdf</code>.
              </span>
            </div>
            <button onClick={() => setPdfSuccess(false)} className="text-emerald-400 hover:text-white text-xs underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Slide Canvas Area */}
        <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-8 relative">
          
          {/* Slide Frame Reticles */}
          <div className="bracket b-tl !w-4 !h-4 !border-cyan-400 opacity-70" />
          <div className="bracket b-tr !w-4 !h-4 !border-cyan-400 opacity-70" />
          <div className="bracket b-bl !w-4 !h-4 !border-cyan-400 opacity-70" />
          <div className="bracket b-br !w-4 !h-4 !border-cyan-400 opacity-70" />

          {/* Slide Content Card */}
          <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col justify-between space-y-6">
            
            {/* Header / Title Area */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs mono font-bold uppercase tracking-wider bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
                  {currentSlide.category}
                </span>
                <span className="text-xs mono px-2 py-0.5 rounded bg-black/40 border border-slate-700/60 text-slate-300">
                  {currentSlide.badge}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight mb-2">
                {currentSlide.title}
              </h1>

              <p className="text-sm sm:text-base text-cyan-100/80 font-medium leading-relaxed">
                {currentSlide.subtitle}
              </p>
            </div>

            {/* Executive Summary Callout */}
            <div className="p-4 rounded-xl border bg-black/35 border-cyan-800/40 relative overflow-hidden">
              <div className="w-1 absolute top-0 left-0 bottom-0 bg-cyan-400" />
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed pl-2 font-normal">
                {currentSlide.summary}
              </p>
            </div>

            {/* Key Content Points in 2x2 Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {currentSlide.keyPoints.map((point, pIdx) => (
                <div 
                  key={pIdx}
                  className="p-4 rounded-xl border transition-all hover:border-cyan-500/50 bg-black/25 border-cyan-950/60 relative group"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" />
                      <h3 className="font-bold text-xs sm:text-sm text-white tracking-tight">
                        {point.heading}
                      </h3>
                    </div>
                    {point.highlight && (
                      <span className="text-[10px] mono px-2 py-0.5 rounded font-semibold bg-cyan-950 text-cyan-300 border border-cyan-700/40 whitespace-nowrap">
                        {point.highlight}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed pl-4">
                    {point.description}
                  </p>
                </div>
              ))}
            </div>

            {/* KPI Metrics Ribbon */}
            {currentSlide.metrics && currentSlide.metrics.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {currentSlide.metrics.map((metric, mIdx) => (
                  <div 
                    key={mIdx}
                    className="p-3 rounded-xl border bg-black/30 border-cyan-900/40 flex flex-col justify-between"
                  >
                    <div className="text-xl sm:text-2xl font-black text-cyan-400 tracking-tight">
                      {metric.value}
                    </div>
                    <div className="text-xs font-bold text-white mt-1">
                      {metric.label}
                    </div>
                    <div className="text-[10px] mono text-slate-400">
                      {metric.sublabel}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tech Specs Badges */}
            {currentSlide.techSpecs && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] mono text-slate-400 mr-1 uppercase">Architecture:</span>
                {currentSlide.techSpecs.map((spec, sIdx) => (
                  <span 
                    key={sIdx} 
                    className="px-2 py-0.5 rounded text-[10px] mono bg-slate-900/60 border border-slate-700/50 text-slate-300"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Speaker Notes Drawer (Expandable) */}
        {showSpeakerNotes && (
          <div className="border-t bg-black/70 backdrop-blur-md p-4 max-h-48 overflow-y-auto animate-in slide-in-from-bottom-2 duration-200" style={{ borderColor: 'rgba(44, 83, 100, 0.45)' }}>
            <div className="max-w-5xl mx-auto space-y-1">
              <div className="flex items-center justify-between text-xs text-cyan-300 font-bold mb-1">
                <span className="flex items-center space-x-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Presenter Speech Script (Slide {currentSlideIndex + 1} Talking Points):</span>
                </span>
                <span className="mono text-[10px] text-slate-400">Approx. 45-60 seconds reading time</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans italic bg-black/40 p-3 rounded-lg border border-slate-800">
                &ldquo;{currentSlide.speakerNotes}&rdquo;
              </p>
            </div>
          </div>
        )}

        {/* Bottom Slide Navigation Bar */}
        <div className="px-4 sm:px-6 py-3 border-t flex flex-wrap items-center justify-between gap-3 bg-black/50 backdrop-blur-md" style={{ borderColor: 'rgba(44, 83, 100, 0.4)' }}>
          
          {/* Previous Slide Button */}
          <button
            onClick={handlePrev}
            disabled={currentSlideIndex === 0}
            className="px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-black/30 border-slate-700/60 text-slate-200 hover:text-white hover:bg-white/5"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous Slide</span>
          </button>

          {/* Slide Indicator Thumbnails */}
          <div className="flex items-center space-x-1 overflow-x-auto py-1 max-w-md">
            {PRESENTATION_SLIDES.map((slide, sIdx) => {
              const isActive = sIdx === currentSlideIndex;
              return (
                <button
                  key={slide.id}
                  onClick={() => setCurrentSlideIndex(sIdx)}
                  className={`w-7 h-7 rounded-lg text-xs mono font-bold flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-md scale-105'
                      : 'bg-black/40 border border-slate-700/60 text-slate-400 hover:text-white hover:border-slate-500'
                  }`}
                  title={`Slide ${sIdx + 1}: ${slide.title}`}
                >
                  {sIdx + 1}
                </button>
              );
            })}
          </div>

          {/* Next Slide Button */}
          <button
            onClick={handleNext}
            disabled={currentSlideIndex === totalSlides - 1}
            className="px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-cyan-600/20 border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/30"
          >
            <span className="hidden sm:inline">Next Slide</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
