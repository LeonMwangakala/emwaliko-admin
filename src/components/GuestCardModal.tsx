import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';

interface GuestCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  guest: {
    id: number;
    name: string;
    title?: string;
    qr_code_path?: string;
    qr_code_base64?: string;
    card_class?: {
      id: number;
      name: string;
      max_guests: number;
    };
  } | null;
  eventId: number;
  cardTypeId: number;
  cardDesignPath?: string;
  onRefresh?: () => void;
}

interface CardType {
  id: number;
  name: string;
  show_guest_name?: boolean;
  show_card_class?: boolean;
  show_qr_code?: boolean;
}

interface Event {
  id: number;
  name: string;
  name_position_x?: number;
  name_position_y?: number;
  qr_position_x?: number;
  qr_position_y?: number;
  card_class_position_x?: number;
  card_class_position_y?: number;
  name_text_color?: string;
  card_class_text_color?: string;
  name_text_size?: number;
  card_class_text_size?: number;
}

const GuestCardModal: React.FC<GuestCardModalProps> = ({ 
  isOpen, 
  onClose, 
  guest, 
  eventId, 
  cardTypeId, 
  cardDesignPath,
  onRefresh
}) => {
  const [cardType, setCardType] = useState<CardType | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [cardDesignBase64, setCardDesignBase64] = useState<string>('');
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCardUrl, setGeneratedCardUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (isOpen && guest && cardDesignPath) {
      fetchCardType();
      fetchEvent();
      fetchCardDesign();
    }
  }, [isOpen, guest, cardDesignPath, cardTypeId]);

  useEffect(() => {
    if (cardDesignBase64 && cardType && event && guest) {
      setTimeout(() => {
        drawCard();
      }, 100);
    }
  }, [cardDesignBase64, cardType, event, guest]);

  const fetchCardType = async () => {
    try {
      const cardTypes = await apiService.getCardTypes() as CardType[];
      const currentCardType = cardTypes.find((ct: CardType) => ct.id === cardTypeId);
      setCardType(currentCardType || null);
    } catch (error) {
      console.error('Error fetching card type:', error);
      setError('Failed to fetch card type');
    }
  };

  const fetchEvent = async () => {
    try {
      const eventData = await apiService.getEvent(eventId) as Event;
      setEvent(eventData);
    } catch (error) {
      console.error('Error fetching event:', error);
      setError('Failed to fetch event data');
    }
  };

  const fetchCardDesign = async () => {
    if (!cardDesignPath) {
      setCardDesignBase64('');
      return;
    }

    try {
      const response = await apiService.getCardDesign(eventId) as any;
      setCardDesignBase64(response.card_design_base64);
    } catch (error) {
      console.error('Error fetching card design:', error);
      setError('Failed to fetch card design');
      setCardDesignBase64('');
    }
  };

  const drawCard = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    
    if (!canvas || !image || !guest || !cardType || !event) {
      return;
    }

    // Check if image is loaded
    if (!image.complete || image.naturalWidth === 0) {
      setTimeout(drawCard, 100);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background image
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    // Calculate positions based on 3000x4200 dimensions
    // Use event-specific positions with fallbacks to defaults
    const nameX = ((event.name_position_x ?? 50) / 100) * canvas.width;
    const nameY = ((event.name_position_y ?? 30) / 100) * canvas.height;
    const qrX = ((event.qr_position_x ?? 80) / 100) * canvas.width;
    const qrY = ((event.qr_position_y ?? 70) / 100) * canvas.height;
    const cardClassX = ((event.card_class_position_x ?? 20) / 100) * canvas.width;
    const cardClassY = ((event.card_class_position_y ?? 90) / 100) * canvas.height;

    // Helper function to draw text with shadow
    const drawTextWithShadow = (text: string, x: number, y: number, fontSize: number, color: string = '#000000') => {
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Add text shadow for better visibility
      ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      ctx.fillText(text, x, y);
      
      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    };

    // Draw guest name if enabled
    if (cardType.show_guest_name !== false) {
      const fontSize = event.name_text_size ?? 98;
      const textColor = event.name_text_color ?? '#000000';
      drawTextWithShadow(guest.name, nameX, nameY, fontSize, textColor);
    }

    // Draw QR code
    if (guest.qr_code_base64) {
      const qrImage = new Image();
      qrImage.crossOrigin = 'anonymous';
      
      qrImage.onload = () => {
        const freshCtx = canvas.getContext('2d');
        if (!freshCtx) return;
        
        // Redraw background image first
        freshCtx.drawImage(image, 0, 0, canvas.width, canvas.height);
        
        // Redraw guest name if enabled
        if (cardType.show_guest_name) {
          const fontSize = event.name_text_size ?? 98;
          const textColor = event.name_text_color ?? '#000000';
          drawTextWithShadow(guest.name, nameX, nameY, fontSize, textColor);
        }
        
        // Draw QR code
        const qrSize = 600;
        freshCtx.drawImage(qrImage, qrX - qrSize/2, qrY - qrSize/2, qrSize, qrSize);
        
        // Draw card class if enabled
        if (cardType.show_card_class && guest.card_class) {
          const fontSize = event.card_class_text_size ?? 60;
          const textColor = event.card_class_text_color ?? '#333333';
          drawTextWithShadow(guest.card_class.name, cardClassX, cardClassY, fontSize, textColor);
        }
      };
      
      qrImage.onerror = () => {
        const freshCtx = canvas.getContext('2d');
        if (freshCtx) {
          const qrSize = 600;
          freshCtx.fillStyle = '#ff0000';
          freshCtx.fillRect(qrX - qrSize/2, qrY - qrSize/2, qrSize, qrSize);
          freshCtx.fillStyle = '#ffffff';
          freshCtx.font = `${Math.round(qrSize/4)}px Arial`;
          freshCtx.textAlign = 'center';
          freshCtx.textBaseline = 'middle';
          freshCtx.fillText('QR Error', qrX, qrY);
        }
      };
      
      qrImage.src = guest.qr_code_base64;
    } else if (guest.qr_code_path) {
      // Fallback to URL if base64 is not available
      const qrImage = new Image();
      qrImage.crossOrigin = 'anonymous';
      
      qrImage.onload = () => {
        const freshCtx = canvas.getContext('2d');
        if (!freshCtx) return;
        
        // Redraw background image first
        freshCtx.drawImage(image, 0, 0, canvas.width, canvas.height);
        
        // Redraw guest name if enabled
        if (cardType.show_guest_name) {
          const fontSize = event.name_text_size ?? 98;
          const textColor = event.name_text_color ?? '#000000';
          drawTextWithShadow(guest.name, nameX, nameY, fontSize, textColor);
        }
        
        // Draw QR code
        const qrSize = 600;
        freshCtx.drawImage(qrImage, qrX - qrSize/2, qrY - qrSize/2, qrSize, qrSize);
        
        // Draw card class if enabled
        if (cardType.show_card_class && guest.card_class) {
          const fontSize = event.card_class_text_size ?? 60;
          const textColor = event.card_class_text_color ?? '#333333';
          drawTextWithShadow(guest.card_class.name, cardClassX, cardClassY, fontSize, textColor);
        }
      };
      
      qrImage.onerror = () => {
        const freshCtx = canvas.getContext('2d');
        if (freshCtx) {
          const qrSize = 600;
          freshCtx.fillStyle = '#ff0000';
          freshCtx.fillRect(qrX - qrSize/2, qrY - qrSize/2, qrSize, qrSize);
          freshCtx.fillStyle = '#ffffff';
          freshCtx.font = `${Math.round(qrSize/4)}px Arial`;
          freshCtx.textAlign = 'center';
          freshCtx.textBaseline = 'middle';
          freshCtx.fillText('QR Error', qrX, qrY);
        }
      };
      
      // Construct full URL for QR code
      const qrCodeUrl = guest.qr_code_path.startsWith('http') 
        ? guest.qr_code_path 
        : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/storage/${guest.qr_code_path}`;
      
      qrImage.src = qrCodeUrl;
    } else {
      // Draw a placeholder rectangle if no QR code
      const qrSize = 600;
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(qrX - qrSize/2, qrY - qrSize/2, qrSize, qrSize);
      ctx.fillStyle = '#ffffff';
      ctx.font = `${Math.round(qrSize/4)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('NO QR', qrX, qrY);
    }

    // Draw card class if enabled
    if (cardType.show_card_class && guest.card_class) {
      const fontSize = event.card_class_text_size ?? 60;
      const textColor = event.card_class_text_color ?? '#333333';
      drawTextWithShadow(guest.card_class.name, cardClassX, cardClassY, fontSize, textColor);
    }
  };

  // Helper function to compress image
  const compressImage = (canvas: HTMLCanvasElement, maxSizeKB: number = 700): string => {
    let quality = 0.9;
    let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
    
    // Calculate size in KB
    const sizeInKB = (compressedDataUrl.length * 0.75) / 1024;
    
    // If still too large, reduce quality
    while (sizeInKB > maxSizeKB && quality > 0.1) {
      quality -= 0.1;
      compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
    }
    
    // If still too large, resize the canvas
    if (sizeInKB > maxSizeKB) {
      const scale = Math.sqrt(maxSizeKB / sizeInKB);
      const newWidth = Math.floor(canvas.width * scale);
      const newHeight = Math.floor(canvas.height * scale);
      
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCanvas.width = newWidth;
        tempCanvas.height = newHeight;
        tempCtx.drawImage(canvas, 0, 0, newWidth, newHeight);
        compressedDataUrl = tempCanvas.toDataURL('image/jpeg', 0.8);
      }
    }
    
    return compressedDataUrl;
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `${guest?.name || 'guest'}_card.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleGenerateCard = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !guest) return;

    setIsGenerating(true);
    setGeneratedCardUrl(null);

    try {
      // Compress the image to under 700KB
      const compressedImageData = compressImage(canvas, 700);
      
      // Log compression info
      const originalSize = (canvas.toDataURL('image/png').length * 0.75) / 1024;
      const compressedSize = (compressedImageData.length * 0.75) / 1024;
      console.log(`Card for ${guest.name}: Original: ${originalSize.toFixed(1)}KB, Compressed: ${compressedSize.toFixed(1)}KB`);
      
      // Send to backend
      const response = await apiService.saveCanvasCard(guest.id, compressedImageData) as any;

      if (response.success) {
        setGeneratedCardUrl(response.card_url);
        setError('');
        
        // Refresh the guest table to show updated card status
        if (onRefresh) {
          onRefresh();
        }
      } else {
        throw new Error(response.message || 'Failed to generate card');
      }
    } catch (error) {
      console.error('Error generating card:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate card');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen || !guest) return null;

  return (
    <div className="fixed inset-0 z-[999999] overflow-y-auto">
      <div className="flex items-start justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity z-40" onClick={onClose}></div>

        {/* Modal panel */}
        <div className="relative z-50 inline-block align-bottom bg-white dark:bg-gray-900 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 border-b border-indigo-500 dark:border-purple-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Guest Card Preview
                  </h3>
                  <p className="text-indigo-100 text-sm mt-1">
                    {guest.name} • Preview and generate personalized card
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-6 overflow-y-auto max-h-[65vh] bg-gray-50 dark:bg-gray-800">
            {error && (
              <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            )}

            {!cardDesignPath ? (
              <div className="text-center py-12">
                <div className="mb-6">
                  <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                    <svg className="h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">No Card Design Available</h4>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  Please upload a card design in the Card Design tab to view and generate guest cards.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Card Preview */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-xl p-6 border border-blue-200 dark:border-blue-700 shadow-sm">
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg mr-3">
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-200">Card Preview</h4>
                  </div>
                  <div className="flex justify-center">
                    <div className="border border-blue-200 dark:border-blue-700 rounded-xl overflow-hidden bg-white shadow-lg">
                      <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 border-b border-blue-200 dark:border-blue-700">
                        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                          Guest Card Preview (3000x4200 pixels) - Scaled for display
                        </p>
                      </div>
                      <div className="flex justify-center p-6 overflow-auto">
                        <canvas
                          ref={canvasRef}
                          width={3000}
                          height={4200}
                          className="w-full h-auto max-h-[500px] object-contain shadow-lg rounded-lg"
                          style={{
                            aspectRatio: '3000/4200',
                            maxWidth: '100%',
                            maxHeight: '500px'
                          }}
                        />
                        <img
                          ref={imageRef}
                          src={cardDesignBase64 || ''}
                          alt="Card Design"
                          crossOrigin="anonymous"
                          className="hidden"
                          style={{ display: 'none' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Guest Info */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900 dark:to-teal-900 rounded-xl p-6 border border-emerald-200 dark:border-emerald-700 shadow-sm">
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-800 rounded-lg mr-3">
                      <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-emerald-800 dark:text-emerald-200">Guest Information</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-emerald-200 dark:border-emerald-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">Name</span>
                        <div className="text-xs text-emerald-500 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-800 px-2 py-1 rounded">
                          Guest
                        </div>
                      </div>
                      <div className="text-emerald-800 dark:text-emerald-200 font-semibold text-lg">{guest.name}</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-emerald-200 dark:border-emerald-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">Title</span>
                        <div className="text-xs text-emerald-500 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-800 px-2 py-1 rounded">
                          Position
                        </div>
                      </div>
                      <div className="text-emerald-800 dark:text-emerald-200 font-semibold text-lg">{guest.title || 'N/A'}</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-emerald-200 dark:border-emerald-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">Card Class</span>
                        <div className="text-xs text-emerald-500 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-800 px-2 py-1 rounded">
                          Category
                        </div>
                      </div>
                      <div className="text-emerald-800 dark:text-emerald-200 font-semibold text-lg">{guest.card_class?.name || 'N/A'}</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-emerald-200 dark:border-emerald-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">Max Guests</span>
                        <div className="text-xs text-emerald-500 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-800 px-2 py-1 rounded">
                          Limit
                        </div>
                      </div>
                      <div className="text-emerald-800 dark:text-emerald-200 font-semibold text-lg">{guest.card_class?.max_guests || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                {/* Success Message */}
                {generatedCardUrl && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900 rounded-xl p-6 border border-green-200 dark:border-green-700 shadow-sm">
                    <div className="flex items-center mb-4">
                      <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg mr-3">
                        <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h4 className="text-xl font-bold text-green-800 dark:text-green-200">
                        Card Generated Successfully!
                      </h4>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                      <p className="text-green-700 dark:text-green-300 text-sm mb-4">
                        The card has been saved and is ready for WhatsApp sending.
                      </p>
                      <a
                        href={generatedCardUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all shadow-sm"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        View Generated Card
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 px-8 py-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 transition-colors shadow-sm"
            >
              Close
            </button>
            {cardDesignPath && (
              <>
                <button
                  onClick={handleDownload}
                  className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-500 border border-transparent rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all shadow-sm"
                >
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Card
                  </div>
                </button>
                <button
                  onClick={handleGenerateCard}
                  disabled={isGenerating}
                  className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-500 border border-transparent rounded-lg hover:from-green-600 hover:to-emerald-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-lg transform hover:scale-105"
                >
                  {isGenerating ? (
                    <div className="flex items-center">
                      <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Generating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Generate Card
                    </div>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestCardModal; 