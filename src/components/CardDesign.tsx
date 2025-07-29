import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';

interface CardDesignProps {
  eventId: number;
  cardTypeId: number;
  cardDesignPath?: string;
  onCardDesignUpdate?: (newPath: string) => void;
}

interface CardType {
  id: number;
  name: string;
  name_position_x: number;
  name_position_y: number;
  qr_position_x: number;
  qr_position_y: number;
  card_class_position_x: number;
  card_class_position_y: number;
  show_guest_name?: boolean;
  show_card_class?: boolean;
}

interface Guest {
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
}

interface CardDesignUploadResponse {
  message: string;
  card_design_path: string;
  dimensions?: string;
}

interface CardDesignGetResponse {
  message: string;
  card_design_base64: string;
  file_name: string;
  file_type: string;
}

const CardDesign: React.FC<CardDesignProps> = ({ eventId, cardTypeId, cardDesignPath, onCardDesignUpdate }) => {
  const [cardType, setCardType] = useState<CardType | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [positions, setPositions] = useState({
    name_x: 50,
    name_y: 30,
    qr_x: 80,
    qr_y: 70,
    card_class_x: 20,
    card_class_y: 90,
  });
  const [showGuestName, setShowGuestName] = useState(true);
  const [showCardClass, setShowCardClass] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentCardDesignPath, setCurrentCardDesignPath] = useState(cardDesignPath);
  const [cardDesignBase64, setCardDesignBase64] = useState<string>('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCardType();
    fetchGuests();
  }, [cardTypeId, eventId]);

  useEffect(() => {
    setCurrentCardDesignPath(cardDesignPath);
  }, [cardDesignPath]);

  useEffect(() => {
    if (cardType) {
      setPositions({
        name_x: cardType.name_position_x,
        name_y: cardType.name_position_y,
        qr_x: cardType.qr_position_x,
        qr_y: cardType.qr_position_y,
        card_class_x: cardType.card_class_position_x,
        card_class_y: cardType.card_class_position_y,
      });
      setShowGuestName(cardType.show_guest_name || true);
      setShowCardClass(cardType.show_card_class || true);
    }
  }, [cardType]);

  useEffect(() => {
    if (guests.length > 0 && !selectedGuest) {
      setSelectedGuest(guests[0]);
    }
  }, [guests]);

  useEffect(() => {
    console.log('CardDesign: currentCardDesignPath changed:', currentCardDesignPath);
    if (currentCardDesignPath) {
      // Fetch card design as base64
      fetchCardDesign();
    } else {
      // Clear the canvas if no card design
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      setImageLoaded(false);
      setCardDesignBase64('');
    }
  }, [currentCardDesignPath]);

  // New useEffect to handle drawing when base64 data changes
  useEffect(() => {
    if (cardDesignBase64) {
      // Set the image source to the base64 data
      if (imageRef.current) {
        imageRef.current.src = cardDesignBase64;
      }
      // Use the new checking mechanism instead of direct drawCard call
      setTimeout(() => {
        checkImageAndDraw();
      }, 100);
    }
  }, [cardDesignBase64, selectedGuest, positions, showGuestName, showCardClass]);

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

  const fetchGuests = async () => {
    try {
      const response = await apiService.getEventGuests(eventId) as any;
      const guestsData = response.data || response;
      console.log('Fetched guests data:', guestsData);
      console.log('Sample guest with QR code:', guestsData.find((g: Guest) => g.qr_code_path));
      setGuests(guestsData);
    } catch (error) {
      console.error('Error fetching guests:', error);
      setError('Failed to fetch guests');
    }
  };

  const fetchCardDesign = async () => {
    if (!currentCardDesignPath) {
      setCardDesignBase64('');
      return;
    }

    try {
      const response = await apiService.getCardDesign(eventId) as CardDesignGetResponse;
      setCardDesignBase64(response.card_design_base64);
      console.log('Fetched card design as base64');
    } catch (error) {
      console.error('Error fetching card design:', error);
      setError('Failed to fetch card design');
      setCardDesignBase64('');
    }
  };

  const drawCard = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    
    if (!canvas || !image || !selectedGuest) {
      return;
    }

    // Check if image is loaded and not in broken state
    if (!image.complete || image.naturalWidth === 0) {
      // Use the checking mechanism
      checkImageAndDraw();
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
    const nameX = (positions.name_x / 100) * canvas.width;
    const nameY = (positions.name_y / 100) * canvas.height;
    const qrX = (positions.qr_x / 100) * canvas.width;
    const qrY = (positions.qr_y / 100) * canvas.height;
    const cardClassX = (positions.card_class_x / 100) * canvas.width;
    const cardClassY = (positions.card_class_y / 100) * canvas.height;

    // Draw guest name with appropriate font size for 3000x4200 canvas
    if (showGuestName) {
      // Set font size to exactly 98px for 3000px width canvas
      const fontSize = 98;
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(selectedGuest.name, nameX, nameY);
    }

    // Draw QR code if available with appropriate size for 3000x4200 canvas
    if (selectedGuest.qr_code_base64) {
      const qrImage = new Image();
      qrImage.crossOrigin = 'anonymous';
      
      qrImage.onload = () => {
        // Get fresh context in case it was cleared
        const freshCtx = canvas.getContext('2d');
        if (!freshCtx) {
          return;
        }
        
        // Redraw background image first
        freshCtx.drawImage(image, 0, 0, canvas.width, canvas.height);
        
        // Redraw guest name if enabled
        if (showGuestName) {
          // Set font size to exactly 98px for 3000px width canvas
          const fontSize = 98;
          freshCtx.font = `bold ${fontSize}px Arial`;
          freshCtx.fillStyle = '#000000';
          freshCtx.textAlign = 'center';
          freshCtx.textBaseline = 'middle';
          freshCtx.fillText(selectedGuest.name, nameX, nameY);
        }
        
        // Set QR code size to exactly 600px for 3000px width canvas
        const qrSize = 600;
        freshCtx.drawImage(qrImage, qrX - qrSize/2, qrY - qrSize/2, qrSize, qrSize);
      };
      
      qrImage.onerror = () => {
        // Draw a placeholder rectangle if QR code fails to load
        const freshCtx = canvas.getContext('2d');
        if (freshCtx) {
          // Set QR code size to exactly 600px for 3000px width canvas
          const qrSize = 600;
          freshCtx.fillStyle = '#ff0000';
          freshCtx.fillRect(qrX - qrSize/2, qrY - qrSize/2, qrSize, qrSize);
          freshCtx.fillStyle = '#ffffff';
          freshCtx.font = `${Math.round(qrSize/4)}px Arial`;
          freshCtx.textAlign = 'center';
          freshCtx.textBaseline = 'middle';
          freshCtx.fillText('QR', qrX, qrY);
        }
      };
      
      qrImage.src = selectedGuest.qr_code_base64;
    } else if (selectedGuest.qr_code_path) {
      // Fallback to URL if base64 is not available
      const qrImage = new Image();
      qrImage.crossOrigin = 'anonymous';
      
      qrImage.onload = () => {
        // Get fresh context in case it was cleared
        const freshCtx = canvas.getContext('2d');
        if (!freshCtx) {
          return;
        }
        
        // Redraw background image first
        freshCtx.drawImage(image, 0, 0, canvas.width, canvas.height);
        
        // Redraw guest name if enabled
        if (showGuestName) {
          // Set font size to exactly 98px for 3000px width canvas
          const fontSize = 98;
          freshCtx.font = `bold ${fontSize}px Arial`;
          freshCtx.fillStyle = '#000000';
          freshCtx.textAlign = 'center';
          freshCtx.textBaseline = 'middle';
          freshCtx.fillText(selectedGuest.name, nameX, nameY);
        }
        
        // Set QR code size to exactly 600px for 3000px width canvas
        const qrSize = 600;
        freshCtx.drawImage(qrImage, qrX - qrSize/2, qrY - qrSize/2, qrSize, qrSize);
      };
      
      qrImage.onerror = () => {
        // Draw a placeholder rectangle if QR code fails to load
        const freshCtx = canvas.getContext('2d');
        if (freshCtx) {
          // Set QR code size to exactly 600px for 3000px width canvas
          const qrSize = 600;
          freshCtx.fillStyle = '#ff0000';
          freshCtx.fillRect(qrX - qrSize/2, qrY - qrSize/2, qrSize, qrSize);
          freshCtx.fillStyle = '#ffffff';
          freshCtx.font = `${Math.round(qrSize/4)}px Arial`;
          freshCtx.textAlign = 'center';
          freshCtx.textBaseline = 'middle';
          freshCtx.fillText('QR', qrX, qrY);
        }
      };
      
      // Construct full URL for QR code
      const qrCodeUrl = selectedGuest.qr_code_path.startsWith('http') 
        ? selectedGuest.qr_code_path 
        : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/storage/${selectedGuest.qr_code_path}`;
      
      qrImage.src = qrCodeUrl;
    } else {
      // Draw a placeholder rectangle if no QR code
      // Set QR code size to exactly 600px for 3000px width canvas
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
    if (showCardClass && selectedGuest.card_class) {
      // Set font size to exactly 60px for 3000px width canvas
      const fontSize = 60;
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.fillStyle = '#333333';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(selectedGuest.card_class.name, cardClassX, cardClassY);
    }
  };

  const handlePositionChange = (field: string, value: number) => {
    setPositions(prev => ({
      ...prev,
      [field]: Math.max(0, Math.min(100, value))
    }));
  };

  const handleSavePositions = async () => {
    if (!cardType) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiService.updateCardType(cardType.id, {
        name: cardType.name,
        name_position_x: positions.name_x,
        name_position_y: positions.name_y,
        qr_position_x: positions.qr_x,
        qr_position_y: positions.qr_y,
        card_class_position_x: positions.card_class_x,
        card_class_position_y: positions.card_class_y,
        show_guest_name: showGuestName,
        show_card_class: showCardClass,
      });

      setSuccess('Card positions saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Error saving positions:', error);
      setError(error.message || 'Failed to save positions');
    } finally {
      setLoading(false);
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    // Small delay to ensure image is fully loaded
    setTimeout(() => {
      drawCard();
    }, 100);
  };

  // Add a function to check if image is ready and draw
  const checkImageAndDraw = () => {
    const image = imageRef.current;
    if (!image) {
      return;
    }

    if (image.complete && image.naturalWidth > 0 && image.naturalHeight > 0) {
      setImageLoaded(true);
      drawCard();
    } else {
      // Wait a bit more and try again
      setTimeout(checkImageAndDraw, 200);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, JPG, or GIF)');
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setError('File size must be less than 2MB');
      return;
    }

    // Validate image dimensions
    const img = new Image();
    img.onload = async () => {
      // Define allowed dimensions (maintaining 3000x4200 aspect ratio)
      const allowedDimensions = [
        [3000, 4200], // Original size
        [1500, 2100], // Half size
        [1000, 1400], // 1/3 size
        [750, 1050],  // 1/4 size
        [600, 840],   // 1/5 size
      ];
      
      const isValidDimension = allowedDimensions.some(([width, height]) => 
        img.width === width && img.height === height
      );
      
      if (!isValidDimension) {
        setError(getDimensionError(img.width, img.height));
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      // If dimensions are correct, proceed with upload
      await uploadFile(file);
    };

    img.onerror = () => {
      setError('Failed to load image for dimension validation. Please try again.');
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    img.src = URL.createObjectURL(file);
  };

  const getDimensionError = (actualWidth: number, actualHeight: number) => {
    // Define allowed dimensions (maintaining 3000x4200 aspect ratio)
    const allowedDimensions = [
      [3000, 4200], // Original size
      [1500, 2100], // Half size
      [1000, 1400], // 1/3 size
      [750, 1050],  // 1/4 size
      [600, 840],   // 1/5 size
    ];
    
    const dimensionList = allowedDimensions.map(([w, h]) => `${w}x${h}`).join(', ');
    
    let message = `Image dimensions must be exactly one of: ${dimensionList}. Your image is ${actualWidth}x${actualHeight} pixels.`;
    
    // Calculate aspect ratio
    const requiredRatio = 3000 / 4200; // 0.714
    const actualRatio = actualWidth / actualHeight;
    const ratioDifference = Math.abs(requiredRatio - actualRatio);
    
    // Add aspect ratio guidance
    if (ratioDifference > 0.01) {
      message += `\n\nAspect ratio mismatch: Your image ratio is ${actualRatio.toFixed(3)}, required is ${requiredRatio.toFixed(3)}`;
    }
    
    message += `\n\nTo fix this:\n• Resize your image to one of the allowed dimensions above\n• Maintain the aspect ratio of 3000:4200 (0.714)\n• Use an image editing tool like Photoshop, GIMP, or online resizers`;
    
    message += `\n\nRecommended dimensions:\n• 1500x2100 pixels (recommended for web)\n• 1000x1400 pixels (good for testing)\n• 3000x4200 pixels (best for printing)`;
    
    return message;
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const response = await apiService.uploadCardDesign(eventId, file) as CardDesignUploadResponse;
      setCurrentCardDesignPath(response.card_design_path);
      setSuccess(`Card design uploaded successfully! (${response.dimensions || 'Unknown dimensions'})`);
      
      // Notify parent component
      if (onCardDesignUpdate) {
        onCardDesignUpdate(response.card_design_path);
      }
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Error uploading card design:', error);
      
      // Handle specific backend validation errors
      if (error.message && error.message.includes('Invalid image dimensions')) {
        setError(error.message);
        if (error.allowed_dimensions) {
          setError(prev => prev + '\n\nAllowed dimensions: ' + error.allowed_dimensions.map((dim: number[]) => `${dim[0]}x${dim[1]}`).join(', '));
        }
      } else if (error.message && error.message.includes('Invalid image file')) {
        setError(error.message);
      } else {
        setError(error.message || 'Failed to upload card design');
      }
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteCardDesign = async () => {
    if (!currentCardDesignPath) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiService.deleteCardDesign(eventId);
      setCurrentCardDesignPath(undefined);
      setSuccess('Card design deleted successfully!');
      
      // Notify parent component
      if (onCardDesignUpdate) {
        onCardDesignUpdate('');
      }
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Error deleting card design:', error);
      setError(error.message || 'Failed to delete card design');
    } finally {
      setLoading(false);
    }
  };

  if (!currentCardDesignPath) {
    return (
      <div className="space-y-6">
        {/* Success/Error Messages */}
        {success && (
          <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}
        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="mb-6">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Card Design Uploaded</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Upload a card design image to start customizing the layout for your event invitations.
            </p>
            
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Upload Card Design'}
              </button>
              
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Supported formats: JPEG, PNG, JPG, GIF (max 2MB)
                <br />
                <strong>Allowed dimensions:</strong>
                <br />
                • 3000x4200 pixels (best for printing)
                <br />
                • 1500x2100 pixels (recommended for web)
                <br />
                • 1000x1400 pixels (good for testing)
                <br />
                • 750x1050 pixels (lightweight option)
                <br />
                • 600x840 pixels (minimal size)
                <br />
                <span className="text-orange-600 dark:text-orange-400">
                  Note: All dimensions maintain the same aspect ratio
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card Preview */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Card Preview</h3>
          
          {/* Guest Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Guest for Preview
            </label>
            <select
              value={selectedGuest?.id || ''}
              onChange={(e) => {
                const guest = guests.find(g => g.id === parseInt(e.target.value));
                setSelectedGuest(guest || null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Select a guest...</option>
              {guests.map(guest => (
                <option key={guest.id} value={guest.id}>
                  {guest.name} {guest.title && `(${guest.title})`}
                </option>
              ))}
            </select>
          </div>

          {/* Guest Name Toggle */}
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showGuestName}
                onChange={(e) => setShowGuestName(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Show guest name on card
              </span>
            </label>
          </div>

          {/* Canvas */}
          <div className="border border-gray-300 rounded-lg overflow-hidden dark:border-gray-600 bg-white">
            <div className="p-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Preview (3000x4200 pixels) - Scaled for display
              </p>
            </div>
            <div className="flex justify-center p-4">
              <canvas
                ref={canvasRef}
                width={3000}
                height={4200}
                className="w-full h-auto max-h-[600px] object-contain shadow-lg"
                style={{
                  aspectRatio: '3000/4200',
                  maxWidth: '100%',
                  maxHeight: '600px'
                }}
              />
              
              {/* Fallback display when card design is uploaded but not showing */}
              {currentCardDesignPath && !imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 bg-opacity-90">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Loading card design...</p>
                    <p className="text-xs text-gray-500 mt-1">Base64: {cardDesignBase64 ? 'Available' : 'Loading...'}</p>
                  </div>
                </div>
              )}
            </div>
            {!currentCardDesignPath && (
              <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-800">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No card design uploaded</p>
                  <p className="text-xs text-gray-400 mt-1">Upload a 3000x4200 pixel image to preview</p>
                </div>
              </div>
            )}
            <img
              ref={imageRef}
              src={cardDesignBase64 || ''}
              alt="Card Design"
              onLoad={handleImageLoad}
              onError={() => {
                setImageLoaded(false);
              }}
              crossOrigin="anonymous"
              className="hidden"
              style={{ display: 'none' }}
            />
          </div>
        </div>

        {/* Position Controls */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Position Settings</h3>
          
          <div className="space-y-4">
            {/* Show Guest Name Toggle */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showGuestNameToggle"
                checked={showGuestName}
                onChange={(e) => setShowGuestName(e.target.checked)}
                className="mr-2 h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
              />
              <label htmlFor="showGuestNameToggle" className="text-sm text-gray-700 dark:text-gray-300">
                Show Guest Name on Card
              </label>
            </div>

            {/* Guest Name Position - Only show when guest name is enabled */}
            {showGuestName && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Guest Name Position</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">X Position (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={positions.name_x}
                      onChange={(e) => handlePositionChange('name_x', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Y Position (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={positions.name_y}
                      onChange={(e) => handlePositionChange('name_y', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* QR Code Position - Always required */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                QR Code Position <span className="text-red-500">*</span>
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">QR codes are required for all cards</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">X Position (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={positions.qr_x}
                    onChange={(e) => handlePositionChange('qr_x', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Y Position (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={positions.qr_y}
                    onChange={(e) => handlePositionChange('qr_y', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Show Card Class Toggle */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showCardClassToggle"
                checked={showCardClass}
                onChange={(e) => setShowCardClass(e.target.checked)}
                className="mr-2 h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
              />
              <label htmlFor="showCardClassToggle" className="text-sm text-gray-700 dark:text-gray-300">
                Show Card Class on Card
              </label>
            </div>

            {/* Card Class Position - Only show when card class is enabled */}
            {showCardClass && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Card Class Position</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">X Position (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={positions.card_class_x}
                      onChange={(e) => handlePositionChange('card_class_x', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Y Position (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={positions.card_class_y}
                      onChange={(e) => handlePositionChange('card_class_y', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={handleSavePositions}
              disabled={loading}
              className="w-full px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Positions'}
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Instructions</h4>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <li>• <span className="text-blue-600 dark:text-blue-400">Allowed dimensions:</span></li>
              <li className="ml-4">  - 3000x4200 pixels (best for printing)</li>
              <li className="ml-4">  - 1500x2100 pixels (recommended for web)</li>
              <li className="ml-4">  - 1000x1400 pixels (good for testing)</li>
              <li className="ml-4">  - 750x1050 pixels (lightweight option)</li>
              <li className="ml-4">  - 600x840 pixels (minimal size)</li>
              <li>• Supported formats: JPEG, PNG, JPG, GIF (max 2MB)</li>
              <li>• Use the checkbox to show/hide guest names on cards</li>
              <li>• Use the checkbox to show/hide card class on cards</li>
              <li>• QR codes are required and will always appear on cards</li>
              <li>• Card class shows the guest's card type (SINGLE, DOUBLE, MULTIPLE)</li>
              <li>• Use the number inputs to adjust position percentages</li>
              <li>• X: 0 = left edge, 100 = right edge</li>
              <li>• Y: 0 = top edge, 100 = bottom edge</li>
              <li>• Changes are previewed in real-time</li>
              <li>• Click "Save Positions" to update the card type</li>
              <li className="text-orange-600 dark:text-orange-400">• All dimensions maintain the same aspect ratio</li>
            </ul>
          </div>

          {/* Card Design Management Buttons */}
          <div className="mt-6 space-y-3">
            <div className="flex space-x-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex-1 px-4 py-2 text-sm bg-brand-500 text-white rounded-md hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Change Design'}
              </button>
              <button
                onClick={handleDeleteCardDesign}
                disabled={true}
                className="flex-1 px-4 py-2 text-sm bg-gray-400 text-white rounded-md cursor-not-allowed opacity-50"
                title="Delete functionality is disabled"
              >
                Delete Design
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardDesign; 