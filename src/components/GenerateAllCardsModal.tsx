import React, { useState, useEffect, useRef } from 'react';
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
  title?: string;
  phone_number?: string;
  card_class_id: number;
  invite_code: string;
  qr_code_path?: string;
  qr_code_base64?: string;
  rsvp_status: "Yes" | "No" | "Maybe" | "Pending";
  card_class?: {
    id: number;
    name: string;
    max_guests: number;
  };
  guest_card_path?: string;
}

interface CardType {
  id: number;
  name: string;
  show_guest_name: boolean;
  show_card_class: boolean;
  show_qr_code: boolean;
}

interface GenerateAllCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  cardType: CardType;
  onRefresh?: () => void;
}

const GenerateAllCardsModal: React.FC<GenerateAllCardsModalProps> = ({
  isOpen,
  onClose,
  event,
  cardType,
  onRefresh
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentGuestIndex, setCurrentGuestIndex] = useState(0);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [currentGuest, setCurrentGuest] = useState<Guest | null>(null);
  const [error, setError] = useState<string>('');
  const [cardDesignBase64, setCardDesignBase64] = useState<string>('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isLoadingDesign, setIsLoadingDesign] = useState(false);
  const [failedGuests, setFailedGuests] = useState<Array<{guest: Guest, error: string}>>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [isLoadingGuests, setIsLoadingGuests] = useState(false);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const currentGuestCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Filter guests based on regeneration strategy
  const guestsWithoutCards = guests.filter(guest => !guest.guest_card_path);
  const guestsWithCards = guests.filter(guest => guest.guest_card_path);
  
  // Default to generating only missing cards, but allow regeneration
  const [regenerationMode, setRegenerationMode] = useState<'missing' | 'all'>('missing');
  
  const guestsToGenerate = regenerationMode === 'missing' 
    ? guestsWithoutCards 
    : guests;
  const totalGuestsToGenerate = guestsToGenerate.length;

  const fetchAllGuests = async () => {
    try {
      console.log('=== fetchAllGuests called ===');
      setIsLoadingGuests(true);
      setError('');
      console.log('Fetching all guests for event:', event.id);
      
      // Fetch all guests for this event (no pagination)
      console.log('About to call getAllEventGuests for event:', event.id);
      const response = await apiService.getAllEventGuests(event.id) as any;
      
      console.log('API Response:', response);
      console.log('Response type:', typeof response);
      console.log('Is Array:', Array.isArray(response));
      
      if (response && Array.isArray(response)) {
        setGuests(response);
        console.log(`Fetched ${response.length} guests from database`);
      } else if (response && response.data && Array.isArray(response.data)) {
        setGuests(response.data);
        console.log(`Fetched ${response.data.length} guests from database`);
      } else {
        setGuests([]);
        console.log('No guests found for this event');
        console.log('Response structure:', JSON.stringify(response, null, 2));
      }
    } catch (error) {
      console.error('Error fetching guests:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      setError('Failed to fetch guests from database');
      setGuests([]);
    } finally {
      setIsLoadingGuests(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      console.log('=== GenerateAllCardsModal opened ===');
      console.log('Modal opened for event:', event.id);
      console.log('Event card_design_path:', event.card_design_path);
      console.log('Event object:', event);
      
      // Fetch all guests from database first
      fetchAllGuests();
      
      if (event.card_design_path) {
        console.log('Fetching card design...');
        fetchCardDesign();
      } else {
        console.log('No card design path found');
        setError('No card design found for this event');
      }
    }
  }, [isOpen, event.id, event.card_design_path]);

  useEffect(() => {
    if (cardDesignBase64) {
      console.log('Card design base64 changed, loading...');
      console.log('Base64 length:', cardDesignBase64.length);
      loadCardDesign();
      // Also set imageLoaded to true immediately for fallback display
      setImageLoaded(true);
    }
  }, [cardDesignBase64]);

  // Debug effect to check canvas refs
  useEffect(() => {
    console.log('Canvas refs status:');
    console.log('previewCanvasRef:', !!previewCanvasRef.current);
    console.log('drawingCanvasRef:', !!drawingCanvasRef.current);
    console.log('currentGuestCanvasRef:', !!currentGuestCanvasRef.current);
  }, [imageLoaded]);

  const fetchCardDesign = async () => {
    try {
      setIsLoadingDesign(true);
      setError('');
      console.log('Fetching card design for event:', event.id);
      const response = await apiService.getCardDesign(event.id);
      console.log('Card design response:', response);
      
      if (response.card_design_base64) {
        setCardDesignBase64(response.card_design_base64);
        console.log('Card design base64 set, length:', response.card_design_base64.length);
        console.log('Card design base64 preview:', response.card_design_base64.substring(0, 100) + '...');
      } else {
        console.error('No card_design_base64 in response');
        setError('No card design data received');
      }
    } catch (error) {
      console.error('Error fetching card design:', error);
      setError('Failed to fetch card design');
    } finally {
      setIsLoadingDesign(false);
    }
  };

  const loadCardDesign = () => {
    const previewCanvas = previewCanvasRef.current;
    const drawingCanvas = drawingCanvasRef.current;
    const currentGuestCanvas = currentGuestCanvasRef.current;
    if (!previewCanvas || !drawingCanvas || !currentGuestCanvas) return;

    const previewCtx = previewCanvas.getContext('2d');
    const drawingCtx = drawingCanvas.getContext('2d');
    const currentGuestCtx = currentGuestCanvas.getContext('2d');
    if (!previewCtx || !drawingCtx || !currentGuestCtx) return;

    console.log('Loading card design into canvas:', cardDesignBase64 ? 'Has data' : 'No data');

    const image = new Image();
    image.crossOrigin = 'anonymous';
    
    image.onload = () => {
      console.log('Image loaded successfully:', {
        width: image.width,
        height: image.height
      });
      
      // Set all canvas dimensions to match the image
      previewCanvas.width = image.width;
      previewCanvas.height = image.height;
      drawingCanvas.width = image.width;
      drawingCanvas.height = image.height;
      currentGuestCanvas.width = image.width;
      currentGuestCanvas.height = image.height;
      
      // Clear all canvases first
      previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
      drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
      currentGuestCtx.clearRect(0, 0, currentGuestCanvas.width, currentGuestCanvas.height);
      
      // Draw the image on all canvases
      previewCtx.drawImage(image, 0, 0);
      drawingCtx.drawImage(image, 0, 0);
      currentGuestCtx.drawImage(image, 0, 0);
      
      console.log('All canvases initialized with background image');
      
      setImageLoaded(true);
      setError(''); // Clear any previous errors
      
      console.log('Card design loaded successfully', {
        width: image.width,
        height: image.height,
        previewCanvasWidth: previewCanvas.width,
        previewCanvasHeight: previewCanvas.height
      });
    };

    image.onerror = (error) => {
      console.error('Failed to load card design image:', error);
      setError('Failed to load card design');
      setImageLoaded(false);
    };

    image.src = cardDesignBase64;
  };

  const drawCard = (guest: Guest) => {
    const drawingCanvas = drawingCanvasRef.current;
    const previewCanvas = currentGuestCanvasRef.current;
    
    if (!drawingCanvas || !previewCanvas || !imageLoaded) {
      console.error('Canvas or image not ready for drawing');
      return;
    }

    const drawingCtx = drawingCanvas.getContext('2d');
    const previewCtx = previewCanvas.getContext('2d');
    
    if (!drawingCtx || !previewCtx) {
      console.error('Failed to get canvas context');
      return;
    }

    console.log(`Drawing card for guest: ${guest.name}`);
    console.log('Canvas dimensions:', drawingCanvas.width, 'x', drawingCanvas.height);
    console.log('Card design base64 available:', !!cardDesignBase64);

    const canvasWidth = drawingCanvas.width;
    const canvasHeight = drawingCanvas.height;

    // First, redraw the background image to clear previous text
    const bgImage = new Image();
    bgImage.onload = () => {
      console.log('Background image loaded for drawing');
      
      // Clear both canvases
      drawingCtx.clearRect(0, 0, canvasWidth, canvasHeight);
      previewCtx.clearRect(0, 0, canvasWidth, canvasHeight);
      
      // Draw the background image on both canvases
      drawingCtx.drawImage(bgImage, 0, 0, canvasWidth, canvasHeight);
      previewCtx.drawImage(bgImage, 0, 0, canvasWidth, canvasHeight);
      
      console.log('Background image drawn on both canvases, now drawing elements');
      
      // Now draw the text and QR code on both canvases
      drawElements(drawingCtx, guest, canvasWidth, canvasHeight);
      drawElements(previewCtx, guest, canvasWidth, canvasHeight);
    };
    bgImage.onerror = (error) => {
      console.error('Failed to load background image for drawing:', error);
    };
    
    console.log('Setting background image source');
    bgImage.src = cardDesignBase64;
  };

  const drawElements = (ctx: CanvasRenderingContext2D, guest: Guest, canvasWidth: number, canvasHeight: number) => {
    console.log('Drawing elements for guest:', guest.name);
    
    // Calculate positions based on 3000x4200 dimensions
    const nameX = ((event.name_position_x ?? 50) / 100) * canvasWidth;
    const nameY = ((event.name_position_y ?? 30) / 100) * canvasHeight;
    const qrX = ((event.qr_position_x ?? 80) / 100) * canvasWidth;
    const qrY = ((event.qr_position_y ?? 70) / 100) * canvasHeight;
    const cardClassX = ((event.card_class_position_x ?? 20) / 100) * canvasWidth;
    const cardClassY = ((event.card_class_position_y ?? 90) / 100) * canvasHeight;
    
    console.log('Calculated positions:', {
      nameX, nameY, qrX, qrY, cardClassX, cardClassY,
      canvasWidth, canvasHeight
    });

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
      console.log('Drawing guest name:', guest.name, 'at', nameX, nameY, 'with size', fontSize, 'and color', textColor);
      drawTextWithShadow(guest.name, nameX, nameY, fontSize, textColor);
    }

    // Draw card class if enabled
    if (cardType.show_card_class && guest.card_class) {
      const fontSize = event.card_class_text_size ?? 60;
      const textColor = event.card_class_text_color ?? '#333333';
      console.log('Drawing card class:', guest.card_class.name, 'at', cardClassX, cardClassY, 'with size', fontSize, 'and color', textColor);
      drawTextWithShadow(guest.card_class.name, cardClassX, cardClassY, fontSize, textColor);
    }

    // Draw QR code
    if (cardType.show_qr_code && guest.qr_code_base64) {
      const qrImage = new Image();
      qrImage.crossOrigin = 'anonymous';
      
      qrImage.onload = () => {
        // Draw QR code
        const qrSize = 600;
        ctx.drawImage(qrImage, qrX - qrSize/2, qrY - qrSize/2, qrSize, qrSize);
      };
      
      qrImage.onerror = () => {
        const qrSize = 600;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(qrX - qrSize/2, qrY - qrSize/2, qrSize, qrSize);
        ctx.fillStyle = '#ffffff';
        ctx.font = `${Math.round(qrSize/4)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('QR Error', qrX, qrY);
      };
      
      qrImage.src = guest.qr_code_base64;
    } else if (cardType.show_qr_code && guest.qr_code_path) {
      // Fallback to URL if base64 is not available
      const qrImage = new Image();
      qrImage.crossOrigin = 'anonymous';
      
      qrImage.onload = () => {
        // Draw QR code
        const qrSize = 600;
        ctx.drawImage(qrImage, qrX - qrSize/2, qrY - qrSize/2, qrSize, qrSize);
      };
      
      qrImage.onerror = () => {
        const qrSize = 600;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(qrX - qrSize/2, qrY - qrSize/2, qrSize, qrSize);
        ctx.fillStyle = '#ffffff';
        ctx.font = `${Math.round(qrSize/4)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('QR Error', qrX, qrY);
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

  const deleteExistingCard = async (guest: Guest): Promise<boolean> => {
    if (!guest.guest_card_path) return true; // No existing card to delete
    
    try {
      // Call API to delete existing card
      const response = await apiService.deleteGuestCard(guest.id) as any;
      return response.success;
    } catch (error) {
      console.error(`Error deleting existing card for guest ${guest.name}:`, error);
      return false; // Continue anyway, will overwrite
    }
  };

  // Helper function to compress image
  const compressImage = (canvas: HTMLCanvasElement, maxSizeKB: number = 700): string => {
    // Try PNG first (better for text and graphics)
    let compressedDataUrl = canvas.toDataURL('image/png');
    let sizeInKB = (compressedDataUrl.length * 0.75) / 1024;
    
    console.log(`Initial PNG size: ${sizeInKB.toFixed(1)}KB`);
    
    // If PNG is already under the limit, use it
    if (sizeInKB <= maxSizeKB) {
      console.log('Using PNG format (no compression needed)');
      return compressedDataUrl;
    }
    
    // If PNG is too large, try JPEG with high quality
    let quality = 0.95;
    compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
    sizeInKB = (compressedDataUrl.length * 0.75) / 1024;
    
    console.log(`JPEG with quality ${quality}: ${sizeInKB.toFixed(1)}KB`);
    
    // If still too large, reduce quality gradually
    while (sizeInKB > maxSizeKB && quality > 0.3) {
      quality -= 0.05;
      compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      sizeInKB = (compressedDataUrl.length * 0.75) / 1024;
      console.log(`JPEG with quality ${quality}: ${sizeInKB.toFixed(1)}KB`);
    }
    
    // If still too large, resize the canvas (but maintain aspect ratio)
    if (sizeInKB > maxSizeKB) {
      const scale = Math.sqrt(maxSizeKB / sizeInKB);
      const newWidth = Math.floor(canvas.width * scale);
      const newHeight = Math.floor(canvas.height * scale);
      
      console.log(`Resizing canvas from ${canvas.width}x${canvas.height} to ${newWidth}x${newHeight}`);
      
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCanvas.width = newWidth;
        tempCanvas.height = newHeight;
        
        // Use high-quality image smoothing
        tempCtx.imageSmoothingEnabled = true;
        tempCtx.imageSmoothingQuality = 'high';
        
        tempCtx.drawImage(canvas, 0, 0, newWidth, newHeight);
        compressedDataUrl = tempCanvas.toDataURL('image/jpeg', 0.9);
        
        const finalSizeInKB = (compressedDataUrl.length * 0.75) / 1024;
        console.log(`Final resized JPEG: ${finalSizeInKB.toFixed(1)}KB`);
      }
    }
    
    return compressedDataUrl;
  };

  const generateCardForGuest = async (guest: Guest): Promise<boolean> => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) {
      console.error('Drawing canvas not found');
      return false;
    }

    try {
      console.log(`Starting card generation for guest: ${guest.name}`);
      
      // First, delete existing card if it exists
      await deleteExistingCard(guest);
      
      // Draw the card for this guest
      drawCard(guest);
      
      // Wait a bit for the drawing to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Drawing completed, compressing image...');
      
      // Compress the image to under 700KB
      const compressedImageData = compressImage(canvas, 700);
      
      // Log compression info
      const originalSize = (canvas.toDataURL('image/png').length * 0.75) / 1024;
      const compressedSize = (compressedImageData.length * 0.75) / 1024;
      console.log(`Card for ${guest.name}: Original: ${originalSize.toFixed(1)}KB, Compressed: ${compressedSize.toFixed(1)}KB`);
      
      console.log('Sending to backend...');
      
      // Send to backend
      const response = await apiService.saveCanvasCard(guest.id, compressedImageData) as any;

      console.log('Backend response:', response);

      if (response.success) {
        console.log(`Card generated successfully for ${guest.name}`);
        return true;
      } else {
        throw new Error(response.message || 'Failed to generate card');
      }
    } catch (error) {
      console.error(`Error generating card for guest ${guest.name}:`, error);
      return false;
    }
  };

  const startGeneration = async () => {
    if (guestsToGenerate.length === 0) {
      setError('No guests found to generate cards for');
      return;
    }

    setIsGenerating(true);
    setCurrentGuestIndex(0);
    setGeneratedCount(0);
    setFailedCount(0);
    setFailedGuests([]);
    setError('');

    // Draw the first guest card to show in preview
    if (guestsToGenerate.length > 0) {
      drawCard(guestsToGenerate[0]);
    }

    for (let i = 0; i < guestsToGenerate.length; i++) {
      const guest = guestsToGenerate[i];
      setCurrentGuest(guest);
      setCurrentGuestIndex(i + 1);

      // Draw the current guest card to update the preview
      drawCard(guest);

      try {
        const success = await generateCardForGuest(guest);
        
        if (success) {
          setGeneratedCount(prev => prev + 1);
        } else {
          setFailedCount(prev => prev + 1);
          setFailedGuests(prev => [...prev, { guest, error: 'Card generation failed - check console for details' }]);
        }
      } catch (error) {
        setFailedCount(prev => prev + 1);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setFailedGuests(prev => [...prev, { guest, error: errorMessage }]);
      }

      // Small delay between generations
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setIsGenerating(false);
    setCurrentGuest(null);
    
    // Refresh the guest table to show updated card status
    if (onRefresh) {
      onRefresh();
    }
  };

  const resetModal = () => {
    setIsGenerating(false);
    setCurrentGuestIndex(0);
    setGeneratedCount(0);
    setFailedCount(0);
    setFailedGuests([]);
    setRegenerationMode('missing');
    setCurrentGuest(null);
    setError('');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999999] overflow-y-auto">
      <div className="flex items-start justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity z-40" onClick={handleClose}></div>

        {/* Modal panel */}
        <div className="relative z-50 inline-block align-bottom bg-white dark:bg-gray-900 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 border-b border-blue-500 dark:border-purple-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Generate All Guest Cards
                  </h3>
                  <p className="text-blue-100 text-sm mt-1">
                    Create personalized cards for all guests
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
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

            {/* Loading States */}
            {isLoadingGuests && (
              <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-xl p-6 border border-blue-200 dark:border-blue-700 shadow-sm">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mr-4"></div>
                  <div>
                    <span className="text-blue-800 dark:text-blue-200 font-medium">Loading guests from database...</span>
                    <p className="text-blue-600 dark:text-blue-400 text-sm mt-1">Please wait while we fetch all guests for this event</p>
                  </div>
                </div>
              </div>
            )}

            {/* Loading Card Design */}
            {isLoadingDesign && (
              <div className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900 dark:to-orange-900 rounded-xl p-6 border border-yellow-200 dark:border-yellow-700 shadow-sm">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-yellow-500 border-t-transparent mr-4"></div>
                  <div>
                    <span className="text-yellow-800 dark:text-yellow-200 font-medium">Loading card design...</span>
                    <p className="text-yellow-600 dark:text-yellow-400 text-sm mt-1">Please wait while we prepare the card template</p>
                  </div>
                </div>
              </div>
            )}

            {/* Card Design Status */}
            {!isLoadingDesign && (
              <div className={`mb-6 rounded-xl p-6 shadow-sm border ${
                imageLoaded 
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900 border-green-200 dark:border-green-700' 
                  : 'bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 border-gray-200 dark:border-gray-700'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    {imageLoaded ? (
                      <>
                        <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg mr-4">
                          <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <span className="text-green-800 dark:text-green-200 font-semibold text-lg">Card design loaded successfully</span>
                          <p className="text-green-600 dark:text-green-400 text-sm mt-1">Ready to generate personalized cards</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg mr-4">
                          <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                        <div>
                          <span className="text-gray-700 dark:text-gray-300 font-semibold text-lg">Card design not loaded</span>
                          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Unable to load the card template</p>
                        </div>
                      </>
                    )}
                  </div>
                  {!imageLoaded && (
                    <button
                      onClick={fetchCardDesign}
                      className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      Retry Load
                    </button>
                  )}
                </div>
                {/* Current Guest Preview - Only show when generating */}
                {imageLoaded && isGenerating && (
                  <div className="mt-3">
                    <p className="text-sm text-green-600 dark:text-green-400 mb-2">Current Guest Preview:</p>
                    <div className="flex justify-center">
                      <div className="border border-gray-300 rounded-lg overflow-hidden dark:border-gray-600 bg-white">
                        <div className="p-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Guest Card Preview (3000x4200 pixels) - Scaled for display
                          </p>
                        </div>
                        <div className="flex justify-center p-4 overflow-auto">
                          <canvas
                            ref={currentGuestCanvasRef}
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
                        
                        {/* Hidden canvases for drawing operations */}
                        <canvas
                          ref={previewCanvasRef}
                          width={3000}
                          height={4200}
                          style={{ display: 'none' }}
                        />
                        <canvas
                          ref={drawingCanvasRef}
                          width={3000}
                          height={4200}
                          style={{ display: 'none' }}
                        />
                        
 
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Regeneration Mode Selector */}
            {imageLoaded && !isLoadingGuests && guests.length > 0 && (
              <div className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900 dark:to-pink-900 rounded-xl p-6 border border-purple-200 dark:border-purple-700 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg mr-3">
                    <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-purple-800 dark:text-purple-200">Generation Strategy</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      regenerationMode === 'missing' 
                        ? 'bg-white dark:bg-gray-800 border-purple-500 shadow-md' 
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-purple-300'
                    }`}
                    onClick={() => setRegenerationMode('missing')}
                  >
                    <div className="flex items-center mb-2">
                      <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                        regenerationMode === 'missing' 
                          ? 'border-purple-500 bg-purple-500' 
                          : 'border-gray-400'
                      }`}>
                        {regenerationMode === 'missing' && (
                          <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                        )}
                      </div>
                      <h5 className="font-semibold text-gray-900 dark:text-white">Generate Missing Cards Only</h5>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 ml-7">
                      Only generate cards for guests who don't have cards yet ({guestsWithoutCards.length} guests)
                    </p>
                  </div>
                  <div 
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      regenerationMode === 'all' 
                        ? 'bg-white dark:bg-gray-800 border-purple-500 shadow-md' 
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-purple-300'
                    }`}
                    onClick={() => setRegenerationMode('all')}
                  >
                    <div className="flex items-center mb-2">
                      <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                        regenerationMode === 'all' 
                          ? 'border-purple-500 bg-purple-500' 
                          : 'border-gray-400'
                      }`}>
                        {regenerationMode === 'all' && (
                          <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                        )}
                      </div>
                      <h5 className="font-semibold text-gray-900 dark:text-white">Regenerate All Cards</h5>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 ml-7">
                      Generate new cards for all guests, replacing existing ones ({guests.length} guests)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-xl p-6 border border-blue-200 dark:border-blue-700 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg mr-3">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-200">Generation Summary</h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{guests.length}</div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Total Guests</div>
                </div>
                <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalGuestsToGenerate}</div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">To Generate</div>
                </div>
                <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-700">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{generatedCount}</div>
                  <div className="text-xs text-green-600 dark:text-green-400 font-medium">Generated</div>
                </div>
                <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-700">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{failedCount}</div>
                  <div className="text-xs text-red-600 dark:text-red-400 font-medium">Failed</div>
                </div>
              </div>
              {regenerationMode === 'all' && guestsWithCards.length > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900 rounded-lg border border-yellow-200 dark:border-yellow-700">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-sm text-yellow-700 dark:text-yellow-300">
                      ⚠️ This will replace {guestsWithCards.length} existing cards
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Progress */}
            {isGenerating && (
              <div className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900 dark:to-pink-900 rounded-xl p-6 border border-purple-200 dark:border-purple-700 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg mr-3">
                    <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-purple-800 dark:text-purple-200">Generation Progress</h4>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    Processing: {currentGuestIndex} of {totalGuestsToGenerate}
                  </span>
                  <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                    {Math.round((currentGuestIndex / totalGuestsToGenerate) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-purple-200 dark:bg-purple-700 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
                    style={{ width: `${(currentGuestIndex / totalGuestsToGenerate) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Current Guest Info */}
            {isGenerating && currentGuest && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900 dark:to-orange-900 rounded-xl p-6 border border-amber-200 dark:border-amber-700 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-amber-100 dark:bg-amber-800 rounded-lg mr-3">
                    <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-amber-800 dark:text-amber-200">
                    Currently Generating
                  </h4>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-amber-200 dark:border-amber-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <span className="text-amber-600 dark:text-amber-400 font-medium mr-2">Name:</span>
                      <span className="text-amber-800 dark:text-amber-200 font-semibold">{currentGuest.name}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-amber-600 dark:text-amber-400 font-medium mr-2">Card Class:</span>
                      <span className="text-amber-800 dark:text-amber-200 font-semibold">{currentGuest.card_class?.name || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Results */}
            {!isGenerating && (generatedCount > 0 || failedCount > 0) && (
              <div className="mt-6 space-y-4">
                {/* Success Summary */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900 rounded-xl p-6 border border-green-200 dark:border-green-700 shadow-sm">
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg mr-3">
                      <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="text-xl font-bold text-green-800 dark:text-green-200">
                      Generation Complete!
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-700">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">✅ {generatedCount}</div>
                      <div className="text-sm text-green-600 dark:text-green-400 font-medium">Successfully Generated</div>
                    </div>
                    {failedCount > 0 && (
                      <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-700">
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">❌ {failedCount}</div>
                        <div className="text-sm text-red-600 dark:text-red-400 font-medium">Failed to Generate</div>
                      </div>
                    )}
                    <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">📊 {generatedCount + failedCount}</div>
                      <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Processed</div>
                    </div>
                  </div>
                </div>

                {/* Failed Guests Details */}
                {failedGuests.length > 0 && (
                  <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900 dark:to-pink-900 rounded-xl p-6 border border-red-200 dark:border-red-700 shadow-sm">
                    <div className="flex items-center mb-4">
                      <div className="p-2 bg-red-100 dark:bg-red-800 rounded-lg mr-3">
                        <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h4 className="text-xl font-bold text-red-800 dark:text-red-200">
                        Failed Card Generations ({failedGuests.length})
                      </h4>
                    </div>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {failedGuests.map((failedGuest, index) => (
                        <div key={index} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-700 shadow-sm">
                          <div className="flex justify-between items-start mb-3">
                            <div className="font-semibold text-red-800 dark:text-red-200 text-lg">
                              {failedGuest.guest.name}
                            </div>
                            <div className="text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-800 px-2 py-1 rounded">
                              Guest #{failedGuest.guest.id}
                            </div>
                          </div>
                          <div className="text-sm text-red-700 dark:text-red-300 mb-2">
                            <span className="font-medium">Error:</span> {failedGuest.error}
                          </div>
                          {failedGuest.guest.card_class && (
                            <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-800 px-2 py-1 rounded">
                              Card Class: {failedGuest.guest.card_class.name}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}


          </div>

          {/* Footer */}
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 px-8 py-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-4">
            <button
              onClick={handleClose}
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 transition-colors shadow-sm"
            >
              Close
            </button>
            {!isGenerating && totalGuestsToGenerate > 0 && imageLoaded && !isLoadingGuests && guests.length > 0 && (
              <button
                onClick={startGeneration}
                className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-500 border border-transparent rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg transform hover:scale-105"
              >
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate All Cards
                </div>
              </button>
            )}
            {!isGenerating && (totalGuestsToGenerate === 0 || !imageLoaded || isLoadingGuests || guests.length === 0) && (
                              <button
                  disabled
                  className="px-6 py-3 text-sm font-medium text-gray-400 bg-gray-300 border border-transparent rounded-lg cursor-not-allowed shadow-sm"
                >
                  <div className="flex items-center">
                    {isLoadingGuests ? (
                      <>
                        <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Loading Guests...
                      </>
                    ) : !imageLoaded ? (
                      <>
                        <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Loading Card Design...
                      </>
                    ) : guests.length === 0 ? (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        No Guests Found
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        No Cards to Generate
                      </>
                    )}
                  </div>
                </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateAllCardsModal;
