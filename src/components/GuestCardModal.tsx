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
  cardDesignPath 
}) => {
  const [cardType, setCardType] = useState<CardType | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [cardDesignBase64, setCardDesignBase64] = useState<string>('');
  const [error, setError] = useState('');
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

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `${guest?.name || 'guest'}_card.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  if (!isOpen || !guest) return null;

  return (
    <div className="fixed inset-0 z-[999999] overflow-y-auto">
      <div className="flex items-start justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-black/50 transition-opacity z-40" onClick={onClose}></div>

        {/* Modal panel */}
        <div className="relative z-50 inline-block align-bottom bg-white dark:bg-gray-900 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full max-h-[85vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Guest Card - {guest.name}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
            {error && (
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {!cardDesignPath ? (
              <div className="text-center py-8">
                <div className="mb-4">
                  <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Card Design Available</h4>
                <p className="text-gray-500 dark:text-gray-400">
                  Please upload a card design in the Card Design tab to view guest cards.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Card Preview */}
                <div className="flex justify-center">
                  <div className="border border-gray-300 rounded-lg overflow-hidden dark:border-gray-600 bg-white">
                    <div className="p-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Card Preview (3000x4200 pixels) - Scaled for display
                      </p>
                    </div>
                    <div className="flex justify-center p-4 overflow-auto">
                      <canvas
                        ref={canvasRef}
                        width={3000}
                        height={4200}
                        className="w-full h-auto max-h-[500px] object-contain shadow-lg"
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

                {/* Guest Info */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Guest Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Name:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">{guest.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Title:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">{guest.title || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Card Class:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">{guest.card_class?.name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Max Guests:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">{guest.card_class?.max_guests || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Close
            </button>
            {cardDesignPath && (
              <button
                onClick={handleDownload}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-500 border border-transparent rounded-md hover:bg-brand-600"
              >
                Download Card
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestCardModal; 