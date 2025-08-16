import React, { useRef, useEffect, useState } from 'react';
import { apiService } from '../services/api';

interface Event {
  id: number;
  event_name: string;
  event_date: string;
  event_location: string;
  card_design_path: string;
  card_type_id: number;
  name_position_x: number;
  name_position_y: number;
  qr_position_x: number;
  qr_position_y: number;
  card_class_position_x: number;
  card_class_position_y: number;
  name_text_color: string;
  card_class_text_color: string;
  name_text_size: number;
  card_class_text_size: number;
}

interface Guest {
  id: number;
  name: string;
  invite_code: string;
  card_class?: {
    id: number;
    name: string;
  };
}

interface CardType {
  id: number;
  name: string;
  show_guest_name: boolean;
  show_card_class: boolean;
  show_qr_code: boolean;
}

interface CanvasCardGeneratorProps {
  guest: Guest;
  event: Event;
  cardType: CardType;
  onCardGenerated?: (cardUrl: string) => void;
  onError?: (error: string) => void;
}

const CanvasCardGenerator: React.FC<CanvasCardGeneratorProps> = ({
  guest,
  event,
  cardType,
  onCardGenerated,
  onError
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [cardDesignBase64, setCardDesignBase64] = useState<string>('');

  useEffect(() => {
    if (event.card_design_path) {
      fetchCardDesign();
    }
  }, [event.card_design_path]);

  useEffect(() => {
    if (cardDesignBase64) {
      loadCardDesign();
    }
  }, [cardDesignBase64]);

  const fetchCardDesign = async () => {
    try {
      const response = await apiService.getCardDesign(event.id);
      setCardDesignBase64(response.card_design_base64);
    } catch (error) {
      console.error('Error fetching card design:', error);
      onError?.('Failed to fetch card design');
    }
  };

  const loadCardDesign = () => {
    console.log('loadCardDesign called', { cardDesignBase64: !!cardDesignBase64 });
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const image = new Image();
    image.crossOrigin = 'anonymous';
    
    image.onload = () => {
      console.log('Card design image loaded', { width: image.width, height: image.height });
      
      // Set canvas size to match image
      canvas.width = image.width;
      canvas.height = image.height;
      
      // Draw the card design
      ctx.drawImage(image, 0, 0);
      
      setImageLoaded(true);
      drawCard();
    };

    image.onerror = () => {
      console.error('Failed to load card design');
      onError?.('Failed to load card design');
    };

    // Load image from base64 data
    image.src = cardDesignBase64;
  };

  const drawCard = () => {
    console.log('drawCard called', { imageLoaded, cardType, event, guest });
    
    const canvas = canvasRef.current;
    if (!canvas || !imageLoaded) {
      console.log('Canvas or image not ready', { canvas: !!canvas, imageLoaded });
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Calculate positions based on 3000x4200 dimensions
    // Use event-specific positions with fallbacks to defaults
    const nameX = ((event.name_position_x ?? 50) / 100) * canvasWidth;
    const nameY = ((event.name_position_y ?? 30) / 100) * canvasHeight;
    const qrX = ((event.qr_position_x ?? 80) / 100) * canvasWidth;
    const qrY = ((event.qr_position_y ?? 70) / 100) * canvasHeight;
    const cardClassX = ((event.card_class_position_x ?? 20) / 100) * canvasWidth;
    const cardClassY = ((event.card_class_position_y ?? 90) / 100) * canvasHeight;

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

    // Function to draw all elements
    const drawAllElements = (context: CanvasRenderingContext2D) => {
      console.log('drawAllElements called', { 
        showGuestName: cardType.show_guest_name, 
        showCardClass: cardType.show_card_class,
        hasCardClass: !!guest.card_class,
        nameX, nameY, cardClassX, cardClassY
      });
      
      // Draw guest name if enabled
      if (cardType.show_guest_name !== false) {
        const fontSize = event.name_text_size ?? 98;
        const textColor = event.name_text_color ?? '#000000';
        console.log('Drawing guest name:', { name: guest.name, fontSize, textColor, x: nameX, y: nameY });
        drawTextWithShadow(guest.name, nameX, nameY, fontSize, textColor);
      }

      // Draw card class if enabled
      if (cardType.show_card_class && guest.card_class) {
        const fontSize = event.card_class_text_size ?? 60;
        const textColor = event.card_class_text_color ?? '#333333';
        console.log('Drawing card class:', { name: guest.card_class.name, fontSize, textColor, x: cardClassX, y: cardClassY });
        drawTextWithShadow(guest.card_class.name, cardClassX, cardClassY, fontSize, textColor);
      }
    };

    // Draw text elements first
    drawAllElements(ctx);

    // Draw QR code
    if (cardType.show_qr_code && guest.qr_code_base64) {
      const qrImage = new Image();
      qrImage.crossOrigin = 'anonymous';
      
      qrImage.onload = () => {
        const freshCtx = canvas.getContext('2d');
        if (!freshCtx) return;
        
        // Redraw background image first
        const bgImage = new Image();
        bgImage.onload = () => {
          freshCtx.drawImage(bgImage, 0, 0);
          
          // Draw all elements again
          drawAllElements(freshCtx);
          
          // Draw QR code
          const qrSize = 600;
          freshCtx.drawImage(qrImage, qrX - qrSize/2, qrY - qrSize/2, qrSize, qrSize);
        };
        bgImage.src = cardDesignBase64;
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
    } else if (cardType.show_qr_code && guest.qr_code_path) {
      // Fallback to URL if base64 is not available
      const qrImage = new Image();
      qrImage.crossOrigin = 'anonymous';
      
      qrImage.onload = () => {
        const freshCtx = canvas.getContext('2d');
        if (!freshCtx) return;
        
        // Redraw background image first
        const bgImage = new Image();
        bgImage.onload = () => {
          freshCtx.drawImage(bgImage, 0, 0);
          
          // Draw all elements again
          drawAllElements(freshCtx);
          
          // Draw QR code
          const qrSize = 600;
          freshCtx.drawImage(qrImage, qrX - qrSize/2, qrY - qrSize/2, qrSize, qrSize);
        };
        bgImage.src = cardDesignBase64;
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
    } else if (cardType.show_qr_code) {
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
  };

  const generateAndSendCard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsGenerating(true);

    try {
      // Convert canvas to base64
      const canvasImageData = canvas.toDataURL('image/png');
      
      // Send to backend
      const response = await apiService.saveCanvasCard(guest.id, canvasImageData);

      if (response.success) {
        onCardGenerated?.(response.card_url);
      } else {
        throw new Error(response.message || 'Failed to generate card');
      }
    } catch (error) {
      console.error('Error generating card:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to generate card');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
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

      {/* Generate Button */}
      <div className="flex justify-center">
        <button
          onClick={generateAndSendCard}
          disabled={!imageLoaded || isGenerating}
          className="px-6 py-3 text-sm font-medium text-white bg-brand-500 border border-transparent rounded-md hover:bg-brand-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating ? (
            <div className="flex items-center space-x-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Generating...</span>
            </div>
          ) : (
            'Generate & Send Card'
          )}
        </button>
      </div>
    </div>
  );
};

export default CanvasCardGenerator;
